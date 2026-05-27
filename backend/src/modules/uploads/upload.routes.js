const { Router } = require('express');
const controller = require('./upload.controller');
const upload = require('../../middleware/upload.middleware');
const { authenticate } = require('../../middleware/auth.middleware');

const router = Router();

/**
 * @route   POST /api/upload
 * @desc    Upload an image or video
 * @access  Protected
 */
router.post(
  '/',
  authenticate,
  upload.single('media'), // Key name specified by user: media
  controller.uploadMedia
);

module.exports = router;
