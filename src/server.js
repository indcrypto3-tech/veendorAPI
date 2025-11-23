import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';
import logger from './utils/logger.js';

// Import routes
import authRoutes from './routes/auth.js';
import vendorRoutes from './routes/vendor.js';
import serviceRoutes from './routes/service.js';
import orderRoutes from './routes/order.js';
import paymentRoutes from './routes/payment.js';
import notificationRoutes from './routes/notification.js';

const app = express();

// Trust proxy (important for Vercel)
app.set('trust proxy', 1);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vendor App API',
      version: '1.0.0',
      description: 'REST API for Flutter vendor app with phone OTP authentication',
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/${config.apiVersion}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middlewares
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// API rate limiting
app.use(`/api/${config.apiVersion}`, apiRateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// API Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs.json', (req, res) => {
  res.json(swaggerSpec);
});

// API Routes
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/vendors', vendorRoutes);
apiRouter.use('/services', serviceRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/notifications', notificationRoutes);

app.use(`/api/${config.apiVersion}`, apiRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Connect to database (with caching for serverless)
if (!config.isVercel) {
  connectDB().catch((err) => {
    logger.error({ err }, 'Failed to connect to database');
    process.exit(1);
  });
}

export default app;
