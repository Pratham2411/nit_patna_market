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

## Environment Variables (backend/.env)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/college-marketplace
JWT_SECRET=your_secret_here
```
