const multer = require('multer');
const { BadRequestError } = require('../constants/errors');

// Use memory storage for Cloudinary stream upload
const storage = multer.memoryStorage();

/**
 * File filter to allow only images and videos
 */
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only images and videos are allowed!'), false);
  }
};

/**
 * Configure Multer
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (Adjust as needed)
  },
});

module.exports = upload;
