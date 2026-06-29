# 06 — Authentication & Authorization

> Back to [README](./README.md) · Previous: [Database Design](./05-database-design.md)

---

## OTP Registration Flow

```mermaid
sequenceDiagram
  participant User
  participant Frontend
  participant API
  participant PendingUsers as PendingUser Collection
  participant Resend
  participant Users as User Collection
  
  User->>Frontend: Fill name, email, password
  Frontend->>Frontend: Client-side password validation
  Frontend->>API: POST /api/auth/register/send-otp
  API->>API: Validate email format + @nitp.ac.in domain
  API->>API: Check strong password (8+ chars, upper, lower, num)
  API->>Users: Check email not already registered
  API->>PendingUsers: Check rate limit (60s cooldown)
  API->>API: Generate 6-digit OTP + SHA-256 hash
  API->>API: bcrypt hash password (cost 12)
  API->>PendingUsers: Upsert pending user (TTL 15 min)
  API->>Resend: Send OTP email (styled HTML)
  Resend-->>User: Email with 6-digit code
  API-->>Frontend: 200 "OTP sent"
  
  Frontend->>Frontend: Show OTP input screen
  User->>Frontend: Enter 6-digit OTP
  Frontend->>API: POST /api/auth/register/verify-otp
  API->>PendingUsers: Find by email
  API->>API: Check attempts < 5
  API->>API: Check OTP not expired (10 min)
  API->>API: Verify SHA-256(otp) matches hash
  API->>Users: collection.insertOne (bypass pre-save hook)
  API->>PendingUsers: Delete pending record
  API->>API: signToken (JWT, 7-day expiry)
  API-->>Frontend: 201 { token, user }
  Frontend->>Frontend: AuthContext.login() → localStorage
```

> **Dev mode bypass:** When `RESEND_API_KEY=re_your_api_key_here` (dummy key) and `NODE_ENV=development`, the OTP is printed to the backend terminal instead of being emailed.

---

## Password Policy

```
✓ Minimum 8 characters
✓ At least one uppercase letter (A-Z)
✓ At least one lowercase letter (a-z)
✓ At least one number (0-9)
```

Enforced on both **client** (`Register.jsx` real-time validation) and **server** (`isStrongPassword()` in `authRoutes.js`).

---

## JWT Token Structure

```javascript
jwt.sign({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,          // 'user' or 'admin'
  isAdmin: true/false,
  avatarUrl: user.avatarUrl
}, JWT_SECRET, { expiresIn: '7d' });
```

---

## Middleware Chain

```mermaid
flowchart LR
  REQ[Request] --> CORS[CORS Check]
  CORS --> BODY[Body Parser]
  BODY --> ROUTE[Route Handler]
  
  subgraph "Protected Routes"
    ROUTE --> AUTH["auth.js<br>JWT verify<br>Load user from DB<br>Check banned<br>Attach req.user"]
  end
  
  subgraph "Admin Routes"
    AUTH --> ADMIN["admin.js<br>resolveRole(req.user)<br>=== 'admin'"]
  end
  
  subgraph "Public + Optional Auth"
    ROUTE --> OPT["optionalAuth.js<br>Attach user if token valid<br>Continue regardless"]
  end
```

### Middleware Details

| Middleware | File | Behavior |
|-----------|------|----------|
| **auth** | `middleware/auth.js` | Extract Bearer token → `jwt.verify` → load user from DB → reject if banned (403) → attach `req.user` + `req.userDoc` |
| **admin** | `middleware/admin.js` | Runs AFTER auth. Checks `resolveRole(req.user) === 'admin'` → 403 if not |
| **optionalAuth** | `middleware/optionalAuth.js` | Same token extraction, but calls `next()` regardless. Used for announcements/requests |
| **multerUpload** | `middleware/multerUpload.js` | Memory storage, `image/*` MIME filter. Factory: `createUpload(maxFiles, maxSizeMb)` |

---

## Admin System

**Dual determination mechanism:**

1. **Config file:** `backend/config/admins.js` — hardcoded email allowlist
2. **Database field:** `User.role === 'admin'`
3. **Resolution:** `resolveRole()` returns `'admin'` if EITHER the role field OR config match

**Admin protections:**
- Admins cannot be banned via API
- Admins cannot be deleted via admin panel
- Admin promotion happens automatically on `User.save()` via pre-save hook

---

## Authorization Matrix

| Resource | Guest | User | Owner | Admin |
|----------|-------|------|-------|-------|
| Browse products | ✅ | ✅ | ✅ | ✅ |
| View product detail | ✅ | ✅ | ✅ | ✅ |
| View announcements | ✅ | ✅ | ✅ | ✅ |
| View item requests | ✅ | ✅ | ✅ | ✅ |
| Create listing | ❌ | ✅ | ✅ | ✅ |
| Edit listing | ❌ | ❌ | ✅ | ✅ |
| Delete listing | ❌ | ❌ | ✅ | ✅ |
| Mark sold/available | ❌ | ❌ | ✅ | ❌ |
| Send messages | ❌ | ✅ | ✅ | ✅ |
| Post comments | ❌ | ✅ | ✅ | ✅ |
| Delete own comment | ❌ | ✅ | ✅ | ✅ |
| Delete any comment | ❌ | ❌ | ❌ | ✅ |
| Wishlist | ❌ | ✅ | ✅ | ✅ |
| Submit feedback | ❌ | ✅ | ✅ | ✅ |
| Mark announcement read | ❌ | ✅ | ✅ | ✅ |
| Manage announcements | ❌ | ❌ | ❌ | ✅ |
| Ban users | ❌ | ❌ | ❌ | ✅ |
| Flag spam | ❌ | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ❌ | ✅ |
| View admin stats | ❌ | ❌ | ❌ | ✅ |

---

*Next: [Backend Deep Dive →](./07-backend.md)*
