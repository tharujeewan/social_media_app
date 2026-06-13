const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .trim(),

  email: Joi.string()
    .email()
    .required()
    .trim()
    .lowercase(),

  password: Joi.string()
    .min(8)
    .required()
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'password strength'
    )
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one digit.',
    }),

  full_name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .trim(),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .trim()
    .lowercase(),

  password: Joi.string()
    .required(),
});

const refreshSchema = Joi.object({
  refresh_token: Joi.string()
    .required(),
});

const firebaseLoginSchema = Joi.object({
  id_token: Joi.string().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  firebaseLoginSchema,
};
