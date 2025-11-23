import { rateLimit } from 'express-rate-limit';
import { config } from '../config/env.js';

/**
 * Rate limiter for OTP endpoints
 */
export const otpRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many OTP requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Rate limit by phone number if provided, otherwise by IP
    return req.body.phone || req.ip;
  },
});

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
