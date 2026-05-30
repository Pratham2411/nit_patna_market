# 📚 NIT Patna Market — Project Documentation

> Interview-ready documentation for the College Marketplace MERN project.  
> Content is aligned with the **actual codebase** — always verify against source when preparing for interviews.

---

## Recommended reading order

| Step | File | What you learn |
|------|------|----------------|
| 1 | [01-overview.md](./01-overview.md) | Problem, features, stack, what's **not** built |
| 2 | [02-architecture.md](./02-architecture.md) | System design, data flows, collections |
| 3 | [03-backend.md](./03-backend.md) | Models, routes, auth, uploads |
| 4 | [04-frontend.md](./04-frontend.md) | React pages, Context, Axios |
| 5 | [05-chat-system.md](./05-chat-system.md) | Polling-based messaging |
| 6 | [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md) | Permanent image hosting |
| 7 | **[07-interview-guide.md](./07-interview-guide.md)** | **Complete interview prep (start here for placements)** |
| 8 | [06-interview-qa.md](./06-interview-qa.md) | Quick-fire Q&A (companion to 07) |

---

## One-line pitch (30 seconds)

> *"NIT Patna Market is a full-stack MERN campus marketplace where NIT Patna students list and buy second-hand items. It includes JWT auth, multi-photo listings on Cloudinary, search and filters, buyer–seller chat with polling, reviews and comments, admin moderation, campus announcements, and a user feedback system."*

---

## Two-minute pitch outline

1. **Problem** — campus students need one place to buy/sell used goods safely.  
2. **Solution** — SPA + REST API + MongoDB.  
3. **Key features** — listings (8 images), chat inbox, admin tools, announcements.  
4. **Tech choices** — MERN, JWT, Cloudinary, polling instead of WebSockets (simplicity).  
5. **Honest scope** — no payments, no AI; clear upgrade path (WebSockets, Razorpay, tests).

Full answers: **[07-interview-guide.md](./07-interview-guide.md)**

---

## Quick facts (verify in code before citing)

| Item | Value |
|------|--------|
| Backend port (default) | `5000` (`backend/.env` `PORT`) |
| Frontend dev port | `3000` (`vite.config.js`) |
| JWT expiry | 7 days |
| Max listing photos | 8 |
| Chat poll (ChatPanel) | 15 seconds |
| Unread poll (Navbar) | 10 seconds |
| Signup email domain | `@nitp.ac.in` (+ admin allowlist) |

---

## Interview preparation — what's inside 07

- Beginner → Advanced Q&A  
- **Explicit "not in project"** section (no LLM/RAG hallucination)  
- Why X instead of Y comparisons  
- Real **problems faced** (ports, Cloudinary, multipart, chat inbox)  
- Architecture diagrams (Mermaid)  
- **Top 100** likely questions with brief answers  
- Resume / HR questions  

---

## Contributing to docs

When you change the codebase, update:

1. `01-overview.md` — features list  
2. `02-architecture.md` — routes & collections  
3. `07-interview-guide.md` — interview claims  

Do **not** document features that are not implemented.
