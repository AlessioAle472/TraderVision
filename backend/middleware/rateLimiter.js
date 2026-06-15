const rateLimit = require('express-rate-limit');

/**
 * Strict rate limiter for authentication endpoints (login, register).
 * Prevents brute-force password attacks.
 * 10 attempts per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,   // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,     // Disable X-RateLimit-* legacy headers
  message: {
    message: 'Too many login attempts from this IP. Please try again in 15 minutes.'
  },
  skipSuccessfulRequests: true, // Only count failed attempts
});

/**
 * General API rate limiter.
 * 200 requests per minute per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP. Please slow down.'
  },
});

/**
 * Strict limiter for AI-powered and expensive endpoints.
 * 15 requests per minute per IP.
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'AI endpoint rate limit exceeded. Please wait before making more requests.'
  },
});

module.exports = { authLimiter, apiLimiter, aiLimiter };
