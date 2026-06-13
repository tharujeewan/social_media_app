const Joi = require('joi');

const uuidParam = Joi.string().uuid().required();

// POST /api/comments/:postId — body and optional parent_id
const createCommentSchema = Joi.object({
  body:      Joi.string().trim().min(1).max(1000).required(),
  parent_id: Joi.string().uuid().optional(),
});

// PUT /api/comments/:commentId — body only
const updateCommentSchema = Joi.object({
  body: Joi.string().trim().min(1).max(1000).required(),
});

// For routes with :postId only
const postIdParamSchema = Joi.object({
  postId: uuidParam,
});

// For routes with :commentId only
const commentIdParamSchema = Joi.object({
  commentId: uuidParam,
});

// For GET /api/comments/:postId/replies/:commentId
const postAndCommentParamSchema = Joi.object({
  postId:    uuidParam,
  commentId: uuidParam,
});

// page and limit for all list endpoints
const commentPaginationSchema = Joi.object({
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

module.exports = {
  createCommentSchema,
  updateCommentSchema,
  postIdParamSchema,
  commentIdParamSchema,
  postAndCommentParamSchema,
  commentPaginationSchema,
};
