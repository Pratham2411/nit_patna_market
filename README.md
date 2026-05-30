# NIT Patna Market (College Marketplace)

A full-stack **MERN** campus marketplace where **NIT Patna students** (`@nitp.ac.in`) can list, browse, and sell second-hand items with in-app chat, reviews, admin moderation, and campus announcements.

## Tech stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, Multer, **Cloudinary**
- **Frontend:** React 18, Vite, React Router v6, Axios, plain CSS

## Project structure

```
college-marketplace/
├── backend/     # Express REST API
├── frontend/    # React + Vite SPA
└── docs/        # Architecture + interview documentation
```

## Quick start

### Prerequisites

- Node.js 18+
- MongoDB Atlas URI (or local MongoDB)
- [Cloudinary](https://cloudinary.com) account (recommended — see [docs/CLOUDINARY_SETUP.md](./docs/CLOUDINARY_SETUP.md))

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill MONGO_URI, JWT_SECRET, CLOUDINARY_*
npm run dev            # http://localhost:5000
```

Look for: `📷 Image storage: cloudinary`

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
```

## Features

- JWT authentication (college email + admin allowlist)
- Multi-photo listings (up to 8) with Cloudinary CDN
- Search, category, and price filters
- Buyer–seller chat (polling) + inbox
- Product reviews and comments
- Profile avatars
- Admin dashboard (spam, bans, users, products)
- Campus announcements (notification bell)
- User feedback to admins

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/README.md](./docs/README.md) | Documentation index |
| **[docs/07-interview-guide.md](./docs/07-interview-guide.md)** | **Complete interview preparation** |
| [docs/CLOUDINARY_SETUP.md](./docs/CLOUDINARY_SETUP.md) | Cloudinary setup steps |

## Deployment

- **Frontend:** Vercel — set `VITE_API_URL` to your Render backend URL
- **Backend:** Render — `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_*`, `FRONTEND_URL`
- **Images:** Cloudinary (required for persistent photos on Render)

## Environment variables

See `backend/.env.example` for the full list.

**Minimum for local dev:**

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=long_random_string
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=http://localhost:3000
```

## API overview

| Area | Prefix |
|------|--------|
| Auth | `/api/auth` |
| Products | `/api/products` |
| Messages | `/api/messages` |
| Comments | `/api/comments` |
| Reviews | `/api/reviews` |
| Admin | `/api/admin` |
| Announcements | `/api/announcements` |
| Feedback | `/api/feedback` |

Full route details: [docs/02-architecture.md](./docs/02-architecture.md)

## What this project does not include

- LLM / AI / RAG features
- WebSockets (uses HTTP polling)
- Payment integration
- TypeScript or Redux

See [docs/07-interview-guide.md](./docs/07-interview-guide.md) for interview scope.
