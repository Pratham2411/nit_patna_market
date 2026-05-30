# 06 — Interview Q&A (Quick Reference)

> **For the full interview preparation guide** (100 questions, architecture deep dive, trade-offs, problems faced, resume questions), see **[07-interview-guide.md](./07-interview-guide.md)**.
>
> This file is a shorter cheat sheet. Read the answer, understand it, then say it in your own words.  
> **Note:** Some details below were updated May 2026 — prefer **07** and the codebase if anything conflicts.

### ⚠️ This project does NOT use AI/LLMs

No ChatGPT, RAG, embeddings, vector databases, or tool calling. If asked about AI, say it’s out of scope and describe what the app **does** use (MERN, JWT, Cloudinary, polling).

---

## 🏗️ General / Architecture

**Q: Tell me about your project.**

> "I built NIT Patna Market — a full-stack MERN campus marketplace where NIT Patna students list and buy second-hand items. It has JWT auth restricted to college emails, multi-photo listings on Cloudinary, search and filters, reviews and comments, polling-based buyer–seller chat, admin moderation, campus announcements, and user feedback. The backend is Express + MongoDB; the frontend is a React SPA with Vite."

---

**Q: Why did you choose the MERN stack?**

> "MongoDB works well for this kind of project because product listings have a flexible structure — different categories may have different attributes. Express is a minimal and well-understood framework for building REST APIs. React lets me build a dynamic UI with reusable components. And Node.js lets me use JavaScript on both sides, which reduces context switching."

---

**Q: What is a REST API?**

> "REST stands for Representational State Transfer. It's a design pattern for APIs where each URL represents a resource and HTTP methods define the operation. For example, `GET /api/products` fetches all products, `POST /api/products` creates one, `PUT /api/products/:id` updates it, and `DELETE /api/products/:id` removes it. RESTful APIs are stateless — each request contains everything the server needs to process it."

---

**Q: What is the difference between SQL and MongoDB? Why did you choose MongoDB?**

> "SQL databases use fixed schemas with tables and rows. MongoDB is a NoSQL document database — data is stored as JSON-like documents with flexible schemas. I chose MongoDB because the product schema can vary (a Book listing vs an Electronics listing), and MongoDB makes it easy to add fields without migrations. It also integrates naturally with JavaScript through Mongoose."

---

## 🔐 Authentication

**Q: How does JWT authentication work in your project?**

> "When a user registers or logs in, the server creates a JWT containing the user's ID, name, email, role, and isAdmin — signed with JWT_SECRET. The token is stored in localStorage. Axios attaches `Authorization: Bearer <token>` on each request. The auth middleware verifies the signature, loads the user from MongoDB (to check ban status), and sets req.user. Protected routes reject missing or invalid tokens."

---

**Q: Why use JWT instead of sessions?**

> "JWT is stateless — the server doesn't need to store anything. Sessions require server-side storage (like Redis), which becomes a problem when you scale horizontally across multiple servers. JWT tokens are self-contained and can be verified by any server instance with the secret key."

---

**Q: How do you store passwords securely?**

> "Passwords are hashed in a Mongoose pre-save hook with bcrypt (cost factor 12 in User.js). Only re-hashed when the password field changes. Login uses bcrypt.compare() against the stored hash."

---

**Q: What happens if someone steals a JWT?**

> "That's a valid concern. In this project, tokens expire after 7 days, which limits the damage window. In a production app, you'd also implement refresh tokens — short-lived access tokens (15 min) paired with long-lived refresh tokens stored in httpOnly cookies. httpOnly cookies can't be accessed by JavaScript, which protects against XSS attacks."

---

**Q: What is CORS and why do you need it?**

> "CORS blocks cross-origin requests by default. Our frontend (port 3000) and backend (port 5000) are different origins in dev. Express cors() allowlists Vercel URLs and localhost. Vite proxies /api in development so the browser often sees same-origin requests."

---

## 🗃️ Database & Mongoose

**Q: What is Mongoose and why use it?**

> "Mongoose is an ODM — Object Document Mapper — for MongoDB. It provides schema definition and validation, so you can enforce types, required fields, and enum values. It also provides the `populate()` method to join documents across collections, and pre/post hooks for things like hashing passwords before saving."

---

**Q: How does `.populate()` work?**

> "In MongoDB, documents reference other documents using ObjectIds. When you call `.populate('seller', 'name college')`, Mongoose does a second query to the users collection, fetches the document with that ObjectId, and replaces the ObjectId in the result with the actual user object — but only the `name` and `college` fields. It's similar to a SQL JOIN."

---

**Q: What is the difference between `findByIdAndUpdate` and `findById` + `save()`?**

> "In my project, I use `findById` + `save()` for updates because I need to run validation and pre-save hooks. `findByIdAndUpdate` bypasses Mongoose validators and hooks by default. `save()` triggers all middleware, so if I had a hook that modified data on save, it would run correctly."

---

**Q: Why does route order matter in Express?**

> "Express matches routes top to bottom. In my product routes, I have `GET /my/listings` and `GET /:id`. If `/:id` came first, Express would match `GET /my/listings` as `/:id` with `id = "my"`, then try `Product.findById("my")` which throws a CastError because 'my' isn't a valid ObjectId. So `/my/listings` must be registered before `/:id`."

---

## 🖼️ File Uploads

**Q: How does file upload work in your project?**

> "Multer parses multipart/form-data into memory buffers. We validate image MIME types and size (5MB). Files upload to Cloudinary when CLOUDINARY_* env vars are set (secure HTTPS URLs in MongoDB); otherwise local /uploads for dev. Listings support up to 8 images via imageUrls array. Axios must not set Content-Type manually on FormData — the browser adds the boundary."

---

**Q: What are the limitations of local file storage?**

> "We integrated Cloudinary (see docs/CLOUDINARY_SETUP.md). Without it, files go to local disk — which is wiped on Render redeploy. Production must set CLOUDINARY_CLOUD_NAME, API_KEY, and API_SECRET on the backend. Old /uploads paths break after redeploy unless re-uploaded."

---

## ⚛️ React & Frontend

**Q: What is a SPA and how does React Router work?**

> "SPA — Single Page Application. There's one HTML file. React Router handles navigation client-side by intercepting link clicks, updating the browser URL using the History API (no page reload), and rendering the component that matches the route. This makes navigation feel instant because you're just swapping React components, not loading a new HTML page."

---

**Q: Why use Context API instead of Redux?**

> "Context API is built into React and is sufficient for small-to-medium apps with limited global state. In this project, the only global state is the logged-in user. Redux adds a lot of boilerplate — actions, reducers, dispatch — which would be overkill here. If the app grew significantly (multiple complex shared states, time-travel debugging needs), Redux or Zustand would be more appropriate."

---

**Q: What is the purpose of the Axios interceptor?**

> "An interceptor runs before every request. I use it to automatically attach the JWT from localStorage to the Authorization header. Without it, I'd have to manually pass the token in every API call. The interceptor does it once, centrally."

---

**Q: What is debouncing and why do you use it for search?**

> "Debouncing delays a function call until a certain time has passed since the last invocation. For search, I wait 350ms after the user stops typing before firing the API request. Without debouncing, every keystroke would trigger a request — if the user types 'electronics', that's 11 requests. With debouncing, it's just one."

---

**Q: What is useCallback and why do you use it in the chat polling?**

> "useCallback returns a memoized version of a function — the same function reference across renders unless its dependencies change. In Chat.jsx, `fetchMessages` is used as a dependency of the `useEffect` that sets up `setInterval`. Without `useCallback`, `fetchMessages` would be a new function reference on every render, causing the `useEffect` to re-run endlessly — infinite polling setups. `useCallback` stabilizes the reference."

---

## 💬 Chat System

**Q: Why did you choose polling over WebSockets?**

> "ChatPanel polls every 15 seconds; the navbar unread badge polls every 10 seconds. For campus marketplace chat that's acceptable. WebSockets would be faster but add stateful connections and deployment complexity. MongoDB remains the source of truth either way."

---

**Q: How would you upgrade this to real WebSockets?**

> "I'd add Socket.io. The MongoDB save stays the same — when a message is saved, the server emits a `new-message` event to the specific room (e.g. `room:productId:userId1:userId2`). The client listens on that room and appends the message to state immediately. The key insight is: MongoDB is still the source of truth, Socket.io just handles delivery. The polling fallback could stay for cases where the WebSocket connection drops."

---

**Q: How do read receipts work?**

> "The Message model has a `read` boolean field, defaulting to `false`. When a user opens a chat, the backend runs `Message.updateMany()` to mark all messages from the other person as `read: true`. On the sender's side, the next polling cycle (within 3 seconds) fetches updated messages and sees `read: true`, rendering ✓✓ instead of ✓."

---

## 🔒 Security & Edge Cases

**Q: How do you prevent a user from editing or deleting another user's listing?**

> "Every edit, delete, and status-change route first fetches the product and checks that `product.seller.toString() === req.user.id`. If they don't match, it returns a 403 Forbidden. `req.user.id` comes from the verified JWT — it can't be spoofed because it would invalidate the signature."

---

**Q: What validations do you have?**

> "Backend: required field checks, bcrypt minimum password length, email uniqueness check before creating users, enum validation in Mongoose (only allowed categories), file MIME type validation in Multer, self-messaging prevention in the chat routes. Frontend: HTML required attributes, price > 0 check, password length check before hitting the server."

---

**Q: What would you add if you had more time?**

> "Email verification to ensure students actually use a college email. Razorpay payment integration so the transaction can happen in-app. Push notifications when you receive a new message. A reporting system for flagging scam listings. And I'd move image storage to Cloudinary for production reliability."

---

## 🚀 Performance & Scalability

**Q: How does your search perform at scale?**

> "Currently it uses MongoDB's `$regex` which does a full collection scan — O(n). At scale, I'd add a text index on the `title` field: `productSchema.index({ title: 'text' })`, which enables efficient `$text: { $search: query }` queries — much faster. For very high scale, I'd use Elasticsearch."

---

**Q: How would you scale this application?**

> "The backend is stateless (no server-side sessions), so it can be horizontally scaled behind a load balancer. MongoDB can be replicated with replica sets for read scaling. Static files (images) would move to CDN-backed cloud storage. The React frontend is already a static bundle that can be served from any CDN."

---

## 📋 Quick-fire Answers

| Question | Answer |
|---------|--------|
| What port does the backend run on? | **5000** default (`PORT` in `.env`); Vite proxy targets 5000 |
| Max photos per listing? | **8** |
| Image storage in production? | **Cloudinary** (if env configured) |
| Does this use AI/LLMs? | **No** |
| Signup email rule? | **@nitp.ac.in** (+ admin allowlist) |
| Where is the JWT secret stored? | `.env` file, accessed via `process.env.JWT_SECRET` |
| How long do tokens last? | 7 days |
| What HTTP method is used to mark as sold? | PATCH (partial update, not full replacement) |
| Why PATCH and not PUT for status? | PUT replaces the whole document; PATCH updates one field |
| What is `populate()` equivalent in SQL? | JOIN |
| What does `dotenv.config()` do? | Loads `.env` variables into `process.env` |
| What is `nodemon`? | Dev tool that auto-restarts Node server on file change |
| What is Vite's proxy doing? | Forwarding `/api/*` requests from port 3000 to port 5001 |
| How does auto-scroll to bottom work in Chat? | `useRef` on a dummy `<div>` at the end, `ref.current.scrollIntoView()` |
