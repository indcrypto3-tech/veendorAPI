import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import RefreshToken from '../models/RefreshToken.js';
import { config } from '../config/env.js';
import { normalizePhone } from '../utils/phone.js';
import { generateOTP, generateRefreshToken } from '../utils/token.js';
import { hashValue, compareHash } from '../utils/hash.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { ValidationError, UnauthorizedError, TooManyRequestsError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Send OTP to phone number
 * POST /api/v1/auth/send-otp
 */
export const sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      throw new ValidationError('Phone number is required');
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone);

    // Check if OTP was recently sent
    const existingOTP = await OTP.findOne({
      phone: normalizedPhone,
      expiresAt: { $gt: new Date() },
    });

    if (existingOTP) {
      const waitTime = Math.ceil((existingOTP.expiresAt - new Date()) / 1000 / 60);
      throw new TooManyRequestsError(
        `OTP already sent. Please wait ${waitTime} minute(s) before requesting again.`
      );
    }

    // Generate OTP
    const otpCode = config.otp.dummyMode ? config.otp.dummyCode : generateOTP(6);

    // Hash OTP
    const otpHash = await hashValue(otpCode);

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.otp.expiryMinutes);

    // Save OTP to database
    await OTP.create({
      phone: normalizedPhone,
      otpHash,
      expiresAt,
      attempts: 0,
    });

    logger.info({ phone: normalizedPhone }, 'OTP sent successfully');

    // In production, send SMS here
    // await smsService.send(normalizedPhone, `Your OTP is: ${otpCode}`);

    const response = {
      message: 'OTP sent successfully',
      expiresIn: config.otp.expiryMinutes * 60, // seconds
    };

    // In dummy mode, return OTP for testing
    if (config.otp.dummyMode) {
      response.debugOtp = otpCode;
    }

    return successResponse(res, response, 200, 'OTP sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP and login/register user
 * POST /api/v1/auth/verify-otp
 */
export const verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp, deviceId } = req.body;

    if (!phone || !otp) {
      throw new ValidationError('Phone number and OTP are required');
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone);

    // Find OTP record
    const otpRecord = await OTP.findOne({
      phone: normalizedPhone,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      throw new UnauthorizedError('Invalid or expired OTP');
    }

    // Check max attempts
    if (otpRecord.attempts >= config.otp.maxAttempts) {
      await OTP.deleteOne({ _id: otpRecord._id });
      throw new UnauthorizedError('Maximum OTP attempts exceeded. Please request a new OTP.');
    }

    // Verify OTP
    const isValid = await compareHash(otp, otpRecord.otpHash);

    if (!isValid) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();
      
      throw new UnauthorizedError(
        `Invalid OTP. ${config.otp.maxAttempts - otpRecord.attempts} attempts remaining.`
      );
    }

    // Delete OTP after successful verification
    await OTP.deleteOne({ _id: otpRecord._id });

    // Find or create user
    let user = await User.findOne({ phone: normalizedPhone });

    if (!user) {
      user = await User.create({
        phone: normalizedPhone,
        role: 'vendor',
        phoneVerified: true,
      });
      logger.info({ userId: user._id, phone: normalizedPhone }, 'New user created');
    } else {
      user.phoneVerified = true;
      await user.save();
    }

    // Generate access token (JWT)
    const accessToken = jwt.sign(
      { userId: user._id, phone: user.phone, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Generate refresh token (opaque)
    const { token: refreshTokenValue, expiresAt } = generateRefreshToken();
    const refreshTokenHash = await hashValue(refreshTokenValue);

    // Save refresh token to database
    const refreshToken = await RefreshToken.create({
      userId: user._id,
      tokenHash: refreshTokenHash,
      expiresAt,
      deviceInfo: {
        deviceId: deviceId || null,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    });

    logger.info({ userId: user._id }, 'User logged in successfully');

    return successResponse(
      res,
      {
        accessToken,
        refreshToken: refreshTokenValue,
        user: user.toJSON(),
      },
      200,
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    // Hash the provided token
    const tokenHash = await hashValue(refreshToken);

    // Find refresh token in database
    const tokenRecord = await RefreshToken.findOne({
      expiresAt: { $gt: new Date() },
      revokedAt: null,
    });

    // Verify hash matches
    let validToken = null;
    if (tokenRecord) {
      const tokens = await RefreshToken.find({
        userId: tokenRecord.userId,
        expiresAt: { $gt: new Date() },
        revokedAt: null,
      });

      for (const token of tokens) {
        const isValid = await compareHash(refreshToken, token.tokenHash);
        if (isValid) {
          validToken = token;
          break;
        }
      }
    }

    if (!validToken) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Get user
    const user = await User.findById(validToken.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user._id, phone: user.phone, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Rotate refresh token
    const { token: newRefreshTokenValue, expiresAt } = generateRefreshToken();
    const newRefreshTokenHash = await hashValue(newRefreshTokenValue);

    // Create new refresh token
    const newRefreshToken = await RefreshToken.create({
      userId: user._id,
      tokenHash: newRefreshTokenHash,
      expiresAt,
      deviceInfo: validToken.deviceInfo,
    });

    // Revoke old refresh token
    validToken.revokedAt = new Date();
    validToken.replacedByTokenId = newRefreshToken._id;
    await validToken.save();

    logger.info({ userId: user._id }, 'Access token refreshed');

    return successResponse(
      res,
      {
        accessToken,
        refreshToken: newRefreshTokenValue,
      },
      200,
      'Token refreshed successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (revoke refresh token)
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    // Find and revoke all matching tokens
    const tokens = await RefreshToken.find({
      revokedAt: null,
    });

    for (const token of tokens) {
      const isValid = await compareHash(refreshToken, token.tokenHash);
      if (isValid) {
        token.revokedAt = new Date();
        await token.save();
        logger.info({ userId: token.userId }, 'User logged out');
        break;
      }
    }

    return successResponse(res, null, 200, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/v1/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return successResponse(res, { user: user.toJSON() }, 200, 'User profile retrieved');
  } catch (error) {
    next(error);
  }
};
