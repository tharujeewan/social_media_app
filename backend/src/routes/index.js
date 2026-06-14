const { Router } = require('express');

// 🔹 Import route modules
const authRoutes = require('../modules/auth/auth.routes');
const postRoutes = require('../modules/posts/post.routes');
const uploadRoutes = require('../modules/uploads/upload.routes');
const likeRoutes = require('../modules/likes/like.routes');
const commentRoutes = require('../modules/comments/comment.routes');

const router = Router();

// 🔹 Mount routes
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/upload', uploadRoutes);
router.use('/likes', likeRoutes);
router.use('/comments', commentRoutes);


module.exports = router;
