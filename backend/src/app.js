require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const xss = require('xss-clean');

const { generalLimiter } = require('./middleware/rateLimit.middleware');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const logger = require('./utils/logger');

const app = express();

// Trust proxy for accurate client IP behind reverse proxies
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN === '*'
      ? true
      : (process.env.CORS_ORIGIN || 'http://localhost:3000'),
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser());

// XSS sanitization
app.use(xss());

// HTTP Parameter Pollution prevention
app.use(hpp());

// Request logging
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// 🔹 Health check route
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// General rate limiter
app.use(generalLimiter);

// API routes
app.use('/api', routes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;
