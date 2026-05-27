// src/modules/auth/auth.controller.js

// Import service layer (business logic)
const authService = require('./auth.service');

// Import standardized success response helper
const { success } = require('../../utils/response');

/**
 * Controller Layer (Thin Layer)
 * --------------------------------
 * Responsibility:
 * 1. Get data from request (req.body, req.user)
 * 2. Call service functions
 * 3. Send formatted response
 * 4. Pass errors to global error handler
 */


/**
 * @route   POST /register
 * @desc    Register a new user
 */
const register = async (req, res, next) => {
  try {
    // Call service to handle user registration logic
    const result = await authService.register(req.body);

    // Send success response
    return success(res, {
      data: result,
      message: 'User registered successfully',
      statusCode: 201,
    });
  } catch (err) {
    // Pass error to global error middleware
    next(err);
  }
};


/**
 * @route   POST /login
 * @desc    Authenticate user and return tokens
 */
const login = async (req, res, next) => {
  try {
    // Extract email & password and pass to service
    const result = await authService.login(
      req.body.email,
      req.body.password
    );

    // Send success response with tokens/user data
    return success(res, {
      data: result,
      message: 'Login successful',
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * @route   POST /refresh-token
 * @desc    Generate new access token using refresh token
 */
const refreshToken = async (req, res, next) => {
  try {
    // Pass refresh token to service
    const result = await authService.refreshToken(
      req.body.refresh_token
    );

    // Return new tokens
    return success(res, {
      data: result,
      message: 'Token refreshed successfully',
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * @route   POST /logout
 * @desc    Logout user by invalidating refresh token
 */
const logout = async (req, res, next) => {
  try {
    // Invalidate refresh token in service
    await authService.logout(req.body.refresh_token);

    // Send success response
    return success(res, {
      message: 'Logged out successfully',
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * @route   GET /me
 * @desc    Get current logged-in user's profile
 * @access  Protected (requires authentication middleware)
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is set by auth middleware after JWT verification
    const user = await authService.getMe(req.user.id);

    // Return user profile
    return success(res, {
      data: user,
      message: 'User profile retrieved successfully',
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
};


// Export all controller functions
module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
};