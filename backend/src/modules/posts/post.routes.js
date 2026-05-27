const { Router } = require('express');

const controller = require('./post.controller');

const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload.middleware');

const {
  createPostSchema,
  updatePostSchema,
  postIdParamSchema,
  paginationSchema,
  searchSchema,
} = require('./post.validation');

const router = Router();

/**
 * Conditionally run multer only when the request is multipart/form-data.
 * This prevents the "Boundary not found" crash for JSON-only (text-only) posts.
 */
const optionalUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.startsWith('multipart/form-data')) {
    return upload.single('media')(req, res, next);
  }
  next();
};

// ===============================
// ✅ CREATE POST (with optional media upload)
// POST /api/posts
// Body: multipart/form-data — "caption" (text), "media" (file, optional)
//       OR application/json  — { "caption": "..." }
// ===============================
router.post(
  '/',
  authenticate,
  optionalUpload,                // Parse file only when multipart
  validate({ body: createPostSchema }),
  controller.createPost
);

// ===============================
// ✅ GET ALL POSTS (with pagination)
// GET /api/posts?page=1&limit=10
// ===============================
router.get(
  '/',
  validate({ query: paginationSchema }),
  controller.getAllPosts
);

// ===============================
// ✅ GET FEED (based on interests)
// GET /api/posts/feed?page=1&limit=10
// ===============================
router.get(
  '/feed',
  authenticate,
  validate({ query: paginationSchema }),
  controller.getFeed
);

// ===============================
// ✅ SEARCH POSTS
// GET /api/posts/search?query=react
// ===============================
router.get(
  '/search',
  validate({ query: searchSchema }),
  controller.searchPosts
);

// ===============================
// ✅ GET SINGLE POST
// GET /api/posts/:id
// ===============================
router.get(
  '/:id',
  validate({ params: postIdParamSchema }),
  controller.getPostById
);

// ===============================
// ✅ UPDATE POST
// PUT /api/posts/:id
// ===============================
router.put(
  '/:id',
  authenticate,
  validate({
    params: postIdParamSchema,
    body: updatePostSchema,
  }),
  controller.updatePost
);

// ===============================
// ✅ DELETE POST
// DELETE /api/posts/:id
// ===============================
router.delete(
  '/:id',
  authenticate,
  validate({ params: postIdParamSchema }),
  controller.deletePost
);

module.exports = router;