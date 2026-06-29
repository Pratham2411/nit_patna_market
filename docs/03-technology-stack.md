# 03 — Technology Stack

> Back to [README](./README.md) · Previous: [System Architecture](./02-system-architecture.md)

---

## Backend

| Technology | Version | Purpose | Why Chosen |
|-----------|---------|---------|------------|
| **Node.js** | 18+ | Runtime | Non-blocking I/O, MERN ecosystem |
| **Express** | 4.22 | HTTP framework | Industry standard, minimal, middleware-based |
| **MongoDB** | Atlas | Database | Document model fits listings; flexible schema |
| **Mongoose** | 8.23 | ODM | Schema validation, hooks, populate() |
| **jsonwebtoken** | 9.0 | Auth tokens | Stateless JWT, horizontal scaling |
| **bcryptjs** | 2.4 | Password hashing | Slow hash, configurable cost factor |
| **Multer** | 1.4.5 | File upload | Memory storage for streaming to Cloudinary |
| **Cloudinary** | 2.10 | Image CDN | Persistent URLs, transformations, CDN delivery |
| **Resend** | 6.14 | Email delivery | OTP emails, notifications, daily digests |
| **node-cron** | 4.4 | Job scheduling | Daily email digest at midnight IST |
| **dotenv** | 16.6 | Configuration | Environment variable management |
| **cors** | 2.8 | CORS | Cross-origin request handling |
| **nodemon** | 3.1 | Dev tooling | Auto-restart on file changes |

---

## Frontend

| Technology | Version | Purpose | Why Chosen |
|-----------|---------|---------|------------|
| **React** | 18.3 | UI library | Component model, hooks, ecosystem |
| **Vite** | 8.0 | Build tool | Sub-second HMR, proxy support |
| **React Router** | 6.18 | Routing | Declarative client-side navigation |
| **Axios** | 1.5 | HTTP client | Interceptors for JWT attachment |
| **Vanilla CSS** | — | Styling | Full design control, no framework bloat |
| **Inter + Outfit** | Google Fonts | Typography | Modern, clean, professional |

---

## Infrastructure

| Service | Purpose | Tier |
|---------|---------|------|
| **Vercel** | Frontend hosting (SPA) | Free |
| **Render** | Backend hosting (API) | Free |
| **MongoDB Atlas** | Database | Free (M0) |
| **Cloudinary** | Image storage + CDN | Free |
| **Resend** | Transactional email | Free tier |

---

*Next: [Project Structure →](./04-project-structure.md)*
