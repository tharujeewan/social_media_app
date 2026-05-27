const jwt = require('jsonwebtoken');

/**
 * JWT configuration loaded from environment variables.
 */
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets (JWT_SECRET, JWT_REFRESH_SECRET) must be configured in environment variables');
}

const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

/**
 * Generate a short-lived access token.
 * @param {Object} payload – data to encode (e.g. { userId, role })
 * @returns {string} Signed JWT.
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRY,
  });
}

/**
 * Generate a long-lived refresh token.
 * @param {Object} payload – data to encode (e.g. { userId })
 * @returns {string} Signed JWT.
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY,
  });
}

/**
 * Verify an access token.
 * @param {string} token
 * @returns {Object} Decoded payload.
 * @throws {Error} If the token is invalid or expired.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Verify a refresh token.
 * @param {string} token
 * @returns {Object} Decoded payload.
 * @throws {Error} If the token is invalid or expired.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
