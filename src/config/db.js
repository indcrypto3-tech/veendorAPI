import mongoose from 'mongoose';
import { config } from './env.js';
import logger from '../utils/logger.js';

// Cache connection for serverless (Vercel)
let cachedConnection = null;

/**
 * Connect to MongoDB with connection caching for serverless environments
 */
export const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    logger.info('Using cached MongoDB connection');
    return cachedConnection;
  }

  try {
    const mongoUri = config.env === 'test' ? config.mongo.uriTest : config.mongo.uri;
    
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: config.isVercel ? 1 : 10,
      minPoolSize: config.isVercel ? 0 : 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedConnection = conn;
    
    logger.info({
      host: conn.connection.host,
      name: conn.connection.name,
    }, 'MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      cachedConnection = null;
    });

    return conn;
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection failed');
    cachedConnection = null;
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDB = async () => {
  if (cachedConnection) {
    await mongoose.disconnect();
    cachedConnection = null;
    logger.info('MongoDB disconnected');
  }
};

/**
 * Clear database (for testing)
 */
export const clearDB = async () => {
  if (config.env !== 'test') {
    throw new Error('clearDB can only be used in test environment');
  }
  
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  logger.info('Database cleared');
};
