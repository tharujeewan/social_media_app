const { createLogger, format, transports } = require('winston');

const { combine, timestamp, printf, colorize, errors } = format;

/**
 * Custom log format: timestamp + level + message (+ stack if error).
 */
const devFormat = printf(({ level, message, timestamp, stack }) => {
  return stack
    ? `${timestamp} [${level}]: ${message}\n${stack}`
    : `${timestamp} [${level}]: ${message}`;
});

/**
 * Determine transports and formats based on environment.
 */
const isProduction = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: isProduction ? 'info' : 'debug',
  defaultMeta: { service: 'social-media-app-backend' },
  transports: [
    new transports.Console({
      format: isProduction
        ? combine(
            timestamp(),
            errors({ stack: true }),
            format.json()
          )
        : combine(
            colorize(),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            errors({ stack: true }),
            devFormat
          ),
    }),
  ],
  // Do not exit on uncaught exceptions; let the app handle them
  exitOnError: false,
});

module.exports = logger;
