# 18 — Design Decisions & Trade-offs

> Back to [README](./README.md) · Previous: [Scope Boundaries](./17-scope-boundaries.md)

---

### Polling vs WebSockets

| Polling (Chosen) | WebSockets |
|-----------------|------------|
| ✅ REST only, stateless | ❌ Persistent connections |
| ✅ Works with any hosting | ❌ Needs sticky sessions |
| ✅ Simple implementation | ❌ More complex architecture |
| ❌ 10–15s message latency | ✅ Sub-second delivery |
| ❌ Higher HTTP overhead | ✅ Efficient for frequent updates |

**Interview line:** "We chose polling for simplicity and compatibility with stateless hosting. The 10-15s latency is acceptable for a campus marketplace where urgency is low."

---

### JWT in localStorage vs httpOnly Cookies

| localStorage (Chosen) | httpOnly Cookies |
|----------------------|-----------------|
| ✅ Simple SPA implementation | ❌ Needs CSRF protection |
| ✅ No cookie configuration | ✅ Not accessible via JavaScript |
| ❌ Vulnerable to XSS | ✅ Immune to XSS token theft |
| ✅ Works cross-origin easily | ❌ Complex with cross-origin |

---

### MongoDB vs PostgreSQL

| MongoDB (Chosen) | PostgreSQL |
|-----------------|------------|
| ✅ Document model fits listings | ✅ Strict schema, ACID |
| ✅ `imageUrls` arrays native | ❌ Arrays less natural |
| ✅ `populate()` for joins | ✅ SQL JOINs more powerful |
| ✅ Mongoose ODM for MERN | ❌ Different ORM ecosystem |

---

### Context API vs Redux

| Context (Chosen) | Redux |
|-----------------|-------|
| ✅ Only auth is truly global | ❌ Overhead for simple state |
| ✅ Built into React | ❌ Additional dependency |
| ✅ Minimal boilerplate | ✅ DevTools, middleware |
| ❌ Re-renders all consumers | ✅ Selective subscriptions |

---

### Monolith vs Microservices

| Monolith (Chosen) | Microservices |
|-------------------|--------------|
| ✅ Single deployable | ❌ Multiple services to manage |
| ✅ Simple debugging | ❌ Distributed tracing needed |
| ✅ Appropriate for team size | ✅ Independent scaling |

---

*Next: [Problems & Solutions →](./19-problems-solutions.md)*
