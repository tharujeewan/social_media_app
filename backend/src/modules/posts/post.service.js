const postRepository = require('./post.repository');
const uploadService = require('../uploads/upload.service');
const { sanitizePost } = require('../../dto/post.dto');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../../constants/errors');

class PostService {
  constructor(repo) {
    this.repo = repo;
  }

  // ✅ CREATE POST (with optional media upload)
  async createPost(userId, payload, file) {
    const { caption, media_url, interestIds = [] } = payload;

    // Determine the final media URL
    let finalMediaUrl = media_url || null;

    // If a file was uploaded, push it to Cloudinary
    if (file) {
      const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
      const result = await uploadService.uploadToCloudinary(
        file.buffer,
        'social_media_app',
        resourceType
      );
      finalMediaUrl = result.secure_url;
    }

    if (!caption && !finalMediaUrl) {
      throw new BadRequestError('Caption or media is required');
    }

    const post = await this.repo.create({
      caption,
      media_url: finalMediaUrl,
      user: {
        connect: { id: userId },
      },
      /* interests: {
        connect: interestIds.map((id) => ({ id })),
      }, */
    });

    return sanitizePost(post);
  }

  // ✅ GET SINGLE POST
  async getPostById(postId) {
    const post = await this.repo.findById(postId);

    if (!post || post.isDeleted) {
      throw new NotFoundError('Post not found');
    }

    return sanitizePost(post);
  }

  // ✅ GET ALL POSTS (Pagination)
  async getAllPosts({ page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const posts = await this.repo.findAll({
      skip,
      take: limit,
    });

    return posts.map(sanitizePost);
  }

  // ✅ FEED BASED ON INTERESTS
  async getFeed(userInterestIds, { page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const posts = await this.repo.findFeedByInterests(userInterestIds, {
      skip,
      take: limit,
    });

    return posts.map(sanitizePost);
  }

  // ✅ UPDATE POST
  async updatePost(userId, postId, payload) {
    const post = await this.repo.findById(postId);

    if (!post || post.isDeleted) {
      throw new NotFoundError('Post not found');
    }

    if (post.user_id !== userId) {
      throw new ForbiddenError('You are not allowed to update this post');
    }

    const updated = await this.repo.update(postId, payload);

    return sanitizePost(updated);
  }

  // ✅ DELETE POST (Soft delete)
  async deletePost(userId, postId) {
    const post = await this.repo.findById(postId);

    if (!post || post.isDeleted) {
      throw new NotFoundError('Post not found');
    }

    if (post.user_id !== userId) {
      throw new ForbiddenError('You are not allowed to delete this post');
    }

    await this.repo.softDelete(postId);

    return { message: 'Post deleted successfully' };
  }

  // ✅ SEARCH POSTS
  async searchPosts(query, { page = 1, limit = 10 }) {
    if (!query) {
      throw new BadRequestError('Search query is required');
    }

    const skip = (page - 1) * limit;

    const posts = await this.repo.search(query, {
      skip,
      take: limit,
    });

    return posts.map(sanitizePost);
  }
}

module.exports = new PostService(postRepository);