import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    durationMinutes: {
      type: Number,
      default: 60,
      min: 0,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
      index: true,
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Text index for search
serviceSchema.index({ title: 'text', description: 'text' });

// Compound indexes
serviceSchema.index({ vendorId: 1, status: 1 });
serviceSchema.index({ status: 1, price: 1 });
serviceSchema.index({ category: 1, status: 1 });

const Service = mongoose.model('Service', serviceSchema);

export default Service;
