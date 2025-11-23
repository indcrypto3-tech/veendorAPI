import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedByTokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RefreshToken',
      default: null,
    },
    deviceInfo: {
      deviceId: String,
      userAgent: String,
      ip: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
refreshTokenSchema.index({ userId: 1, revokedAt: 1 });
refreshTokenSchema.index({ tokenHash: 1, revokedAt: 1 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
