const Joi = require("joi");

exports.createCommentSchema = Joi.object({
  content: Joi.string().max(500).required(),
});
