# 20 — Interview Preparation (Exhaustive)

> Back to [README](./README.md) · Previous: [Problems & Solutions](./19-problems-solutions.md)

---

## Section A: Beginner Questions (1-25)

| # | Question | Answer |
|---|----------|--------|
| 1 | What is this project? | A campus marketplace MERN app for NIT Patna students to buy/sell used items |
| 2 | What stack do you use? | MongoDB, Express, React, Node.js + JWT, bcrypt, Multer, Cloudinary, Resend |
| 3 | Who can use this? | Students with `@nitp.ac.in` email + configured admin emails |
| 4 | How do users register? | `POST /api/auth/register/send-otp` → OTP email → `verify-otp` → JWT + user |
| 5 | How do users login? | `POST /api/auth/login` → bcrypt compare → JWT (7-day expiry) |
| 6 | Where is the JWT stored? | `localStorage` (token key + user JSON) |
| 7 | What is a REST API? | Resource-based HTTP API using GET/POST/PUT/PATCH/DELETE, stateless |
| 8 | What is MongoDB? | Document-oriented NoSQL database storing JSON-like documents |
| 9 | What is Mongoose? | ODM for MongoDB — provides schemas, validation, hooks, and populate() |
| 10 | What is React? | Component-based UI library for building SPAs with virtual DOM |
| 11 | What is Vite? | Next-gen build tool — fast HMR, ES module dev server, Rollup bundler |
| 12 | What is Axios? | Promise-based HTTP client with interceptors (used for JWT attachment) |
| 13 | What is JWT? | JSON Web Token — signed payload for stateless authentication |
| 14 | Why hash passwords? | bcrypt in User pre-save hook, cost factor 12, only when `isModified('password')` |
| 15 | What is CORS? | Cross-Origin Resource Sharing — server controls which origins can call API |
| 16 | What is Multer? | Express middleware for handling `multipart/form-data` (file uploads) |
| 17 | What is Cloudinary? | Cloud image CDN — persistent hosting with transformations and optimization |
| 18 | How many photos per listing? | Up to 8 (`MAX_PRODUCT_IMAGES` in `productImages.js`) |
| 19 | What categories exist? | Books, Electronics, Clothing, Furniture, Stationery, Sports, Other |
| 20 | Can guests browse? | Yes — auth needed for selling, chatting, commenting, wishlisting, feedback |
| 21 | What is the admin dashboard? | Stats, user management, product moderation, announcements CRUD, feedback inbox |
| 22 | What is `populate()`? | Mongoose method replacing ObjectId references with full documents (like SQL JOIN) |
| 23 | What is a SPA? | Single Page Application — one HTML file, client-side routing |
| 24 | What is the PWA support? | `manifest.json` + `<link rel="manifest">` enables mobile installation |
| 25 | What is the verified student badge? | 🎓 shown for users with `@nitp.ac.in` email (`isVerifiedStudent: true`) |

---

## Section B: Intermediate Questions (26-60)

| # | Question | Answer |
|---|----------|--------|
| 26 | Explain the full authentication flow | Register → send OTP → verify OTP → create User → sign JWT → store in localStorage → Axios interceptor attaches Bearer token → auth middleware verifies on every protected request |
| 27 | How does the admin system work? | Dual: `config/admins.js` email list + `User.role` field. `resolveRole()` checks both. Pre-save hook auto-promotes matching emails. Admin middleware checks after auth middleware |
| 28 | How does chat work technically? | POST creates Message doc (product or request context). GET retrieves thread. Frontend polls every 15s. Conversations grouped by `(contextType, contextId, otherUserId)` |
| 29 | Why are there two polling intervals? | ChatPanel: 15s (active conversation, less frequent). Navbar unread badge: 10s (quick awareness) |
| 30 | How are conversations grouped? | `messageRoutes.js` builds a Map with key `type:contextId:otherUserId`, tracking lastMessage, unread count, and participant roles |
| 31 | How are unread counts computed? | `Message.countDocuments({ receiver: userId, read: false })` — uses compound index |
| 32 | How are messages marked as read? | `updateMany` when recipient opens a thread — marks all messages from other user as `read: true` |
| 33 | Can you message yourself? | No — `senderId === recvId` check returns 400 |
| 34 | Explain the multi-image edit flow | Frontend sends `keepImages` JSON + new files. Backend: `nextImages = keep + new`. Removes `previous - next` from Cloudinary. Validates 1-8 total |
| 35 | How does the image fallback work? | `getStorageMode()` checks if Cloudinary env vars exist → uses Cloudinary or local disk. Frontend uses `resolveProductImageSrc()` → SVG placeholder if missing |
| 36 | Why is `GET /my/listings` before `GET /:id`? | Express matches routes in order. If `/:id` came first, "my" would be treated as an ObjectId → CastError |
| 37 | What is `optionalAuth` middleware? | Attaches user if valid token exists, but continues regardless. Used for announcements (read state) and requests (contact info visibility) |
| 38 | How does the NotificationBell work? | Fetches `/api/announcements` + `/api/announcements/unread-count`. Dropdown panel with mark-read. Polls every 60s. Click-outside and Escape to close |
| 39 | How does `ProtectedRoute` work? | Checks `useAuth().isAuthenticated` → renders children if true, else `<Navigate to="/login">` |
| 40 | How does `AdminRoute` work? | Checks `useAuth().isAdmin` → renders children or redirects to home |
| 41 | Explain the product spam system | Admin sets `isSpam: true` on product → `GET /api/products` filters with `{ isSpam: false }` → product hidden from browse but not deleted |
| 42 | How does WhatsApp deep linking work? | Strips non-numeric chars from phone, opens `https://wa.me/{phone}?text={encoded message}` in new tab |
| 43 | Explain the avatar upload flow | `PATCH /api/auth/me` with multipart → `multer` (1 file, 2MB) → delete old avatar from Cloudinary → upload new → save URL to user |
| 44 | How does account deletion cascade? | Deletes: avatar image, all products (+ their images), all comments, all messages (sent/received), all item requests, all request contacts, then the user document |
| 45 | How does the Vite proxy work? | `vite.config.js` proxies `/api` → `http://localhost:5000` and `/uploads` → same. Only active in dev mode |
| 46 | Why delete Content-Type for FormData? | Browser must set multipart boundary parameter. Manual Content-Type breaks Multer parsing |
| 47 | How does the feedback system work? | User submits via `FeedbackSection` on homepage → `POST /api/feedback` → admin sees in dashboard with status workflow: open → read → resolved |
| 48 | How does the announcement read system work? | `AnnouncementRead` collection with `{ user, announcement }` unique compound index. `upsert: true` prevents race conditions |
| 49 | What is the `formatProductImages` utility? | Normalizes product objects: extracts `imageUrls` array from either `imageUrls` or legacy `imageUrl` field, ensures consistent response shape |
| 50 | How does debounced search work? | `Home.jsx` wraps `fetchProducts` in 350ms `setTimeout`. Cleanup function clears timeout on dependency change. Prevents rapid API calls while typing |
| 51 | What is the splash screen? | Three-phase CSS animation: enter (0-400ms) → reveal (400-2200ms) → exit (2200-2800ms). Particles, aurora gradient, NIT Patna logo. Only shows once per session (sessionStorage) |
| 52 | How does the theme system prevent FOUC? | Inline script in `index.html` reads localStorage before React renders. Sets `data-theme` attribute immediately |
| 53 | How does the `mediaUrl()` utility work? | If URL is absolute (http/blob/data), returns as-is. Otherwise prepends API root. Handles both local `/uploads/` paths and full Cloudinary URLs |
| 54 | What is the email enumeration prevention? | `forgot-password` always returns "If an account with that email exists, a code has been sent" — even if email doesn't exist or user is banned |
| 55 | How does the daily digest cron work? | `node-cron` at midnight IST → reads NotificationQueue → groups by user → sends one digest email per user → clears queue |
| 56 | What is the `RequestContact` model for? | Tracks who clicked "I have this" on an item request. Unique index prevents duplicate contacts. Stores reference to auto-generated initial message |
| 57 | How does the "I have this" contact flow work? | Creates RequestContact → auto-generates Message → adds to NotificationQueue → returns conversation URL for redirect |
| 58 | What is the `PendingUser` TTL? | MongoDB TTL index on `createdAt` with 900s (15 minutes). Auto-deletes abandoned signup attempts |
| 59 | How is the OTP secured? | SHA-256 hashed before storage (not plaintext in DB). 10-min expiry. Max 5 attempts before auto-deletion. 60s cooldown between sends |
| 60 | What is `resolveRole()` vs `user.role`? | `resolveRole()` checks both the database `role` field AND the `config/admins.js` email list. A user could have `role: 'user'` but still be admin if their email is in the allowlist |

---

## Section C: Advanced & System Design Questions (61-100)

| # | Question | Answer |
|---|----------|--------|
| 61 | What are the trade-offs of JWT in localStorage? | Pro: Simple SPA auth, stateless. Con: XSS can steal token. Mitigation: 7-day expiry, move to httpOnly cookies for production |
| 62 | How would you scale this to 100K users? | Atlas text index for search, WebSocket for chat, Redis for caching unread counts, horizontal API scaling, CDN for frontend |
| 63 | How would you fix slow search? | MongoDB text index on title+description, or integrate Atlas Search / Elasticsearch for fuzzy matching |
| 64 | How would you prevent API abuse? | `express-rate-limit` on auth endpoints, CAPTCHA on registration, request throttling per IP |
| 65 | Describe IDOR risks in this project | Product edit/delete checks `product.seller === req.user.id`. Message send validates conversation context. Request delete checks ownership. Admin routes have middleware |
| 66 | Why is horizontal scaling easy with JWT? | Stateless — any server instance with the same `JWT_SECRET` can verify tokens. No session store synchronization needed |
| 67 | Would you need sticky sessions? | Not for current REST API. Yes if WebSockets added (Socket.io needs connection affinity, or use Redis adapter) |
| 68 | How would you migrate local images to Cloudinary? | Write migration script: scan `/uploads/`, upload each to Cloudinary, update MongoDB `imageUrls` with new URLs |
| 69 | Explain eventual consistency in the chat system | Polling has 10-15s window where messages exist in DB but aren't visible to recipient. Not truly eventually consistent — it's periodic polling |
| 70 | Where is optimistic UI used? | Wishlist: updates `AuthContext.user.wishlist` immediately, then fires API call. If API fails, state remains optimistic (no rollback) |
| 71 | What database indexes exist? | Message: 3 compound indexes. Comment: product+createdAt. Announcement: active+createdAt. AnnouncementRead: user+announcement unique. Feedback: status+createdAt. RequestContact: itemRequest+provider unique + requester |
| 72 | Why isn't account deletion transactional? | Uses parallel `Promise.all` deletes without MongoDB transaction. Risk: partial deletion if one operation fails. Fix: wrap in `session.withTransaction()` |
| 73 | How would you add payment escrow? | New PaymentTransaction model, integrate Razorpay/Stripe webhooks, escrow state machine (initiated → paid → delivered → released), buyer protection window |
| 74 | Compare WebSocket upgrade path | Socket.io with room-per-thread (`room: product:${id}:${userId}`). Store messages in MongoDB, emit to room. Redis adapter for multi-instance |
| 75 | Why bcrypt cost factor 12? | Balances security vs latency. At 12, hashing takes ~300ms — acceptable for registration but slow enough to resist brute force |
| 76 | Could you add refresh tokens? | Yes: short-lived access JWT (15 min) + long-lived refresh token in httpOnly cookie. Refresh endpoint issues new access token |
| 77 | Why not SSR for SEO on listings? | SPA design choice. Product pages are dynamic, not content-heavy for SEO. Could add Next.js for SSR/ISR if SEO becomes important |
| 78 | How would you add monitoring? | Sentry for error tracking, structured logging (Winston/Pino), health check endpoint, MongoDB Atlas monitoring, Render metrics |
| 79 | What load test bottlenecks would appear? | 1) MongoDB regex search without index. 2) Polling creating read amplification. 3) Image upload memory pressure. 4) Single process thread blocking |
| 80 | Explain CAP theorem for this system | MongoDB: CP in replica set mode (consistency over availability during partition). Our polling chat is AP-like (available but potentially stale) |
| 81 | Why not GraphQL? | REST sufficient for the feature set. Simpler mental model for MERN learning project. No complex nested query needs |
| 82 | When would microservices make sense? | If image processing, chat, and notifications need independent scaling. Current monolith is appropriate for team size and feature scope |
| 83 | How does the announcement read race condition work? | `findOneAndUpdate` with `upsert: true` on unique compound index. If two requests arrive simultaneously, one upserts and the other updates (idempotent) |
| 84 | Explain the DNS workaround in server.js | `require("node:dns/promises").setServers(["1.1.1.1","8.8.8.8"])` — overrides system DNS for reliable SRV record resolution on Render |
| 85 | How would you implement real-time notifications? | FCM (Firebase Cloud Messaging) for push, WebSocket for in-app. Notification preferences per user. Queue system (Bull) for reliability |
| 86 | Describe the Message model validation | Pre-validate hook: must have exactly one of `product` or `itemRequest` (XOR). Prevents orphan messages and dual-context bugs |
| 87 | How does the conversation draft system work? | URL params `?product=X&user=Y` → fetch product → `buildDraftFromProduct()` creates synthetic conversation object → ChatPanel renders empty thread with composer |
| 88 | What is the Product pre-save imageUrl sync? | `imageUrl = imageUrls[0]` — backward compatibility with older code that used single image. Runs on every save |
| 89 | How would you implement content moderation at scale? | ML classification service (OpenAI moderation API), auto-flag + review queue, user reporting system, word filters |
| 90 | Explain the CORS configuration strategy | Set of hardcoded origins + dynamic FRONTEND_URL + regex for Vercel preview deployments (`/^https:\/\/[\w-]+-[\w-]+\.vercel\.app$/`) + all localhost ports |

---

## Section D: "Why" Questions (91-110)

| # | Question | Answer |
|---|----------|--------|
| 91 | Why MERN over Next.js full-stack? | Separate SPA + API for independent deployment on Vercel + Render. Simpler mental model for learning |
| 92 | Why Resend over NodeMailer/Gmail SMTP? | Modern API-first email service. Better deliverability than Gmail SMTP. Cleaner integration (SDK). Free tier sufficient |
| 93 | Why memory storage in Multer? | Files stream directly to Cloudinary without touching disk. Works on ephemeral hosts like Render |
| 94 | Why `collection.insertOne` for OTP user creation? | Bypasses Mongoose pre-save hook (which would re-hash the already-hashed password). More control over the insert |
| 95 | Why vanilla CSS over Tailwind? | Full design control without class utility constraints. No build step for CSS. Custom glassmorphism design system. ~72KB for comprehensive styling |
| 96 | Why no Redux? | Only auth state is truly global. Local component state (`useState`) handles everything else. Context API sufficient |
| 97 | Why 7-day JWT expiry? | Campus users don't want to re-login frequently. Balances UX convenience vs security exposure window |
| 98 | Why SHA-256 for OTP hash (not bcrypt)? | OTPs are short-lived (10 min) and limited attempts (5). SHA-256 is fast and sufficient. bcrypt's slowness is unnecessary overhead |
| 99 | Why a separate PendingUser model? | Isolates unverified signup state from real users. TTL auto-cleanup. Prevents polluting the Users collection with abandoned registrations |
| 100 | Why cron for email digests instead of real-time? | Batches notifications to avoid email fatigue. One email per day is less intrusive than per-message emails. Simpler to implement |
| 101 | Why `sessionStorage` for splash screen? | Shows once per browser session, not once ever. User sees it when they open a new tab, but not on navigation |
| 102 | Why the BottomNav component? | Mobile UX pattern — persistent navigation for key actions. Includes elevated Sell FAB for primary CTA |
| 103 | Why store user in both localStorage and Context? | localStorage persists across page reloads. Context provides reactive React state. They sync: Context reads localStorage on init, writes on change |
| 104 | Why `node-cron` instead of external scheduler? | Simple, in-process, no external infrastructure needed. Suitable for single-instance deployment |
| 105 | Why auto-promote admin on save? | Ensures admin status even if User document was manually created or the role field was accidentally changed |
| 106 | Why Indian phone validation regex? | Campus is NIT Patna (India). Pattern: `^(\+91)?[6-9]\d{9}$` — validates 10-digit Indian mobile numbers |
| 107 | Why the `isSpam` field instead of deletion? | Allows admins to hide content without permanent loss. Can be reversed. Softer moderation approach |
| 108 | Why compound indexes on messages? | Optimizes the most common queries: finding threads by (product+users) and counting unread (receiver+read) |
| 109 | Why `escapeHtml()` in email templates? | Prevents stored XSS: user names could contain `<script>` tags. HTML emails render in recipient's mail client |
| 110 | Why does the frontend filter out picsum.photos URLs? | Legacy code used random stock photos as fallbacks. Newer code uses SVG placeholder. Filter prevents showing irrelevant images |

---

## Section E: Debugging Scenarios (111-120)

| # | Scenario | Diagnosis & Fix |
|---|----------|----------------|
| 111 | "Login works locally but fails on Vercel" | VITE_API_URL not set or wrong. Check Vercel env vars. Must point to Render backend URL. Redeploy after setting |
| 112 | "Images disappear after Render redeploy" | Using local storage on ephemeral disk. Solution: configure Cloudinary env vars |
| 113 | "CORS error in browser console" | Backend CORS allowlist doesn't include frontend URL. Add `FRONTEND_URL` to backend env |
| 114 | "Registration fails with 'Failed to send OTP'" | Resend API key invalid or missing. In dev: use dummy key, OTP printed to terminal. In prod: get real Resend key |
| 115 | "Admin dashboard shows 403" | User's email not in `config/admins.js` or token expired. Check `isAdmin` in stored user data |
| 116 | "Product upload timeout on Render" | Large images + Cloudinary latency. Reduce image count/size. Check Render instance is awake (free tier sleeps) |
| 117 | "Chat messages not appearing" | Check polling interval. Verify both users in same product/request context. Check MongoDB indexes exist |
| 118 | "Avatar not showing after update" | Verify `Content-Type` not set manually for FormData. Check `GET /auth/me` returns updated `avatarUrl` |
| 119 | "MongoDB connection failure on Render" | Check Atlas Network Access (IP allowlist). DNS workaround already in server.js. Verify MONGO_URI is correct |
| 120 | "'No listings found' despite having products" | Check `isSpam: false` filter. Check `status: 'available'` default filter. Verify search/category params |

---

## Section F: System Design Follow-ups (121-130)

| # | Question | How to answer |
|---|----------|--------------|
| 121 | "Design a notification system for this app" | Push (FCM/APNs) + in-app (WebSocket events) + email (current Resend). Notification preferences model. Fanout queue with Bull/Redis. Unread count cache in Redis |
| 122 | "Design payments for this marketplace" | Razorpay/Stripe integration. Order model (initiated → paid → shipped → delivered). Escrow: seller receives funds after buyer confirms. Webhook handlers for payment events. Refund flow |
| 123 | "How would you add search suggestions?" | Elasticsearch autocomplete or MongoDB Atlas Search with autocomplete operator. Debounced input → suggestion API → dropdown. Track popular searches for trending |
| 124 | "Design a review/rating system" | (Already partially implemented as comments). Add Rating model: user+product unique, 1-5 stars. Aggregate average on product. Prevent rating own products. Sort products by rating |
| 125 | "How would you add image moderation?" | Upload → queue → moderation service (Google Cloud Vision / AWS Rekognition) → auto-flag inappropriate. Admin review queue. NSFW detection before publishing |
| 126 | "Design multi-campus support" | Add campus/institution field to User model. Scope products to same campus by default. Cross-campus search option. Campus-specific admins and announcements |
| 127 | "How would you implement product recommendations?" | Collaborative filtering: "users who viewed X also viewed Y". Content-based: same category/price range. Simple: recently viewed + popular in category |
| 128 | "Design a disputes resolution system" | Report button → dispute model → admin queue → freeze transaction → evidence collection → resolution → refund/release |
| 129 | "How would you add real-time typing indicators?" | WebSocket rooms. Client sends `typing` event → server broadcasts to room. Debounce on client. Auto-clear after 3s inactivity |
| 130 | "Design the system for 10 NITs" | Multi-tenant: campus ID per user/product. Shared infrastructure, isolated data. Regional admins. Shared codebase, per-campus deployment or namespace |

---

## Section G: Resume & HR Questions (131-140)

| # | Question | Guidance |
|---|----------|----------|
| 131 | Why did you build this project? | Demonstrates full-stack ownership with a real problem (campus trading). Shows architecture decisions, deployment, and moderation |
| 132 | Was this a team or solo project? | Answer honestly. Mention pair programming, code reviews if applicable |
| 133 | What was the timeline? | Answer honestly. Mention iterative development |
| 134 | What was the biggest challenge? | Cloudinary migration (ephemeral storage → persistent CDN). Or: chat draft-thread deep linking bug |
| 135 | What would you improve? | WebSockets for chat, automated tests, rate limiting, refresh tokens, pagination, Elasticsearch |
| 136 | How did you test? | Manual testing. Mention that automated tests (Jest, Cypress) are a known gap and improvement area |
| 137 | Walk through one feature end-to-end | Best: multi-image listing (FormData → Multer → Cloudinary → MongoDB → React gallery). Or: OTP registration flow |
| 138 | Draw the architecture | Three boxes: React SPA → Express API → MongoDB. Side connections: Cloudinary for images, Resend for email |
| 139 | What scope did you NOT build? | Payments, AI/LLM, WebSockets, TypeScript, automated tests. Be proactive about honesty |
| 140 | What did you learn? | Full-stack deployment complexities, image storage strategies, chat UX patterns, OTP security, admin moderation design |

---

## Section H: Code-Specific Deep Dives (141-155)

| # | Question | Answer |
|---|----------|--------|
| 141 | What does `messagesSignature()` do in ChatPanel? | Creates a string hash of message IDs + read states. `setMessages` only updates if signature changes — prevents unnecessary re-renders during polling |
| 142 | Why does `getApiBase()` check for `/api` suffix? | The `VITE_API_URL` might be `https://api.example.com` or `https://api.example.com/api`. This normalization ensures `/api` is always appended correctly |
| 143 | What is `formatUser()` and why? | Creates a consistent plain object from Mongoose documents. Strips internal fields, resolves admin role, converts `_id` to `id` string. Used everywhere a user is returned in API |
| 144 | How does `parseKeepImages()` work? | Parses `keepImages` from request body (could be JSON string or array). Filters through `isValidStoredImageUrl()` — only allows Cloudinary or `/uploads/` URLs (prevents injection) |
| 145 | What is the `activeAnnouncementFilter()`? | Returns MongoDB query: `{ active: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }`. Filters out deactivated and expired announcements |
| 146 | Why does auth middleware set both `req.user` and `req.userDoc`? | `req.user` is the formatted plain object (for reading). `req.userDoc` is the Mongoose document (for saving changes like wishlist) |
| 147 | How does the Navbar unread count work? | `useEffect` with `setInterval` (10s) calling `GET /messages/unread-count`. Cleans up interval on unmount. Resets to 0 on logout |
| 148 | What is the `canManageProduct` function? | Returns `true` if `product.seller === user.id` (owner) OR `user.isAdmin`. Used for edit and delete authorization |
| 149 | How does `handleProductImageError` work? | Sets `img.onerror = null` (prevent loop) → replaces `src` with SVG placeholder. Never loads random stock photos |
| 150 | What is the `getGmailUrl()` utility? | Detects mobile via user agent. Mobile: returns `mailto:` URL (OS chooses handler). Desktop: returns Gmail compose URL (`mail.google.com/?view=cm`) |
| 151 | Why does the Product model have both `imageUrls` and `imageUrl`? | `imageUrls` is the modern array field. `imageUrl` is legacy single-image field. Pre-save hook syncs them. Maintains backward compatibility |
| 152 | How does the conversation draft merge with real conversations? | `listItems` prepends `draftConv` and filters out any existing conversation with same `(contextType, contextId, otherUserId)` to prevent duplicates |
| 153 | What happens when a banned user tries to use the app? | `auth.js` middleware returns 403 "Account suspended". They can't access any protected route. Login also checks and returns 403 |
| 154 | How does the phone validation work? | Regex: `/^(\+91)?[6-9]\d{9}$/` — accepts 10-digit Indian mobile numbers with optional +91 prefix. Whitespace and dashes stripped first |
| 155 | What is the DNS workaround in server.js? | `require("node:dns/promises").setServers(["1.1.1.1","8.8.8.8"])` — forces Cloudflare + Google DNS for reliable MongoDB SRV resolution on cloud hosts with unreliable default DNS |

---

> Back to [README](./README.md)
