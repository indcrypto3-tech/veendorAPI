import Joi from 'joi';

export const createOrderSchema = Joi.object({
  serviceId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/),
  scheduledAt: Joi.date().required().min('now'),
  notes: Joi.string().max(500),
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .required()
    .valid('pending', 'confirmed', 'in_progress', 'completed', 'cancelled'),
  cancellationReason: Joi.string().max(500),
});
