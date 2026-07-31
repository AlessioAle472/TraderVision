require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { apiLimiter } = require('./middleware/rateLimiter');

// ── Fail-fast: required environment variables ──────────────────────────────
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = REQUIRED_ENV.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Create a .env file based on .env.example and populate all required values.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 49152;

// Trust proxy is required if running behind a reverse proxy (Vercel, Railway, Render, Nginx)
// for correct rate limiting by client IP and HTTPS detection.
app.set('trust proxy', 1);

// ── Security Headers (Helmet) ──────────────────────────────────────────────
app.use(helmet({
  // Allow the frontend to load images and scripts from the same origin
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"], // required for some inline styles
      imgSrc:     ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'"],
      objectSrc:  ["'none'"],
      frameSrc:   ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow loading from CDN if needed
}));

// ── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173', // Vite default local dev
  'http://localhost:5174', // Vite fallback
  'http://localhost:5175', // Vite fallback
  'http://localhost:49152',
  'http://127.0.0.1:49152',
  'https://tradervision-quantitativemarkets.com',
  'https://www.tradervision-quantitativemarkets.com',
  process.env.CORS_ORIGIN_1,  // Primary production origin
  process.env.CORS_ORIGIN_2,  // www variant or secondary origin
  process.env.CORS_ORIGIN,    // Legacy fallback
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman in dev)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      origin.endsWith('.vercel.app') ||
      origin.includes('tradervision-quantitativemarkets.com')
    ) {
      return callback(null, true);
    }
    const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true,
}));

// ── Stripe Webhook (needs raw body) ───────────────────────────────────────
const { webhookRouter } = require('./routes/stripe');
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), webhookRouter);

// ── Body Parsing (with size limits) ───────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── NoSQL Injection Prevention ─────────────────────────────────────────────
// Strips out keys containing '$' or '.' from req.body, req.query, req.params.
app.use(mongoSanitize());

// ── HTTP Parameter Pollution Prevention ───────────────────────────────────
app.use(hpp());

// ── Global API Rate Limiting ───────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Static Uploads ─────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ─────────────────────────────────────────────────────────────────
const apiRoutes    = require('./routes/api');
const authRoutes   = require('./routes/authRoutes');
const socialRoutes = require('./routes/social');
const groupsRoutes = require('./routes/groups');
const adsRoutes    = require('./routes/ads');
const cotRoutes    = require('./routes/cot');
const { router: stripeRouter } = require('./routes/stripe');
const { initAIJobs }      = require('./services/aiBriefingJob');
const marketCronJob       = require('./services/marketCronJob');
const cotCronJob          = require('./services/cotCronJob');

app.use('/api',        apiRoutes);
app.use('/api/auth',   authRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/ads',    adsRoutes);
app.use('/api',        cotRoutes);
app.use('/api/stripe', stripeRouter);

// ── Background Jobs ────────────────────────────────────────────────────────
initAIJobs();
marketCronJob.init();
cotCronJob.init();

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Trader Vision API is running' });
});

// ── Global Error Handler ───────────────────────────────────────────────────
// Never expose stack traces or internal error details in production.
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack || err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong.'
  });
});

// ── Database + Server Start ────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Cannot run without DB
  });
