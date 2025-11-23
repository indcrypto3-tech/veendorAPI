import crypto from 'crypto';

/**
 * Generate a random OTP code
 * @param {number} length - Length of OTP (default 6)
 * @returns {string} - OTP code
 */
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }
  
  return otp;
};

/**
 * Generate a cryptographically secure random token
 * @param {number} bytes - Number of bytes (default 32)
 * @returns {string} - Hex-encoded token
 */
export const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Generate refresh token with metadata
 * @returns {Object} - { token, expiresAt }
 */
export const generateRefreshToken = () => {
  const token = generateToken(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
  
  return { token, expiresAt };
};
