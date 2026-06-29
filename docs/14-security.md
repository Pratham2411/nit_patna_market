# 14 — Security Analysis

> Back to [README](./README.md) · Previous: [Email & Notifications](./13-email-notifications.md)

---

## Current Protections

| Protection | Implementation | Location |
|-----------|---------------|----------|
| **Password hashing** | bcrypt, cost factor 12 | `User.js` pre-save hook |
| **OTP hashing** | SHA-256 (not plaintext in DB) | `authRoutes.js` |
| **OTP rate limiting** | 60s cooldown between sends | `authRoutes.js`, `PendingUser.lastSentAt` |
| **OTP attempt limiting** | Max 5 failed attempts | `authRoutes.js` |
| **OTP expiry** | 10 minutes | `PendingUser.otpExpires` |
| **Auto-cleanup** | PendingUser TTL 15 min | MongoDB TTL index |
| **JWT authentication** | Verified on every protected route | `middleware/auth.js` |
| **Banned user blocking** | Checked at auth middleware level | `auth.js` line 17 |
| **CORS restriction** | Allowlist + Vercel regex + localhost | `server.js` |
| **File type restriction**| MIME check (`image/*` only) | `multerUpload.js` |
| **File size limit** | 5MB per product image, 2MB avatar | `multerUpload.js` |
| **XSS in emails** | `escapeHtml()` on all user data | `resendEmail.js` |
| **Seller authorization**| `product.seller === req.user.id` check | `productRoutes.js` |
| **Admin protection** | Cannot ban/delete admin accounts | `adminRoutes.js` |
| **Anti-enumeration** | Consistent response for forgot-password | `authRoutes.js` |
| **Self-messaging block**| `senderId === recvId` check | `messageRoutes.js` |
| **Duplicate contacts** | Unique index on `{ itemRequest, provider }` | `RequestContact.js` |
| **Phone validation** | Regex `/^(\+91)?[6-9]\d{9}$/` (Indian) | `authRoutes.js` |
| **Domain restriction** | Only `@nitp.ac.in` + admin emails can register | `authRoutes.js` |

---

## Known Gaps & Mitigations

| Risk | Current State | Recommended Mitigation |
|------|--------------|----------------------|
| **JWT in localStorage** | Accessible to XSS | httpOnly cookies + CSRF token |
| **No API rate limiting** | Unlimited requests | `express-rate-limit` middleware |
| **MongoDB regex search**| Possible ReDoS with crafted input | Text index or sanitize regex |
| **Admin emails in code**| Visible in repository | Move to environment variables |
| **No CSRF protection** | Stateless JWT (partial mitigation) | SameSite cookies if moving to cookies |
| **Missing CSP** | No Content Security Policy headers | Helmet.js middleware |
| **No audit logging** | No record of admin actions | Audit trail collection |
| **Non-transactional deletes**| Multiple `deleteMany` risk partial fail | Mongoose transactions |
| **No virus scanning** | MIME check only | ClamAV or cloud scanning service |

---

*Next: [Deployment Guide →](./15-deployment.md)*
