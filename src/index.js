import app from './server.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import logger from './utils/logger.js';

const PORT = config.port;

// Connect to database
connectDB()
  .then(() => {
    // Start server
    app.listen(PORT, () => {
      logger.info(
        {
          port: PORT,
          env: config.env,
          apiVersion: config.apiVersion,
        },
        `Server started successfully`
      );
      logger.info(`API Documentation: http://localhost:${PORT}/docs`);
      logger.info(`Health Check: http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled promise rejection');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
