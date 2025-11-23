import { errorResponse } from '../utils/response.js';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { config } from '../config/env.js';

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    err,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    userId: req.user?.userId,
  }, 'Error occurred');

  // Handle operational errors (AppError instances)
  if (err.isOperational) {
    return errorResponse(
      res,
      err.message,
      err.statusCode,
      err.code,
      err.details
    );
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
    return errorResponse(res, 'Validation failed', 400, 'VALIDATION_ERROR', details);
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, 'Invalid ID format', 400, 'INVALID_ID');
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return errorResponse(
      res,
      `${field} already exists`,
      409,
      'DUPLICATE_KEY',
      { field }
    );
  }

  // Handle unknown errors
  const message = config.env === 'development' ? err.message : 'Internal server error';
  const stack = config.env === 'development' ? err.stack : undefined;

  return errorResponse(
    res,
    message,
    500,
    'INTERNAL_ERROR',
    stack ? { stack } : null
  );
};

/**
 * Handle 404 not found
 */
export const notFoundHandler = (req, res) => {
  return errorResponse(
    res,
    `Route ${req.method} ${req.url} not found`,
    404,
    'NOT_FOUND'
  );
};
