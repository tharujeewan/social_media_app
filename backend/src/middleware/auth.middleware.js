const { AuthenticationError, ForbiddenError } = require('../constants/errors');
const { verifyAccessToken } = require('../utils/jwt');

/**
 * Authenticate the incoming request by verifying the Bearer JWT access token.
 *
 * - Extracts the token from the `Authorization: Bearer <token>` header.
 * - Verifies the token using the application's JWT secret.
 * - Attaches the decoded user payload to `req.user`.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Access token is required'));
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return next(new AuthenticationError('Access token is required'));
  }

  try {
    const decoded = verifyAccessToken(token);

    // Ensure the decoded payload contains the minimum required fields
    if (!decoded || typeof decoded.id === 'undefined') {
      return next(new AuthenticationError('Invalid or expired access token'));
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    // Any JWT verification failure (invalid signature, expired token, malformed token, etc.)
    next(new AuthenticationError('Invalid or expired access token'));
  }
}

/**
 * Authorise a request based on the user's role.
 *
 * Returns middleware that permits access only when `req.user.role` is
 * included in the supplied `roles` array.
 *
 * @param {...string} roles - Allowed roles (e.g. 'ADMIN', 'USER').
 * @returns {import('express').RequestHandler}
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize,
};
