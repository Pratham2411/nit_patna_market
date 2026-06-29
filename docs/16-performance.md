# 16 — Performance & Scalability

> Back to [README](./README.md) · Previous: [Deployment Guide](./15-deployment.md)

---

## Current Bottlenecks

| Bottleneck | Impact | Severity |
|-----------|--------|----------|
| **MongoDB `$regex` search** | Collection scan on `title` (no text index) | 🟡 Medium |
| **HTTP polling (10–30s)** | N users × interval = high read load | 🟡 Medium |
| **Single Node.js process** | CPU/memory ceiling on free tier | 🟠 High (at scale) |
| **No response caching** | Every request hits MongoDB | 🟡 Medium |
| **Full message load** | Loads ALL user messages to group conversations | 🟠 High |
| **No pagination** | Loads all matching products on browse | 🟡 Medium |

---

## Scaling Strategy (1M Users)

| Layer | Current | Scaled Approach |
|-------|---------|-----------------|
| **Search** | MongoDB `$regex` | Atlas Search or Elasticsearch |
| **Chat** | HTTP polling (15s) | WebSockets (Socket.io) with rooms |
| **Cache** | None | Redis for unread counts, sessions |
| **API** | Single instance | Horizontal scaling + load balancer |
| **Frontend** | Vercel CDN | Already good ✅ |
| **Auth** | JWT in localStorage | httpOnly cookies + refresh tokens |
| **Images** | Cloudinary | Already CDN ✅ |
| **Email** | Inline sends | Message queue (Bull/BullMQ) |
| **Database** | Single Atlas instance | Read replicas + sharding |
| **Monitoring** | `console.log` | Sentry + structured logging |

---

*Next: [Scope Boundaries →](./17-scope-boundaries.md)*
