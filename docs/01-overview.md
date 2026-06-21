# 01 — Project Overview

## What is NIT Patna Market?

**NIT Patna Market** (Campus Market) is a **peer-to-peer marketplace** for **NIT Patna students** to buy and sell second-hand items — textbooks, electronics, clothing, furniture, and more — within a campus-trusted environment.

Think of it as a **college-scoped OLX** with in-app messaging, reviews, comments, admin moderation, and campus announcements.

---

## Problem statement

| Problem | How this app addresses it |
|---------|---------------------------|
| Scattered WhatsApp/Facebook sale posts | Centralized searchable listings |
| No trust or moderation | Admin dashboard (spam, bans, feedback) |
| Hard to coordinate buyer–seller | Per-listing chat threads in MongoDB |
| Lost context on items | Multi-photo listings, categories, sold status |

---

## Who can use it?

From `backend/routes/authRoutes.js`:

- **Students:** must register with an **`@nitp.ac.in`** email (strong password rules).
- **Admins:** emails listed in `backend/config/admins.js` (also promoted to `role: 'admin'` on save).

**Not in this project:** open registration for any email domain (root `README.md` may be outdated).

---

## Feature list (current implementation)

### Core marketplace

| Feature | Description |
|---------|-------------|
| 🔐 Auth | Register, login, JWT (7 days), bcrypt passwords. Verified badge (🎓) for `@nitp.ac.in` emails |
| 📦 Listings | Create / edit / delete; up to **8 photos** per item |
| 🔍 Browse | Debounced search, category + min/max price filters, dynamic sorting |
| 📸 Images | **Cloudinary** (production) or local `uploads/` (dev fallback) |
| 🔴 Sold status | Toggle `available` / `sold` |
| 💬 Chat | Buyer–seller messages per product; inbox at `/messages` |
| ⭐ Reviews | 1–5 stars, one review per user per product |
| 💬 Comments | Public comments on product pages |
| ❤️ Wishlist | Save products with optimistic UI updates |
| 📢 Requests | Dedicated noticeboard to request specific items to buy |
| 📱 WhatsApp | Direct deep-link to seller's WhatsApp from product page |
| 📞 Direct Contact | Call and Email buttons on product and request pages for direct communication |
| 📧 Emails | Automated daily digest email notifications (via Resend API + node-cron) for new messages and request offers |
| 📱 PWA | Progressive Web App installable on mobile devices via manifest.json |

### User account

| Feature | Description |
|---------|-------------|
| 👤 Profile | Verified Indian mobile phone requirement, avatar upload/remove, delete account |
| 🔔 Announcements | Navbar bell; read/unread; admin-published notices |
| 📩 Feedback | Homepage section → admin feedback inbox |

### Admin

| Feature | Description |
|---------|-------------|
| 📊 Dashboard | Stats, users, products |
| 🚫 Moderation | Mark spam, ban users, delete content |
| 📢 Announcements | CRUD with priority, expiry |
| 📩 Feedback | Filter by status; resolve / delete |

### UX

- Dark glassmorphism UI (plain CSS design system)
- Responsive layout
- Product image gallery on detail page
- Multi-image picker with × remove before upload (`ImageUploader.jsx`)
- Toast notifications, loading states, empty states

---

## Tech stack

### Backend

| Technology | Role in this project |
|------------|---------------------|
| **Node.js + Express** | REST API |
| **MongoDB + Mongoose** | Data store (8 collections — see [02-architecture](./02-architecture.md)) |
| **JWT + bcrypt** | Stateless auth |
| **Multer** | Memory buffers for multipart uploads |
| **Cloudinary** | Permanent image CDN when env vars set |
| **dotenv** | Configuration |
| **cors** | Vercel + localhost origins |

### Frontend

| Technology | Role in this project |
|------------|---------------------|
| **React 18** | UI components |
| **Vite 8** | Dev server (port 3000), proxy to API |
| **React Router 6** | SPA routing, protected + admin routes |
| **Axios** | API + JWT interceptor |
| **Context API** | Global auth only |

### Deployment (from code & docs)

| Service | Typical use |
|---------|-------------|
| **Vercel** | Frontend (`vercel.json` SPA rewrites) |
| **Render** | Backend API |
| **MongoDB Atlas** | Database |
| **Cloudinary** | Images |

---

## What is intentionally NOT in this project

| Feature | Notes |
|---------|--------|
| **LLM / AI / RAG** | No OpenAI, embeddings, or vector DB |
| **WebSockets** | Chat uses HTTP **polling** (10–15s) |
| **Payments** | No Razorpay/Stripe |
| **Redux / TypeScript** | Not used |
| **Automated tests** | Not present in repo |

See [07-interview-guide.md](./07-interview-guide.md) for interview talking points.

---

## Documentation map

| Doc | Purpose |
|-----|---------|
| [02-architecture](./02-architecture.md) | Diagrams, flows, collections |
| [03-backend](./03-backend.md) | API & models (partial — cross-check with code) |
| [04-frontend](./04-frontend.md) | React structure |
| [05-chat-system](./05-chat-system.md) | Messaging design |
| [06-interview-qa](./06-interview-qa.md) | Short Q&A cheat sheet |
| **[07-interview-guide](./07-interview-guide.md)** | **Full interview preparation** |
| [CLOUDINARY_SETUP](./CLOUDINARY_SETUP.md) | Image hosting setup |
