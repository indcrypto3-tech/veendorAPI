import { ValidationError } from '../utils/errors.js';

/**
 * Validate request body against Joi schema
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new ValidationError('Validation failed', details));
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};
