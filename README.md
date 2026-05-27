# College Marketplace

A full-stack MERN application where college students can list and browse second-hand items for sale.

## Tech Stack
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT, Multer
- **Frontend:** React 18 (Vite), React Router v6, Axios

## Project Structure
```
college-marketplace/
├── backend/    # Express REST API
└── frontend/   # React + Vite SPA
```

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB running locally (or a MongoDB Atlas URI)

### 1. Backend
```bash
cd backend
npm install
# Edit .env if needed (MONGO_URI, JWT_SECRET, PORT)
npm run dev      # starts on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev      # starts on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | No | Browse listings (supports `?search=&category=&minPrice=&maxPrice=`) |
| GET | `/api/products/my/listings` | Yes | My own listings |
| GET | `/api/products/:id` | No | Single product detail |
| POST | `/api/products` | Yes | Create listing (multipart/form-data) |
| PUT | `/api/products/:id` | Yes | Edit own listing |
| PATCH | `/api/products/:id/status` | Yes | Mark sold/available |
| DELETE | `/api/products/:id` | Yes | Delete own listing |

## Features
- 🔐 JWT Authentication (register / login)
- 📦 List items with title, description, price, category, and optional image
- 🔍 Search + category + price range filter
- 📸 Local image upload via Multer; generic picsum.photos placeholders if no image
- ✏️ Edit and delete own listings
- ✅ Mark items as Sold / Available
- 📧 Contact seller via email link
- 🌑 Dark glassmorphism UI

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your values (`.env` is gitignored).

**Local (`backend/.env`):**
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.vcxwz6h.mongodb.net/college-marketplace?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_long_random_secret_here
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM="NIT Patna Market <no-reply@example.com>"
SMTP_TIMEOUT_MS=10000
BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=no-reply@example.com
BREVO_FROM_NAME=NIT Patna Market
```

For local development, if SMTP variables are not set, the backend prints the verification OTP in the server console.

For Brevo SMTP, use `smtp-relay.brevo.com`, port `587`, and `SMTP_SECURE=false`. Port `465` should use `SMTP_SECURE=true`.

For Render, prefer `BREVO_API_KEY` with a verified `BREVO_FROM_EMAIL`; it sends over HTTPS and avoids SMTP port timeouts. SMTP remains as a fallback if the API key is not set.

**Render (dashboard — do not commit secrets):** set `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL=https://nit-patna-market.vercel.app`, and the SMTP variables above.

**Vercel:** `VITE_API_URL=https://nit-patna-market.onrender.com` (or `.../api` — both work)

**Vercel SPA routing:** `frontend/vercel.json` rewrites all routes to `index.html` so refresh on `/messages`, `/product/:id`, etc. does not 404.
