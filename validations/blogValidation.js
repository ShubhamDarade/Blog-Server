const Joi = require("joi");

exports.createBlogSchema = Joi.object({
  title: Joi.string().max(100).required(),
  description: Joi.string().max(2500).required(),
  img: Joi.any(),
});
