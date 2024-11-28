const Joi = require("joi");

exports.registerSchema = Joi.object({
  name: Joi.string().max(35).required(),
  avatar: Joi.any(),
  email: Joi.string().email().max(35).required(),
  password: Joi.string().required(),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().max(35).required(),
  password: Joi.string().required(),
});
