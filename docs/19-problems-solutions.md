# 19 — Problems Faced & Solutions

> Back to [README](./README.md) · Previous: [Design Decisions](./18-design-decisions.md)

---

### 1. Images Replaced by Random Stock Photos
- **Problem:** Listing photos changed to unrelated images after server redeployment.
- **Root cause:** 
  1. Render's ephemeral disk deleted the local `/uploads/` directory on every redeploy.
  2. The frontend `onError` handler fell back to `picsum.photos` (random images) when it couldn't find the file.
- **Solution:** Integrated Cloudinary for persistent CDN storage. Replaced the random fallback with a neutral SVG placeholder. Added `isLegacyRandomPlaceholder()` to filter out old picsum URLs.
- **Lesson:** Never use random URL fallbacks for user content; use cloud storage in production.

---

### 2. Profile Picture Not Persisting After Logout
- **Problem:** Avatar appeared during the session but was gone after re-login.
- **Root cause:** The Axios interceptor explicitly set `Content-Type: multipart/form-data`. This prevented the browser from appending the crucial `boundary` parameter, causing Multer to fail silently.
- **Solution:** Removed the `Content-Type` header for `FormData` in the interceptor (letting the browser set it automatically). Added `GET /auth/me` refresh on AuthContext mount.
- **Lesson:** Let the browser set multipart Content-Type boundaries.

---

### 3. "Chat with Seller" Opened Empty Inbox
- **Problem:** Clicking "Chat with Seller" navigated to `/messages`, but showed "No messages yet" with no way to compose the first message.
- **Root cause:** `Conversations.jsx` only rendered threads that already existed in the database (via the conversation list).
- **Solution:** Added a "draft conversation" system. URL params `?product=X&user=Y` now bootstrap a synthetic thread via `buildDraftFromProduct()`, allowing ChatPanel to render an empty thread with a composer.
- **Lesson:** Deep-link flows require specific UI state handling for the "zero state" case.

---

### 4. MongoDB Connection Failures (DNS on Render)
- **Problem:** Backend couldn't connect to MongoDB Atlas on certain Render instances, throwing DNS lookup errors.
- **Root cause:** Default DNS resolvers on some cloud hosts fail to reliably resolve `mongodb+srv://` SRV records.
- **Solution:** Added `require("node:dns/promises").setServers(["1.1.1.1","8.8.8.8"])` at the top of `server.js`.
- **Lesson:** Cloud hosting DNS can be unreliable; hardcode reliable resolvers (like Cloudflare/Google) for SRV records.

---

### 5. Express Route Order Bug
- **Problem:** `GET /api/products/my/listings` returned a 500 CastError.
- **Root cause:** The `/:id` route was registered before `/my/listings`, so Express tried to parse the word "my" as a MongoDB ObjectId.
- **Solution:** Registered specific routes (`/my/listings`) before parameterized routes (`/:id`).
- **Lesson:** Express matches routes in exact registration order — always put specific static paths first.

---

### 6. FOUC (Flash of Unstyled Content) on Theme
- **Problem:** The page briefly flashed in the wrong theme (light mode) before React hydrated and applied dark mode.
- **Root cause:** React only sets the `data-theme` attribute after mount, but the browser's initial render uses the HTML default.
- **Solution:** Added an inline `<script>` in `index.html` that reads localStorage and applies `data-theme` synchronously before the first paint.
- **Lesson:** Pre-React scripts are the best way to solve render-blocking UI state issues.

---

*Next: [Interview Preparation →](./20-interview-prep.md)*
