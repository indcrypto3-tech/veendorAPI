import Joi from 'joi';

export const createVendorSchema = Joi.object({
  businessName: Joi.string().required().min(2).max(200),
  description: Joi.string().max(1000),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    zipCode: Joi.string(),
    country: Joi.string(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180),
    }),
  }),
  phone: Joi.string().required().min(10).max(20),
  email: Joi.string().email(),
});

export const updateVendorSchema = Joi.object({
  businessName: Joi.string().min(2).max(200),
  description: Joi.string().max(1000).allow(''),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    zipCode: Joi.string(),
    country: Joi.string(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180),
    }),
  }),
  phone: Joi.string().min(10).max(20),
  email: Joi.string().email().allow(''),
});
