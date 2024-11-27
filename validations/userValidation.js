const Joi = require("joi");

exports.registerSchema = Joi.object({
  name: Joi.string().max(25).required(),
  avatar: Joi.any(),
  email: Joi.string().email().max(25).required(),
  password: Joi.string().required(),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().max(25).required(),
  password: Joi.string().required(),
});
