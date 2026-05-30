require("node:dns/promises").setServers(["1.1.1.1","8.8.8.8"]);
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const { getStorageMode } = require('./utils/imageStorage');
console.log(`📷 Image storage: ${getStorageMode()}`);

const app = express();

// Middleware — allow Vercel (with/without www), previews, and local dev
const allowedOrigins = new Set([
  'https://nit-patna-market.vercel.app',
  'https://www.nit-patna-market.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
]);
if (process.env.FRONTEND_URL) allowedOrigins.add(process.env.FRONTEND_URL);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, origin);
    if (/^https:\/\/[\w-]+-[\w-]+\.vercel\.app$/.test(origin)) return callback(null, origin);
    if (origin.startsWith('http://localhost:')) return callback(null, origin);
    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/products',  require('./routes/productRoutes'));
app.use('/api/messages',  require('./routes/messageRoutes'));
app.use('/api/comments',  require('./routes/commentRoutes'));
app.use('/api/reviews',   require('./routes/reviewRoutes'));
app.use('/api/admin',          require('./routes/adminRoutes'));
app.use('/api/announcements',  require('./routes/announcementRoutes'));
app.use('/api/feedback',       require('./routes/feedbackRoutes'));

app.get('/', (req, res) =>
  res.json({ message: '🎓 College Marketplace API is running' })
);

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
