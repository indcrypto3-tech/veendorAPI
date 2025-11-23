import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a string using bcrypt
 * @param {string} value - String to hash
 * @returns {Promise<string>} - Hashed value
 */
export const hashValue = async (value) => {
  return bcrypt.hash(value, SALT_ROUNDS);
};

/**
 * Compare a plain value with a hashed value
 * @param {string} value - Plain value
 * @param {string} hash - Hashed value
 * @returns {Promise<boolean>} - True if match
 */
export const compareHash = async (value, hash) => {
  return bcrypt.compare(value, hash);
};
