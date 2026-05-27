const logger = require('../utils/logger');
const { AppError, NotFoundError } = require('../constants/errors');

/**
 * Determine whether the environment is development.
 */
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Extract a human-readable field name from a Prisma P2002 unique-constraint error.
 *
 * @param {Error} err - PrismaClientKnownRequestError
 * @returns {string}
 */
function getPrismaUniqueField(err) {
  // Prisma exposes the targeted fields in `meta.target` as an array of strings
  const target = err.meta && err.meta.target;

  if (Array.isArray(target) && target.length > 0) {
    return target.join(', ');
  }

  return 'record';
}

/**
 * Global Express error handler.
 *
 * Handles:
 * - Operational AppError subclasses (ValidationError, AuthenticationError, etc.)
 * - Prisma known request errors (P2002 unique constraint)
 * - JWT errors (JsonWebTokenError, TokenExpiredError)
 * - Fallback for unknown errors (500, no leak in production)
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, next) {
  // Log the error. Include the stack trace in development for easier debugging.
  if (isDev && err.stack) {
    logger.error(`${err.name || 'Error'}: ${err.message}\n${err.stack}`);
  } else {
    logger.error(`${err.name || 'Error'}: ${err.message}`);
  }

  let statusCode = 500;
  let message = 'Internal server error';
  let errors;

  // 1. Known operational application errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;

    // Pass along structured validation details if present
    if (err.details) {
      errors = err.details;
    }
  }
  // 2. Prisma unique-constraint violation (P2002)
  else if (err.code === 'P2002') {
    statusCode = 409;
    const field = getPrismaUniqueField(err);
    message = `A ${field} with this value already exists. Please use a different ${field}.`;
  }
  // 3. JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }
  // 4. Unknown / unexpected errors
  else {
    // In development we can expose the raw message for easier debugging;
    // in production we keep the generic safe message.
    if (isDev) {
      message = err.message || 'Internal server error';
    }
  }

  const payload = {
    success: false,
    error: {
      message,
    },
  };

  if (errors !== undefined) {
    payload.error.errors = errors;
  }

  // Include stack trace in the response only in development
  if (isDev && err.stack) {
    payload.error.stack = err.stack.split('\n');
  }

  res.status(statusCode).json(payload);
}

/**
 * Catch-all 404 handler for unmatched routes.
 *
 * Throws a NotFoundError so the global error handler can format it consistently.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
