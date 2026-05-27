const uploadService = require('./upload.service');
const { success } = require('../../utils/response');
const { BadRequestError } = require('../../constants/errors');

/**
 * Handle single file upload
 */
const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError('Please provide a file to upload');
    }

    // Determine resource type based on mimetype
    const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    const result = await uploadService.uploadToCloudinary(
      req.file.buffer,
      'social_media_app', // Folder name
      resourceType
    );

    return success(res, {
      message: 'Media uploaded successfully',
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadMedia,
};
