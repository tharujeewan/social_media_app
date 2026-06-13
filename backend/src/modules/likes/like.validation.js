const Joi = require('joi');

const uuidParam = Joi.string().uuid().required();

// For POST /api/likes/:postId and GET /api/likes/:postId/users and GET /api/likes/:postId/status
const postIdParamSchema = Joi.object({
  postId: uuidParam,
});

// For GET /api/likes/:postId/users — page and limit query params
const likePaginationSchema = Joi.object({
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

module.exports = {
  postIdParamSchema,
  likePaginationSchema,
};
