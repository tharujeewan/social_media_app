const { Router } = require('express');
const controller = require('./comment.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const {
  createCommentSchema,
  updateCommentSchema,
  postIdParamSchema,
  commentIdParamSchema,
  postAndCommentParamSchema,
  commentPaginationSchema,
} = require('./comment.validation');

const router = Router();

// POST /api/comments/:postId — create comment (auth required)
router.post(
  '/:postId',
  authenticate,
  validate({ params: postIdParamSchema, body: createCommentSchema }),
  controller.createComment
);

// GET /api/comments/:postId — get top-level comments (public)
router.get(
  '/:postId',
  validate({ params: postIdParamSchema, query: commentPaginationSchema }),
  controller.getComments
);

// GET /api/comments/:postId/replies/:commentId — get replies (public)
router.get(
  '/:postId/replies/:commentId',
  validate({ params: postAndCommentParamSchema, query: commentPaginationSchema }),
  controller.getReplies
);

// PUT /api/comments/:commentId — update comment (auth required)
router.put(
  '/:commentId',
  authenticate,
  validate({ params: commentIdParamSchema, body: updateCommentSchema }),
  controller.updateComment
);

// DELETE /api/comments/:commentId — delete comment (auth required)
router.delete(
  '/:commentId',
  authenticate,
  validate({ params: commentIdParamSchema }),
  controller.deleteComment
);

module.exports = router;
