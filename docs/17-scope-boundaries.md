# 17 — Scope Boundaries (What This Is NOT)

> Back to [README](./README.md) · Previous: [Performance & Scalability](./16-performance.md)

---

> **IMPORTANT:** Be honest in interviews. Never claim features that don't exist in the codebase. This shows maturity and architectural awareness.

| Topic | Status | Notes / Potential Future Work |
|-------|--------|-------------------------------|
| **LLM / ChatGPT / AI** | ❌ Not implemented | Could add listing description generation |
| **RAG / Vector DB** | ❌ Not implemented | Could add semantic search via embeddings |
| **WebSockets** | ❌ Not implemented | Uses HTTP polling by design |
| **Payment Gateway** | ❌ Not implemented | Trades happen offline (Razorpay/Stripe could be added) |
| **TypeScript** | ❌ Not used | JavaScript throughout |
| **Redux / Zustand** | ❌ Not used | Context API only |
| **Redis** | ❌ Not used | Stateless JWT design |
| **Automated Tests** | ❌ Not found | Manual testing only (Jest/Cypress needed) |
| **CI/CD Pipeline** | ❌ Not in repo | May exist externally (GitHub Actions to Vercel/Render) |
| **Server-Side Rendering** | ❌ Not used | SPA architecture (Next.js would be required) |
| **GraphQL** | ❌ Not used | REST API |
| **Docker** | ❌ Not configured | Direct Node.js deployment |
| **Microservices** | ❌ Monolithic | Appropriate for current scale |

---

*Next: [Design Decisions →](./18-design-decisions.md)*
