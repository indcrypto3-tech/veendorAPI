import Joi from 'joi';

export const sendOTPSchema = Joi.object({
  phone: Joi.string().required().min(10).max(20),
});

export const verifyOTPSchema = Joi.object({
  phone: Joi.string().required().min(10).max(20),
  otp: Joi.string().required().length(6).pattern(/^\d+$/),
  deviceId: Joi.string().optional(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const logoutSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
