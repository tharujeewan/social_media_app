const app = require('./src/app');
const { connect, disconnect } = require('./src/config/db');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

/**
 * Start the application.
 * Connects to the database before binding the HTTP server.
 */
async function startServer() {
  try {
    await connect();
    logger.info('Database connection established');

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    /**
     * Graceful shutdown handler.
     * Closes the HTTP server and disconnects from the database.
     */
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnect();
        logger.info('Database disconnected');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection: ${err.message || err}`);
      if (err.stack) {
        logger.error(err.stack);
      }
      server.close(async () => {
        await disconnect();
        process.exit(1);
      });
    });

    // Uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception: ${err.message || err}`);
      if (err.stack) {
        logger.error(err.stack);
      }
      server.close(async () => {
        await disconnect();
        process.exit(1);
      });
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message || err}`);
    if (err.stack) {
      logger.error(err.stack);
    }
    process.exit(1);
  }
}

startServer();
