const cloudinary = require('../../config/cloudinary');
const { InternalServerError } = require('../../constants/errors');

class UploadService {
  /**
   * Uploads a file buffer to Cloudinary
   * @param {Buffer} fileBuffer - The file buffer from Multer
   * @param {string} folder - The Cloudinary folder to upload into
   * @param {string} resourceType - 'image' or 'video'
   */
  async uploadToCloudinary(fileBuffer, folder = 'social-media', resourceType = 'auto') {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            return reject(new InternalServerError('Cloudinary upload failed'));
          }
          resolve(result);
        }
      );

      // End the stream with the file buffer
      uploadStream.end(fileBuffer);
    });
  }
}

module.exports = new UploadService();
