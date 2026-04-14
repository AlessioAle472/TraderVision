require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy is required if running behind a reverse proxy like Vercel, Railway, Render (for secure cookies, rate limiting, and HTTPS detection)
app.set('trust proxy', 1);

// Configure CORS
const allowedOrigins = [
  'http://localhost:5173', // Vite default local dev
  process.env.CORS_ORIGIN // e.g. https://tradervision-quantitativemarkets.com
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

// Routes
const apiRoutes = require('./routes/api');
const { initAIJobs } = require('./services/aiBriefingJob');

app.use('/api', apiRoutes);

// Initialize AI Briefing Scheduler
initAIJobs();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Trader Vision API is running' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
