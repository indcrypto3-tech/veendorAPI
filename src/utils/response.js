/**
 * Standard success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 */
export const successResponse = (res, data = null, statusCode = 200, message = 'Success') => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Standard error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 */
export const errorResponse = (res, message = 'Error', statusCode = 500, code = 'INTERNAL_ERROR', details = null) => {
  const response = {
    success: false,
    code,
    message,
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Pagination metadata
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 */
export const paginationMeta = (total, page, limit) => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
  };
};

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Data array
 * @param {Object} meta - Pagination metadata
 */
export const paginatedResponse = (res, data, meta) => {
  return res.status(200).json({
    success: true,
    data,
    meta,
  });
};
