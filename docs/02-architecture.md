# 02 — Architecture & Data Flow

> **Updated May 2026.** Sections below marked *legacy* may describe older structure.  
> For interview prep see **[07-interview-guide.md](./07-interview-guide.md)**.  
> Verify ports and routes in `backend/server.js` and `frontend/vite.config.js`.

## System Architecture (current)

```mermaid
graph TD
    Client[React SPA - Vite] -->|HTTPS REST API| Express[Node.js / Express Server]
    Express -->|Mongoose ORM| MongoDB[(MongoDB Atlas)]
    Express -->|Upload Stream| Cloudinary[Cloudinary Image CDN]
    Express -->|Trigger Email| Resend[Resend Email API]
    
    subgraph Frontend Client
    UI[Components & Pages]
    Context[Auth & Theme Context]
    Axios[Axios HTTP Client]
    UI --- Context
    UI --- Axios
    end
```

### MongoDB collections (current)

| Collection | Model |
|------------|--------|
| users | User.js (`wishlist[]`, `isVerifiedStudent`) |
| products | Product.js (`imageUrls[]`, `imageUrl` cover) |
| messages | Message.js |
| itemrequests | ItemRequest.js |
| comments | Comment.js |
| reviews | Review.js |
| announcements | Announcement.js |
| announcementreads | AnnouncementRead.js |
| feedbacks | Feedback.js |

---

## System Architecture *(legacy diagram — outdated ports/routes)*

```
Browser (React SPA @ localhost:3000)
        │
        │  HTTP Requests (Axios)
        │  via Vite proxy → localhost:5001
        ▼
Express Server (Node.js @ localhost:5001)
        │
        ├── /api/auth      → authRoutes.js
        ├── /api/products  → productRoutes.js
        ├── /api/messages  → messageRoutes.js
        └── /uploads       → static file serving (Multer images)
        │
        ▼
MongoDB (localhost:27017 / college-marketplace DB)
        │
        ├── users      collection
        ├── products   collection
        └── messages   collection
```

---

## Folder Structure

```
college-marketplace/
│
├── backend/
│   ├── server.js              ← Entry point. Sets up Express, routes, static files
│   ├── .env                   ← PORT, MONGO_URI, JWT_SECRET (never commit this)
│   ├── config/
│   │   └── db.js              ← Mongoose.connect() logic
│   ├── middleware/
│   │   └── auth.js            ← JWT verification middleware (protects routes)
│   ├── models/
│   │   ├── User.js            ← Schema: name, email, password (hashed), college
│   │   ├── Product.js         ← Schema: title, price, category, imageUrl, seller ref, status
│   │   └── Message.js         ← Schema: product ref, sender ref, receiver ref, text, read
│   ├── routes/
│   │   ├── authRoutes.js      ← POST /register, POST /login
│   │   ├── productRoutes.js   ← Full CRUD + search/filter + my/listings
│   │   └── messageRoutes.js   ← Send, fetch thread, conversations, unread count
│   └── uploads/               ← Local image files (gitignored)
│
├── frontend/
│   ├── index.html             ← Root HTML with Inter font
│   ├── vite.config.js         ← Vite config with proxy to backend
│   └── src/
│       ├── main.jsx           ← React entry point (ReactDOM.createRoot)
│       ├── App.jsx            ← Router + all route definitions
│       ├── index.css          ← Complete design system (variables, components, animations)
│       ├── api/
│       │   └── axios.js       ← Axios instance with JWT interceptor
│       ├── context/
│       │   └── AuthContext.jsx ← Global user state (login/logout/isAuthenticated)
│       ├── components/
│       │   ├── Navbar.jsx     ← Top nav with auth-aware links + unread badge
│       │   ├── ProductCard.jsx ← Reusable card for product listings
│       │   └── ProtectedRoute.jsx ← Redirects to /login if not authenticated
│       └── pages/
│           ├── Home.jsx       ← Browse page with search/filter grid
│           ├── Login.jsx      ← Login form
│           ├── Register.jsx   ← Register form
│           ├── ProductDetail.jsx ← Single product with seller actions
│           ├── SellItem.jsx   ← Create / Edit listing form
│           ├── Dashboard.jsx  ← My listings with stats
│           ├── Chat.jsx       ← Chat window with polling
│           └── Conversations.jsx ← Message inbox
│
└── docs/                      ← This folder!
```

---

## Key Data Flows

### 1. User Registration Flow
```mermaid
sequenceDiagram
    participant User
    participant React
    participant Express
    participant MongoDB

    User->>React: Submit Register Form
    React->>Express: POST /api/auth/register { email, pass }
    Express->>Express: Check if email ends in @nitp.ac.in
    Express->>Express: bcrypt.hash(password)
    Express->>MongoDB: Save User (isVerifiedStudent: true)
    MongoDB-->>Express: Returns saved User
    Express->>Express: Generate JWT
    Express-->>React: { token, user }
    React->>React: AuthContext.login(token)
    React-->>User: Redirect to Home
```

### 2. Protected API Request Flow
```
User visits /sell (SellItem.jsx)
  → ProtectedRoute checks: useAuth().isAuthenticated
  → If false → <Navigate to="/login" />
  → If true → render SellItem

SellItem submits form
  → Axios POST /api/products (FormData)
  → axios.js interceptor: reads token from localStorage → sets Authorization: Bearer <token>
  → Server: auth middleware → jwt.verify(token) → attaches req.user
  → Route handler: uses req.user.id as seller
```

### 3. Image Upload Flow
```mermaid
sequenceDiagram
    participant User
    participant React
    participant Express (Multer)
    participant Cloudinary
    participant MongoDB

    User->>React: Selects image & clicks submit
    React->>Express: POST /api/products (FormData)
    Express->>Express (Multer): Parse multipart/form-data into Buffer
    Express (Multer)->>Cloudinary: upload_stream(Buffer)
    Cloudinary-->>Express: Returns { secure_url }
    Express->>MongoDB: Save Product document with secure_url array
    MongoDB-->>Express: Returns saved Product
    Express-->>React: 201 Created (Product JSON)
```

### 4. Chat Polling Flow
```
Buyer clicks "Chat with Seller" on ProductDetail
  → Navigates to /chat/:productId/:sellerId

Chat.jsx mounts
  → fetchMessages() → GET /api/messages/:productId/:sellerId
  → Server: finds messages WHERE (sender=me AND receiver=seller) OR (sender=seller AND receiver=me)
  → Server: marks received messages as read (UPDATE read=true)
  → Frontend: renders bubbles, scrolls to bottom

setInterval(fetchMessages, 3000) — polls every 3 seconds
  → Gets new messages from MongoDB
  → Updates state → React re-renders new bubbles

User sends message
  → POST /api/messages { productId, receiverId, text }
  → Server: saves Message to MongoDB
  → Frontend: appends to state immediately (optimistic update)
```

---

## MongoDB Collections (Data Models)

### users
```json
{
  "_id": "ObjectId",
  "name": "Aditya Madhav",
  "email": "aditya@nitp.ac.in",
  "password": "$2a$10$...",  // bcrypt hash, never plain text
  "college": "NIT Patna",
  "createdAt": "2024-01-15T...",
  "updatedAt": "2024-01-15T..."
}
```

### products
```json
{
  "_id": "ObjectId",
  "title": "Engineering Mathematics Vol. 1",
  "description": "Good condition, 3rd edition",
  "price": 250,
  "category": "Books",
  "imageUrl": "/uploads/1705312345-book.jpg",
  "seller": "ObjectId → users",  // reference
  "status": "available",          // "available" | "sold"
  "createdAt": "...",
  "updatedAt": "..."
}
```

### messages
```json
{
  "_id": "ObjectId",
  "product":  "ObjectId → products",
  "sender":   "ObjectId → users",
  "receiver": "ObjectId → users",
  "text": "Is this still available?",
  "read": false,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### itemrequests
```json
{
  "_id": "ObjectId",
  "requester": "ObjectId → users",
  "title": "Engineering Graphics Kit",
  "description": "Looking for a 1st year EG kit...",
  "category": "Stationery",
  "status": "open",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## API Route Map

### Auth routes (`/api/auth`)
| Method | Endpoint | Auth | Body | Returns |
|--------|----------|------|------|---------|
| POST | `/register` | No | `{name, email, password, college}` | `{token, user}` |
| POST | `/login` | No | `{email, password}` | `{token, user}` |

### Product routes (`/api/products`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Browse with `?search=&category=&minPrice=&maxPrice=` |
| GET | `/my/listings` | Yes | Current user's listings |
| GET | `/:id` | No | Single product (populates seller) |
| POST | `/` | Yes | Create listing (multipart/form-data) |
| PUT | `/:id` | Yes | Edit own listing |
| PATCH | `/:id/status` | Yes | Toggle sold/available |
| DELETE | `/:id` | Yes | Delete own listing + image file |

### Message routes (`/api/messages`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/unread-count` | Yes | Count of unread messages |
| GET | `/conversations` | Yes | All conversations (grouped, deduplicated) |
| GET | `/:productId/:otherUserId` | Yes | Fetch + auto-read a conversation thread |
| POST | `/` | Yes | Send a message `{productId, receiverId, text}` |
