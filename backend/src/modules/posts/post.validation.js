const Joi = require('joi');

const objectId = Joi.string().uuid();

// ✅ CREATE POST
const createPostSchema = Joi.object({
  caption: Joi.string()
    .trim()
    .max(500)
    .allow('', null),

  media_url: Joi.string()
    .uri()
    .allow('', null),

  interestIds: Joi.array()
    .items(objectId)
    .min(1)
    .max(5)
    .optional(),
});
// NOTE: "caption or media required" is enforced in the service layer
// because media can arrive as a file (req.file) which Joi can't see.


// ✅ UPDATE POST
const updatePostSchema = Joi.object({
  caption: Joi.string()
    .trim()
    .max(500)
    .optional(),

  media_url: Joi.string()
    .uri()
    .optional(),

  interestIds: Joi.array()
    .items(objectId)
    .min(1)
    .max(5)
    .optional(),
}).min(1); // ❗ At least one field required


// ✅ PARAM VALIDATION (postId)
const postIdParamSchema = Joi.object({
  id: objectId.required(),
});


// ✅ PAGINATION (for feed / list)
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});


// ✅ SEARCH
const searchSchema = Joi.object({
  query: Joi.string().trim().min(2).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

module.exports = {
  createPostSchema,
  updatePostSchema,
  postIdParamSchema,
  paginationSchema,
  searchSchema,
};