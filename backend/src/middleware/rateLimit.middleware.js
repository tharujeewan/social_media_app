const rateLimit = require('express-rate-limit');

/**
 * Default configuration values.
 */
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_GENERAL_MAX = 100;
const DEFAULT_AUTH_MAX = 10;

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || DEFAULT_WINDOW_MS;
const generalMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || DEFAULT_GENERAL_MAX;
const authMax = parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || DEFAULT_AUTH_MAX;

/**
 * Consistent JSON response sent when a rate limit is exceeded.
 */
function rateLimitResponse(req, res) {
  return res.status(429).json({
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      statusCode: 429,
    },
  });
}

/**
 * General-purpose rate limiter for standard API routes.
 *
 * Defaults: 100 requests per 15-minute window.
 */
const generalLimiter = rateLimit({
  windowMs,
  max: generalMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
});

/**
 * Stricter rate limiter for authentication routes (login, register, etc.).
 *
 * Defaults: 10 requests per 15-minute window.
 */
const authLimiter = rateLimit({
  windowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
});

module.exports = {
  generalLimiter,
  authLimiter,
};
