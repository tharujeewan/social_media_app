const { Router } = require('express');

// 🔹 Import route modules
const authRoutes = require('../modules/auth/auth.routes');
const postRoutes = require('../modules/posts/post.routes');
const uploadRoutes = require('../modules/uploads/upload.routes');

const router = Router();

// 🔹 Mount routes
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/upload', uploadRoutes);

// 🔹 Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;