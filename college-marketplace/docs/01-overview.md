# 01 — Project Overview

## What is Campus Market?

Campus Market is a **peer-to-peer marketplace** for college students to buy and sell second-hand items — textbooks, electronics, clothing, furniture — within their own campus community.

Think of it as a **college-scoped OLX/Facebook Marketplace** with a built-in chat system.

---

## Why this project?

This project was built to demonstrate practical full-stack web development skills:
- Building a **RESTful API** from scratch with Express + MongoDB
- Handling **authentication** securely with JWT
- Managing **file uploads** with Multer
- Designing a **React SPA** with routing, protected pages, and global state
- Implementing a **messaging system** without WebSockets (MongoDB polling)

---

## Feature List

### Core Features
| Feature | Description |
|---------|-------------|
| 🔐 User Auth | Register + Login with JWT. Passwords hashed with bcryptjs |
| 📦 List Items | Create listings with title, price, category, description, optional image |
| 🔍 Search & Filter | Real-time debounced search, category filter, min/max price filter |
| 🖼️ Image Upload | Upload product images via Multer (stored locally). Falls back to picsum.photos placeholder |
| ✏️ Edit Listing | Sellers can edit their own listings |
| 🔴 Mark as Sold | Toggle listing status between `available` and `sold` |
| 🗑️ Delete Listing | Sellers can delete their listings (image file also cleaned up) |
| 💬 Chat System | MongoDB-backed messaging between buyer and seller, per product |
| 📥 Conversations Inbox | View all conversations with unread counts |
| 🔔 Unread Badge | Navbar polls unread count every 10 seconds |
| 📊 Dashboard | Sellers see all their listings with stats (Total / Active / Sold) |

### UX Features
- Dark glassmorphism design with purple accent
- Responsive layout (mobile-friendly)
- Loading spinners, empty states, toast notifications
- Debounced search (350ms) to avoid hammering the API
- Chat auto-scrolls to latest message
- Enter to send a message, Shift+Enter for new line

---

## Tech Stack

### Backend
| Technology | Why we chose it |
|-----------|-----------------|
| **Node.js** | JavaScript on the server — same language as frontend |
| **Express.js** | Minimal, flexible HTTP framework. Industry standard for Node APIs |
| **MongoDB** | Document-based NoSQL DB — great for flexible product schemas |
| **Mongoose** | ODM for MongoDB — provides schema validation, hooks, populate |
| **JWT** | Stateless authentication — no session storage needed on server |
| **bcryptjs** | Password hashing — never store plain-text passwords |
| **Multer** | Middleware for handling `multipart/form-data` file uploads |
| **dotenv** | Load environment variables from `.env` file |
| **cors** | Allow the React frontend (port 3000) to call the API (port 5001) |
| **nodemon** | Auto-restarts server on file changes during development |

### Frontend
| Technology | Why we chose it |
|-----------|-----------------|
| **React 18** | Component-based UI, reusable, declarative — industry standard |
| **Vite** | Blazing fast dev server + bundler (faster than Create React App) |
| **React Router v6** | Client-side routing — makes it a Single Page Application (SPA) |
| **Axios** | HTTP client with interceptors — easier than raw `fetch` for auth headers |
| **Context API** | Global auth state without Redux (project is small enough) |
| **Plain CSS** | Full control, no framework overhead, custom design system |

---

## What we intentionally left out (and why)

| Feature | Why excluded |
|---------|-------------|
| Real-time WebSocket chat | Overkill for this scale; MongoDB polling every 3s is sufficient |
| Payment integration | Adds regulatory complexity (Razorpay/Stripe); out of scope |
| Email verification | Needs SMTP/SendGrid setup; adds infra complexity |
| Redux | Overkill for a project with only auth as global state |
| TypeScript | Adds compile step complexity; plain JS is faster to build and explain |
| Cloudinary | Local storage is simpler for demo; Cloudinary is an easy upgrade |
