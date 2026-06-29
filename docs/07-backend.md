# 07 — Backend Deep Dive

> Back to [README](./README.md) · Previous: [Auth & Authorization](./06-auth.md)

---

## Server Entry (`server.js`)

Key behaviors:

1. **DNS override:** `setServers(['1.1.1.1','8.8.8.8'])` — ensures reliable DNS for MongoDB Atlas on certain cloud hosts
2. **CORS strategy:** Allowlist of production URLs + Vercel preview regex + localhost fallback
3. **Body parsers:** `express.json()` + `urlencoded({ extended: true })`
4. **Static files:** `/uploads` served for local image fallback mode
5. **Route mounting:** 8 routers on `/api/*` prefixes
6. **Cron job:** Starts daily email digest cron on boot
7. **404 handler:** Catch-all for unmatched routes

---

## Route Modules

### `authRoutes.js` — Registration, Login, Profile

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/register/send-otp` | POST | No | Validate → hash password → generate OTP → upsert PendingUser → send email |
| `/register/verify-otp` | POST | No | Verify SHA-256 hash → create User (bypass hook) → sign JWT |
| `/register/resend-otp` | POST | No | Rate limit 60s → regenerate OTP → resend email |
| `/register` | POST | No | Legacy direct register (no OTP) |
| `/login` | POST | No | bcrypt compare → check banned → sign JWT |
| `/forgot-password` | POST | No | Anti-enumeration → OTP email → hash stored on User |
| `/reset-password` | POST | No | Verify OTP → hash new password → save |
| `/me` | GET | Yes | Return formatted user profile |
| `/me` | PATCH | Yes | Update phone/avatar (multer 1 file, 2MB) |
| `/me` | DELETE | Yes | Cascade delete: avatar, products, comments, messages, requests, contacts, user |
| `/wishlist/:productId` | POST/DELETE | Yes | Add/remove from wishlist array |

### `productRoutes.js` — Listings CRUD

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/my/listings` | GET | Yes | Seller's own products (registered BEFORE `/:id`) |
| `/` | GET | No | Browse with filters: search, category, price range, sort, status |
| `/:id` | GET | No | Single product with populated seller |
| `/` | POST | Yes | Create listing (multer 8 files, 5MB) → Cloudinary/local → save |
| `/:id` | PUT | Yes | Edit listing: `keepImages` + new files → reconcile → delete removed |
| `/:id/status` | PATCH | Yes | Toggle available/sold (seller only) |
| `/:id` | DELETE | Yes | Delete product + all images + comments + messages (seller or admin) |

### `messageRoutes.js` — Chat

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/unread-count` | GET | Yes | `countDocuments({ receiver, read: false })` |
| `/conversations` | GET | Yes | Group all messages into conversations by (contextType, contextId, otherUser) |
| `/:productId/:otherUserId` | GET | Yes | Get thread messages + mark as read |
| `/request/:requestId/:otherUserId` | GET | Yes | Same for request-context threads |
| `/` | POST | Yes | Send message → create NotificationQueue entry |

### `requestRoutes.js` — Item Requests

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Optional | List all requests (newest first, populated requester) |
| `/` | POST | Yes | Create request (requires phone on profile) |
| `/:id` | GET | Optional | Single request detail |
| `/:id/contact` | POST | Yes | "I have this" → create contact + auto message + notify |
| `/:id/status` | PATCH | Yes | Mark fulfilled/open (owner only) |
| `/:id` | DELETE | Yes | Delete request + contacts + related messages (owner or admin) |

### `adminRoutes.js` — Admin Dashboard

All require `auth` + `admin` middleware.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/stats` | GET | Counts: users, products, comments, spam, banned, openFeedback |
| `/users` | GET | List all users |
| `/products` | GET | List all products (including spam) |
| `/products/:id` | DELETE | Delete product + comments + messages |
| `/products/:id/spam` | PATCH | Toggle `isSpam` flag |
| `/comments/:id` | DELETE | Delete any comment |
| `/users/:id/ban` | PATCH | Toggle ban (blocked for admin users) |
| `/users/:id` | DELETE | Delete user + cascade (blocked for admin users) |
| `/announcements` | GET/POST | List/create announcements |
| `/announcements/:id` | PATCH/DELETE | Update/delete announcement |
| `/feedback` | GET | List all feedback |
| `/feedback/:id` | PATCH/DELETE | Update status/delete |

### `announcementRoutes.js` — Public Reading

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Optional | List active, non-expired announcements (with read state if logged in) |
| `/unread-count` | GET | Yes | Count unread announcements for user |
| `/read-all` | POST | Yes | Mark all as read (`updateMany` upserts) |
| `/:id/read` | POST | Yes | Mark one as read |

### `commentRoutes.js` — Product Comments

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/product/:productId` | GET | No | List comments (newest first, populated user) |
| `/product/:productId` | POST | Yes | Add comment (max 500 chars) |
| `/:id` | DELETE | Yes | Delete (owner or admin) |

### `feedbackRoutes.js` — User Feedback

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | POST | Yes | Submit feedback (subject + message) |

---

## Utility Modules

### `formatUser.js`

Normalizes user objects for API responses — consistent shape:

```javascript
{ id, name, email, role, isAdmin, isBanned, isEmailVerified,
  phone, avatarUrl, isVerifiedStudent, wishlist }
```

### `imageStorage.js`

Dual-mode image storage. See [Image Storage System](./11-image-storage.md) for full detail.

- `getStorageMode()` → `'cloudinary'` or `'local'`
- `saveUploadedFile(file)` → URL string
- `saveUploadedFiles(files)` → URL array
- `deleteStoredImage(url)` → Cloudinary destroy or fs.unlink

### `productImages.js`

- `MAX_PRODUCT_IMAGES = 8`
- `getProductImageList(product)` — extract URLs from `imageUrls` or legacy `imageUrl`
- `formatProductImages(product)` — normalize for API response
- `parseKeepImages(body)` — parse `keepImages` JSON from edit forms
- `unlinkProductImages(product)` — delete all images for a product

### `resendEmail.js`

Five email functions (all with dev-mode console fallback + `escapeHtml` XSS protection):

1. `sendOtpEmail(to, otp)` — signup OTP
2. `sendPasswordResetEmail(to, otp)` — forgot password OTP
3. `sendNewMessageEmail(to, senderName, productTitle, chatUrl)` — message notification
4. `sendRequestOfferEmail(to, providerName, requestTitle, chatUrl)` — "I have this" notification
5. `sendDigestEmail(to, userName, summary)` — daily digest

### `announcementQuery.js`

Returns MongoDB filter: `{ active: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }`

---

*Next: [Frontend Deep Dive →](./08-frontend.md)*
