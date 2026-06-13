'use strict';

const { prisma } = require('../../config/db');
const postRepository = require('../posts/post.repository');
const likeRepository = require('./like.repository');
const { NotFoundError, BadRequestError } = require('../../constants/errors');

const notificationService = require('../notifications/notification.service');

class LikeService {
  /**
   * Toggle a like on a post for the given user.
   * Creates the like if it doesn't exist; deletes it if it does.
   *
   * @param {string} userId  - ID of the authenticated user
   * @param {string} postId  - ID of the post to like/unlike
   * @returns {Promise<{ liked: boolean, likes_count: number }>}
   */
  async toggleLike(userId, postId) {
    // 1. Fetch post — throw NotFoundError if missing or soft-deleted
    const post = await postRepository.findById(postId);
    if (!post || post.isDeleted) {
      throw new NotFoundError('Post not found');
    }

    // 2. Prevent self-like
    if (post.user_id === userId) {
      throw new BadRequestError('Cannot like your own post');
    }

    // 3. Run interactive transaction (conditional create vs delete)
    let liked;
    await prisma.$transaction(async (tx) => {
      const existingLike = await tx.like.findUnique({
        where: {
          user_id_post_id: {
            user_id: userId,
            post_id: postId,
          },
        },
      });

      if (!existingLike) {
        // Like does not exist — create it and increment counter
        await tx.like.create({
          data: {
            user_id: userId,
            post_id: postId,
          },
        });
        await tx.post.update({
          where: { id: postId },
          data: { likes_count: { increment: 1 } },
        });
        liked = true;
      } else {
        // Like exists — delete it and decrement counter (floor-guarded)
        await tx.like.delete({
          where: {
            user_id_post_id: {
              user_id: userId,
              post_id: postId,
            },
          },
        });
        // Use updateMany with a gt: 0 guard to prevent going below 0
        await tx.post.updateMany({
          where: {
            id: postId,
            likes_count: { gt: 0 },
          },
          data: { likes_count: { decrement: 1 } },
        });
        liked = false;
      }
    });

    // 4. Schedule notification as a post-commit side effect (fire-and-forget)
    if (liked && post.user_id !== userId) {
      setImmediate(() => {
        notificationService.dispatchLikeNotification(userId, postId, post.user_id)
          .catch(err => console.error('[NotificationService] like dispatch failed:', err));
      });
    }

    // 5. Fetch updated post for fresh likes_count
    const updatedPost = await postRepository.findById(postId);

    // 6. Return toggle result
    return {
      liked,
      likes_count: updatedPost.likes_count,
    };
  }

  /**
   * Get a paginated list of users who liked a post.
   *
   * @param {string} postId
   * @param {{ page: number, limit: number }} pagination
   * @returns {Promise<{ users: Array<{id, username, avatar_url}>, total: number, page: number, limit: number }>}
   */
  async getLikers(postId, { page, limit }) {
    // 1. Validate post exists
    const post = await postRepository.findById(postId);
    if (!post || post.isDeleted) {
      throw new NotFoundError('Post not found');
    }

    // 2. Calculate pagination offset
    const skip = (page - 1) * limit;

    // 3. Fetch paginated likes with user data
    const [likes, total] = await likeRepository.findByPostId(postId, { skip, take: limit });

    // 4. Return shaped response
    return {
      users: likes
        .map(l => l.user
          ? { id: l.user.id, username: l.user.username, avatar_url: l.user.avatar_url ?? null }
          : null)
        .filter(Boolean),
      total,
      page,
      limit,
    };
  }

  /**
   * Get the like status of a specific user for a post.
   *
   * @param {string} userId
   * @param {string} postId
   * @returns {Promise<{ liked: boolean, likes_count: number }>}
   */
  async getLikeStatus(userId, postId) {
    // 1. Validate post exists
    const post = await postRepository.findById(postId);
    if (!post || post.isDeleted) {
      throw new NotFoundError('Post not found');
    }

    // 2. Check if the user has liked this post
    const like = await likeRepository.findOne(userId, postId);

    // 3. Return like status with current count
    return {
      liked: !!like,
      likes_count: post.likes_count,
    };
  }
}

module.exports = new LikeService();
