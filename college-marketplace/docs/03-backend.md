# 03 — Backend Deep Dive

## Entry Point: `server.js`

```js
const express = require('express');
const cors    = require('cors');
dotenv.config();       // Load .env variables
connectDB();           // Connect to MongoDB

app.use(cors());                   // Allow cross-origin from React (port 3000)
app.use(express.json());           // Parse JSON request bodies
app.use('/uploads', express.static(...)); // Serve images as static files

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/messages', messageRoutes);
```

**Why `cors()`?** The browser blocks cross-origin requests by default. Our frontend runs on port 3000, backend on port 5001 — different origins. `cors()` adds `Access-Control-Allow-Origin: *` headers to allow this.

**Why `express.json()`?** Without this, `req.body` is `undefined` for JSON requests. This middleware parses the `Content-Type: application/json` body.

---

## Authentication: JWT Flow

### What is JWT?
JWT = JSON Web Token. A self-contained, signed token that proves identity.

Structure: `header.payload.signature`

```
eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY2YWEiLCJuYW1lIjoiQWRpdHlhIn0.xYz...
       HEADER                      PAYLOAD                    SIGNATURE
```

The **payload** contains: `{ id, name, email, college }` — so the server knows who the user is **without hitting the database**.

The **signature** is made with `JWT_SECRET`. Tamper with the payload → signature mismatch → rejected.

### Why JWT over sessions?
- **Stateless** — server doesn't store anything. Scales horizontally.
- **Self-contained** — user info is in the token itself
- **Expiry** — tokens expire after 7 days (`expiresIn: '7d'`)

### Auth Middleware (`middleware/auth.js`)

```js
module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.slice(7); // Remove "Bearer "
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // { id, name, email, college }
    next();              // Pass control to the route handler
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};
```

Applied as middleware on protected routes:
```js
router.post('/', auth, upload.single('image'), async (req, res) => {
  // req.user is now available here
  const product = await Product.create({ seller: req.user.id, ... });
});
```

---

## Database Models (Mongoose)

### Why Mongoose over raw MongoDB driver?
- **Schema validation** — enforces field types, required fields, enums
- **Pre-save hooks** — auto-hash passwords before saving
- **`populate()`** — join documents across collections (like SQL JOIN)
- **Built-in timestamps** — `createdAt` and `updatedAt` automatically

### User Model

```js
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  college:  { type: String, required: true },
}, { timestamps: true });

// Pre-save hook: runs BEFORE every .save()
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next(); // Only hash if changed
  this.password = await bcrypt.hash(this.password, 10); // 10 = salt rounds
  next();
});
```

`bcrypt.hash(password, 10)` — the `10` is the cost factor. Higher = slower but safer. 10 is the industry standard balance.

### Product Model

```js
const CATEGORIES = ['Books', 'Electronics', 'Clothing', 'Furniture', 'Stationery', 'Sports', 'Other'];

const productSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  category:    { type: String, required: true, enum: CATEGORIES }, // Only allowed values
  imageUrl:    { type: String, default: '' },
  seller:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:      { type: String, enum: ['available', 'sold'], default: 'available' },
});
```

`seller: { ref: 'User' }` — this is a **reference** (like a foreign key). When you call `.populate('seller', 'name college')`, Mongoose fetches the User document and replaces the ObjectId with the actual user object.

---

## File Uploads: Multer

### What is Multer?
Multer is Express middleware for handling `multipart/form-data` — the format used when uploading files.

```js
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads')); // Save to /uploads
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Images only'));
    cb(null, true);
  },
});
```

Applied on routes:
```js
router.post('/', auth, upload.single('image'), async (req, res) => {
  // req.file = { filename, path, mimetype, size, ... }
  // req.body = { title, price, ... }
});
```

`upload.single('image')` — expects one file with the field name `image` in the form.

### Placeholder images
If no file is uploaded, we use `picsum.photos`:
```js
const imageUrl = req.file
  ? `/uploads/${req.file.filename}`
  : `https://picsum.photos/seed/${encodeURIComponent(title)}/600/400`;
```

`picsum.photos/seed/TITLE/600/400` returns a **consistent** placeholder for the same title — same listing always gets the same image.

---

## Search & Filter Logic

```js
const query = {};

if (search)   query.title = { $regex: search, $options: 'i' }; // Case-insensitive regex
if (category) query.category = category;                        // Exact match
query.status = status || 'available';                           // Default: only show available

if (minPrice || maxPrice) {
  query.price = {};
  if (minPrice) query.price.$gte = Number(minPrice); // Greater than or equal
  if (maxPrice) query.price.$lte = Number(maxPrice); // Less than or equal
}

const products = await Product.find(query)
  .populate('seller', 'name college')
  .sort({ createdAt: -1 }); // Newest first
```

`$regex` = MongoDB regex operator. `$gte` / `$lte` = comparison operators. `.populate()` replaces the `seller` ObjectId with the actual user's `name` and `college` fields.

---

## Route Order Matters

In Express, routes are matched **top to bottom**. This is why `GET /my/listings` is registered **before** `GET /:id`:

```js
router.get('/my/listings', auth, ...); // ← Must be first
router.get('/:id', ...);               // ← Would catch "my" as :id if placed first!
```

If `/:id` came first, Express would try `Product.findById("my")` → MongoDB throws a CastError because "my" is not a valid ObjectId.

---

## Security Practices Applied

| Practice | Implementation |
|---------|---------------|
| Password hashing | bcrypt with 10 salt rounds |
| JWT expiry | Tokens expire in 7 days |
| Ownership checks | Every edit/delete route verifies `product.seller === req.user.id` |
| Input validation | Required field checks on all POST/PUT routes |
| File type validation | Multer fileFilter rejects non-image MIME types |
| .env secrets | JWT_SECRET and MONGO_URI never hardcoded |
