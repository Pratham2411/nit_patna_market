# NIT Patna Market (College Marketplace)

A full-stack **MERN** campus marketplace where **NIT Patna students** (`@nitp.ac.in`) can list, browse, and sell second-hand items with in-app chat, reviews, admin moderation, and campus announcements.

## Tech stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, Multer, **Cloudinary**, **Resend** (Email OTP)
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

### Testing OTP Verification Locally
To test the OTP signup flow without needing a real Resend API key:
1. Leave `RESEND_API_KEY=re_your_api_key_here` in your backend `.env` file.
2. Run the backend and frontend in `development` mode (`npm run dev`).
3. When you submit the signup form, the app will **bypass the actual email** and print the 6-digit OTP directly to your **backend terminal**.
4. Enter that code into the frontend to complete the signup.

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
```

## Features

- **Email OTP Verification** (Secure signup using Resend)
- **Verified Student Badge** (Requires `@nitp.ac.in` domain)
- JWT authentication (college email + admin allowlist)
- Multi-photo listings (up to 8) with Cloudinary CDN
- Search, category, and price filters
- **Optimistic Wishlist** saves
- **Item Requests** noticeboard
- Buyer–seller chat (polling) + inbox
- **WhatsApp Deep Linking** for instant seller contact
- **Progressive Web App (PWA)** support for mobile installation
- Automatic email notifications for offline chat recipients (Resend)
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
- **Backend:** Render — `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_*`, `RESEND_*`, `FRONTEND_URL`
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

# Email OTP (Resend)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
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
