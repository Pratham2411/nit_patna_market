# NIT Patna Market — Documentation

> **Single source of truth** for architecture, implementation, APIs, deployment, security, and interview preparation.  
> All content is **grounded in the actual codebase** (June 2026). If the docs and code disagree, the code wins.

---

## 📖 Documentation Index

| # | Document | What You'll Learn |
|---|----------|-------------------|
| 01 | [Executive Summary](./01-executive-summary.md) | Project purpose, scope, 30-second & 2-minute pitches, core user flows |
| 02 | [System Architecture](./02-system-architecture.md) | High-level design, request lifecycle, component topology |
| 03 | [Technology Stack](./03-technology-stack.md) | Every library, framework, and service with rationale |
| 04 | [Project Structure](./04-project-structure.md) | File-by-file layout with purpose annotations |
| 05 | [Database Design](./05-database-design.md) | ER diagram, all 11 Mongoose models, indexes, relationships |
| 06 | [Authentication & Authorization](./06-auth.md) | OTP signup, JWT, middleware chain, admin system, auth matrix |
| 07 | [Backend Deep Dive](./07-backend.md) | Server setup, all 8 route modules, utilities, cron jobs |
| 08 | [Frontend Deep Dive](./08-frontend.md) | React architecture, contexts, pages, components, UI patterns |
| 09 | [API Reference](./09-api-reference.md) | Every endpoint with method, auth, request/response |
| 10 | [Feature Walkthroughs](./10-feature-walkthroughs.md) | End-to-end flows for every major feature |
| 11 | [Image Storage System](./11-image-storage.md) | Dual-mode Cloudinary/local architecture |
| 12 | [Chat & Messaging](./12-chat-messaging.md) | Polling architecture, conversation grouping, read receipts |
| 13 | [Email & Notifications](./13-email-notifications.md) | Resend integration, OTP emails, daily digest cron |
| 14 | [Security Analysis](./14-security.md) | Current protections and known gaps |
| 15 | [Deployment Guide](./15-deployment.md) | Vercel + Render setup, environment variables, local dev |
| 16 | [Performance & Scalability](./16-performance.md) | Bottlenecks and scaling strategies |
| 17 | [Scope Boundaries](./17-scope-boundaries.md) | What this project does NOT include (honesty for interviews) |
| 18 | [Design Decisions](./18-design-decisions.md) | Why X instead of Y — with trade-off tables |
| 19 | [Problems & Solutions](./19-problems-solutions.md) | Real development war stories with root-cause analysis |
| 20 | [Interview Preparation](./20-interview-prep.md) | 155+ questions with implementation-grounded answers |
| 21 | [Complete Documentation (Single File)](./COMPLETE_DOCUMENTATION.md) | All of the above combined into a single, printable master document |

---

## Quick Start

```bash
# Backend
cd backend && cp .env.example .env   # fill in MONGO_URI, JWT_SECRET
npm install && npm run dev            # http://localhost:5000

# Frontend (new terminal)
cd frontend && npm install && npm run dev   # http://localhost:3000
```

> **OTP testing locally:** Leave `RESEND_API_KEY=re_your_api_key_here` in `.env`. The OTP prints to the backend terminal.

---

*Last aligned with repository: June 2026*
