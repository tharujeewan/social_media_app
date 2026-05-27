// Import Router from express to create modular routes
const { Router } = require('express');

// Import controller functions (business logic handlers)
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
} = require('./auth.controller');

// Middleware to validate request body using schemas
const validate = require('../../middleware/validate.middleware');

// Middleware to verify JWT and attach user to req.user
const { authenticate } = require('../../middleware/auth.middleware');

// Middleware to limit repeated requests (protect against brute force / spam)
const { authLimiter } = require('../../middleware/rateLimit.middleware');

// Import validation schemas for different routes
const {
  registerSchema,
  loginSchema,
  refreshSchema,
} = require('./auth.validation');

// Create router instance
const router = Router();


/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,                 // Prevent too many requests (security)
  validate(registerSchema),    // Validate request body (email, password, etc.)
  register                     // Controller function
);


/**
 * @route   POST /auth/login
 * @desc    Authenticate user and return tokens
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,                 // Prevent brute-force login attempts
  validate(loginSchema),       // Validate login data
  login                        // Controller function
);


/**
 * @route   POST /auth/refresh-token
 * @desc    Generate new access token using refresh token
 * @access  Public (only refresh token required)
 */
router.post(
  '/refresh-token',
  validate(refreshSchema),     // Validate refresh token
  refreshToken                 // Controller function
);


/**
 * @route   POST /auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Protected
 */
router.post(
  '/logout',
  authenticate,                // Ensure user is logged in (valid access token)
  validate(refreshSchema),     // Validate refresh token
  logout                       // Controller function
);


/**
 * @route   GET /auth/me
 * @desc    Get current logged-in user's profile
 * @access  Protected
 */
router.get(
  '/me',
  authenticate,                // Verify JWT and set req.user
  getMe                        // Controller function
);


// Export router to be used in main routes file
module.exports = router;