# 04 — Project Structure

> Back to [README](./README.md) · Previous: [Technology Stack](./03-technology-stack.md)

---

```
college-marketplace/
├── backend/
│   ├── config/
│   │   ├── admins.js              # Admin email allowlist (3 emails)
│   │   ├── cloudinary.js          # Cloudinary SDK init (lazy, idempotent)
│   │   └── db.js                  # MongoDB connection (fail-fast)
│   │
│   ├── jobs/
│   │   └── emailDigestCron.js     # Daily midnight IST digest email job
│   │
│   ├── middleware/
│   │   ├── admin.js               # Admin role check (requires auth first)
│   │   ├── auth.js                # JWT verification + banned check
│   │   ├── multerUpload.js        # Memory storage, MIME filter, size limit
│   │   └── optionalAuth.js        # Non-blocking auth (guests proceed)
│   │
│   ├── models/                    # 11 Mongoose models
│   │   ├── Announcement.js        # Campus-wide notices (CRUD by admin)
│   │   ├── AnnouncementRead.js    # Per-user read tracking
│   │   ├── Comment.js             # Product comments
│   │   ├── Feedback.js            # User → admin feedback
│   │   ├── ItemRequest.js         # "Looking for X" noticeboard
│   │   ├── Message.js             # Chat messages (product or request context)
│   │   ├── NotificationQueue.js   # Pending email notifications for digest
│   │   ├── PendingUser.js         # OTP signup temporary state (TTL 15min)
│   │   ├── Product.js             # Marketplace listings
│   │   ├── RequestContact.js      # "I have this" contact tracking
│   │   └── User.js                # Registered users
│   │
│   ├── routes/                    # 8 Express routers
│   │   ├── adminRoutes.js         # Admin CRUD (auth + admin middleware)
│   │   ├── announcementRoutes.js  # Public announcement reading
│   │   ├── authRoutes.js          # Register, login, profile, wishlist
│   │   ├── commentRoutes.js       # Product comments
│   │   ├── feedbackRoutes.js      # User feedback submission
│   │   ├── messageRoutes.js       # Chat messages + conversations
│   │   ├── productRoutes.js       # Product CRUD + image management
│   │   └── requestRoutes.js       # Item requests + contact flow
│   │
│   ├── utils/
│   │   ├── announcementQuery.js   # Shared active announcement filter
│   │   ├── formatUser.js          # Normalize user for API response
│   │   ├── imageStorage.js        # Dual-mode upload (Cloudinary/local)
│   │   ├── productImages.js       # Image list management utilities
│   │   └── resendEmail.js         # All email templates (OTP, reset, digest)
│   │
│   ├── .env.example               # All environment variables documented
│   ├── package.json               # Dependencies + scripts
│   └── server.js                  # Entry point: CORS, routes, cron
│
├── frontend/
│   ├── public/
│   │   ├── manifest.json          # PWA manifest
│   │   └── nitp-logo.png          # NIT Patna crest
│   │
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js           # Configured Axios instance + interceptor
│   │   │
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── AdminAnnouncementsPanel.jsx
│   │   │   │   └── AdminFeedbackPanel.jsx
│   │   │   ├── feedback/
│   │   │   │   └── FeedbackSection.jsx
│   │   │   ├── notifications/
│   │   │   │   ├── AnnouncementListItem.jsx
│   │   │   │   └── NotificationBell.jsx
│   │   │   ├── AdminBadge.jsx
│   │   │   ├── AdminRoute.jsx
│   │   │   ├── BottomNav.jsx
│   │   │   ├── ChatPanel.jsx
│   │   │   ├── ImageLightbox.jsx
│   │   │   ├── ImageUploader.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductImageGallery.jsx
│   │   │   ├── ProductSocial.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── SplashScreen.jsx
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Global auth state
│   │   │   └── ThemeContext.jsx   # Dark/light mode
│   │   │
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Conversations.jsx  # Inbox with split view
│   │   │   ├── Dashboard.jsx      # Seller's "My Listings"
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Home.jsx           # Browse + search + filters
│   │   │   ├── Login.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Profile.jsx        # Avatar, phone, delete account
│   │   │   ├── Register.jsx       # OTP-based registration
│   │   │   ├── Requests.jsx       # Item request noticeboard
│   │   │   ├── SellItem.jsx       # Create/edit listing
│   │   │   └── Wishlist.jsx
│   │   │
│   │   ├── styles/
│   │   │   ├── notifications.css
│   │   │   └── profile.css
│   │   │
│   │   ├── utils/
│   │   │   ├── apiError.js        # Friendly error message extraction
│   │   │   ├── formatDate.js      # Relative time + date formatting
│   │   │   ├── gmailUrl.js        # Gmail compose URL (desktop/mobile)
│   │   │   ├── mediaUrl.js        # Resolve image paths to full URLs
│   │   │   └── productImage.js    # Image resolution + placeholder
│   │   │
│   │   ├── App.jsx                # Root component with routing
│   │   ├── index.css              # Global design system
│   │   └── main.jsx               # React DOM mount point
│   │
│   ├── index.html                 # HTML shell with FOUC prevention
│   ├── vercel.json                # SPA rewrite rule
│   ├── vite.config.js             # Dev server + proxy config
│   └── package.json
│
└── docs/                          # This documentation
```

---

*Next: [Database Design →](./05-database-design.md)*
