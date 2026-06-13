const { Router } = require('express');
const controller = require('./like.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { postIdParamSchema, likePaginationSchema } = require('./like.validation');

const router = Router();

// POST /api/likes/:postId — toggle like (auth required)
router.post(
  '/:postId',
  authenticate,
  validate({ params: postIdParamSchema }),
  controller.toggleLike
);

// GET /api/likes/:postId/users — get likers (public)
router.get(
  '/:postId/users',
  validate({ params: postIdParamSchema, query: likePaginationSchema }),
  controller.getLikers
);

// GET /api/likes/:postId/status — get like status (auth required)
router.get(
  '/:postId/status',
  authenticate,
  validate({ params: postIdParamSchema }),
  controller.getLikeStatus
);

module.exports = router;
