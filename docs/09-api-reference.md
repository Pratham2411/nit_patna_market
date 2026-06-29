# 09 — API Reference

> Back to [README](./README.md) · Previous: [Frontend Deep Dive](./08-frontend.md)

---

## Auth Routes (`/api/auth`)

| Method | Endpoint | Auth | Body/Params | Response | Purpose |
|--------|----------|------|-------------|----------|---------|
| POST | `/register/send-otp` | No | `{ name, email, password }` | `{ message, email }` | Initiate OTP signup |
| POST | `/register/verify-otp` | No | `{ email, otp }` | `{ token, user }` | Complete signup |
| POST | `/register/resend-otp` | No | `{ email }` | `{ message }` | Resend OTP (60s cooldown) |
| POST | `/register` | No | `{ name, email, password }` | `{ token, user }` | Legacy direct register |
| POST | `/login` | No | `{ email, password }` | `{ token, user }` | Login |
| POST | `/forgot-password` | No | `{ email }` | `{ message }` | Send reset OTP |
| POST | `/reset-password` | No | `{ email, otp, newPassword }` | `{ message }` | Reset with OTP |
| GET | `/me` | Yes | — | `{ user }` | Get current profile |
| PATCH | `/me` | Yes | FormData: `phone`, `image`, `removeAvatar` | `{ user }` | Update profile |
| DELETE | `/me` | Yes | — | `{ message }` | Delete account + cascade |
| POST | `/wishlist/:productId` | Yes | — | `{ wishlist }` | Add to wishlist |
| DELETE | `/wishlist/:productId` | Yes | — | `{ wishlist }` | Remove from wishlist |

---

## Product Routes (`/api/products`)

| Method | Endpoint | Auth | Body/Params | Response | Purpose |
|--------|----------|------|-------------|----------|---------|
| GET | `/my/listings` | Yes | — | `[Product]` | Seller's own listings |
| GET | `/` | No | Query: `search`, `category`, `minPrice`, `maxPrice`, `status`, `sortBy` | `[Product]` | Browse with filters |
| GET | `/:id` | No | — | `Product` | Single product detail |
| POST | `/` | Yes | FormData: fields + `images[]` | `Product` | Create listing |
| PUT | `/:id` | Yes | FormData: fields + `images[]` + `keepImages` | `Product` | Edit listing |
| PATCH | `/:id/status` | Yes | `{ status }` | `Product` | Toggle available/sold |
| DELETE | `/:id` | Yes | — | `{ message }` | Delete listing + images |

---

## Message Routes (`/api/messages`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/unread-count` | Yes | Count of unread messages |
| GET | `/conversations` | Yes | Grouped conversation list |
| GET | `/:productId/:otherUserId` | Yes | Thread messages (product) |
| GET | `/request/:requestId/:otherUserId` | Yes | Thread messages (request) |
| POST | `/` | Yes | Send message (with notification queue) |

---

## Admin Routes (`/api/admin`)

**All require auth + admin middleware.**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/stats` | Dashboard counts (users, products, comments, spam, banned, openFeedback) |
| GET | `/users` | List all users |
| GET | `/products` | List all products (including spam) |
| DELETE | `/products/:id` | Delete product + comments + messages |
| PATCH | `/products/:id/spam` | Toggle spam flag |
| DELETE | `/comments/:id` | Delete any comment |
| PATCH | `/users/:id/ban` | Toggle user ban |
| DELETE | `/users/:id` | Delete user + all data |
| GET/POST/PATCH/DELETE | `/announcements[/:id]` | Full CRUD on announcements |
| GET/PATCH/DELETE | `/feedback[/:id]` | View + manage user feedback |

---

## Other Routes

| Prefix | Method | Endpoint | Auth | Purpose |
|--------|--------|----------|------|---------|
| `/api/announcements` | GET | `/` | Optional | List active announcements |
| `/api/announcements` | GET | `/unread-count` | Yes | Unread announcement count |
| `/api/announcements` | POST | `/read-all` | Yes | Mark all as read |
| `/api/announcements` | POST | `/:id/read` | Yes | Mark one as read |
| `/api/comments` | GET | `/product/:productId` | No | Get product comments |
| `/api/comments` | POST | `/product/:productId` | Yes | Add comment |
| `/api/comments` | DELETE | `/:id` | Yes | Delete (owner or admin) |
| `/api/feedback` | POST | `/` | Yes | Submit feedback |
| `/api/requests` | GET | `/` | Optional | List item requests |
| `/api/requests` | POST | `/` | Yes | Create item request |
| `/api/requests` | GET | `/:id` | Optional | Get single request |
| `/api/requests` | POST | `/:id/contact` | Yes | "I have this" flow |
| `/api/requests` | DELETE | `/:id` | Yes | Delete (owner or admin) |
| `/api/requests` | PATCH | `/:id/status` | Yes | Mark fulfilled/open |

---

*Next: [Feature Walkthroughs →](./10-feature-walkthroughs.md)*
