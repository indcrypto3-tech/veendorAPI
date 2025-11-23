import Joi from 'joi';

export const createServiceSchema = Joi.object({
  title: Joi.string().required().min(2).max(200),
  description: Joi.string().max(2000),
  price: Joi.number().required().min(0),
  currency: Joi.string().length(3).uppercase(),
  durationMinutes: Joi.number().min(1),
  category: Joi.string(),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      alt: Joi.string(),
    })
  ),
});

export const updateServiceSchema = Joi.object({
  title: Joi.string().min(2).max(200),
  description: Joi.string().max(2000).allow(''),
  price: Joi.number().min(0),
  currency: Joi.string().length(3).uppercase(),
  durationMinutes: Joi.number().min(1),
  category: Joi.string().allow(''),
  status: Joi.string().valid('active', 'inactive', 'archived'),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      alt: Joi.string(),
    })
  ),
});
