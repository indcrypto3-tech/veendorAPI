import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/vendor_app',
    uriTest: process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/vendor_app_test',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),
    dummyMode: process.env.OTP_DUMMY_MODE === 'true',
    dummyCode: process.env.OTP_DUMMY_CODE || '123456',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '600000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '3', 10),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  payment: {
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'whsec_dummy',
  },
  
  isVercel: process.env.VERCEL === 'true' || process.env.VERCEL === '1',
};
