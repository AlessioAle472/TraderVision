require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 49152;

// Trust proxy is required if running behind a reverse proxy like Vercel, Railway, Render (for secure cookies, rate limiting, and HTTPS detection)
app.set('trust proxy', 1);

// Configure CORS
const allowedOrigins = [
  'http://localhost:5173', // Vite default local dev
  'http://localhost:5174', // Vite fallback
  'http://localhost:5175', // Vite fallback
  'https://tradervision-quantitativemarkets.com',
  'https://www.tradervision-quantitativemarkets.com',
  process.env.CORS_ORIGIN // Fallback from env
].filter(Boolean); // Remove undefined if CORS_ORIGIN is not set (e.g., local dev)

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin: ' + origin;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads (for social images etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/authRoutes');
const socialRoutes = require('./routes/social');
const groupsRoutes = require('./routes/groups');
const adsRoutes = require('./routes/ads');
const { initAIJobs } = require('./services/aiBriefingJob');
const marketCronJob = require('./services/marketCronJob');

app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/ads', adsRoutes);

// Initialize AI Briefing Scheduler
initAIJobs();

// Initialize Daily Market Data Cron (06:00 AM)
marketCronJob.init();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Trader Vision API is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT} (0.0.0.0)`);
  
  if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
      .then(() => console.log('Connected to MongoDB Atlas'))
      .catch(err => console.error('MongoDB connection error:', err));
  } else {
    console.warn('WARNING: MONGODB_URI not found. Authentication features will not work.');
  }
});
