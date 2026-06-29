# 02 — System Architecture

> Back to [README](./README.md) · Previous: [Executive Summary](./01-executive-summary.md)

---

## High-Level Architecture

```mermaid
flowchart TB
  subgraph "Client — Vercel"
    SPA["React 18 SPA<br>Vite + React Router 6<br>PWA enabled"]
  end
  
  subgraph "Server — Render"
    API["Express REST API<br>Node.js"]
    CRON["node-cron<br>Daily Digest Job"]
    STATIC["/uploads<br>Static Files<br>(local mode only)"]
  end
  
  subgraph "External Services"
    MONGO[("MongoDB Atlas")]
    CDN[("Cloudinary CDN<br>Image Storage")]
    EMAIL["Resend<br>Email API"]
  end
  
  SPA -->|"HTTPS + JWT<br>JSON / FormData"| API
  SPA -->|"Image URLs"| CDN
  API --> MONGO
  API -->|"upload_stream"| CDN
  API --> STATIC
  API -->|"OTP, Reset,<br>Digest Emails"| EMAIL
  CRON -->|"Daily at<br>Midnight IST"| API
```

---

## Request Lifecycle (Authenticated API Call)

```mermaid
sequenceDiagram
  participant Browser
  participant Vite as Vite Proxy (Dev)
  participant Express
  participant Auth as auth middleware
  participant MongoDB
  participant Cloudinary
  
  Browser->>Vite: GET /api/products + Bearer JWT
  Vite->>Express: Forward to :5000
  Express->>Express: CORS check (allowedOrigins)
  Express->>Express: body parser (JSON/URL-encoded)
  Express->>Auth: jwt.verify(token, JWT_SECRET)
  Auth->>MongoDB: User.findById(decoded.id)
  MongoDB-->>Auth: User document
  Auth->>Auth: Check isBanned → 403 if true
  Auth->>Auth: formatUser() → attach req.user
  Auth->>Express: next()
  Express->>MongoDB: Product.find(query).populate('seller')
  MongoDB-->>Express: Documents
  Express-->>Browser: JSON (formatProductImages)
```

---

## Component Architecture (Frontend)

```mermaid
flowchart TD
  main["main.jsx<br>ReactDOM.createRoot"]
  main --> ThemeProvider
  ThemeProvider --> App
  
  App --> AuthProvider
  AuthProvider --> BrowserRouter
  BrowserRouter --> Navbar
  BrowserRouter --> Routes
  BrowserRouter --> BottomNav
  
  Navbar --> NotificationBell
  Navbar --> ThemeToggle
  
  Routes --> Home
  Routes --> Register["Register (OTP Flow)"]
  Routes --> Login
  Routes --> ForgotPassword
  Routes --> ProductDetail
  Routes --> SellItem
  Routes --> Dashboard
  Routes --> Conversations
  Routes --> Profile
  Routes --> Wishlist
  Routes --> Requests["Requests (Noticeboard)"]
  Routes --> AdminDashboard
  
  Home --> ProductCard
  Home --> FeedbackSection
  ProductDetail --> ProductImageGallery
  ProductDetail --> ProductSocial
  Conversations --> ChatPanel
  SellItem --> ImageUploader
  
  AdminDashboard --> AdminAnnouncementsPanel
  AdminDashboard --> AdminFeedbackPanel
```

---

## Key Architectural Decisions

| Decision | Reasoning |
|----------|-----------|
| **Separate SPA + API** | Independent deployment on Vercel (static) + Render (server) |
| **HTTP polling, not WebSockets** | Stateless, simpler hosting, acceptable latency for marketplace |
| **JWT, not sessions** | Stateless API, horizontal scaling without session store |
| **Cloudinary with local fallback** | CDN persistence in production, zero-config local dev |
| **Monolithic Express** | Appropriate for team size and feature scope |

---

*Next: [Technology Stack →](./03-technology-stack.md)*
