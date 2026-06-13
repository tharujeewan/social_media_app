'use strict';

const { prisma } = require('../../config/db');
const postRepository = require('../posts/post.repository');
const commentRepository = require('./comment.repository');
const { sanitizeComment } = require('../../dto/comment.dto');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../../constants/errors');
const notificationService = require('../notifications/notification.service');

class CommentService {
  /**
   * Create a new comment or reply on a post.
   *
   * Enforces a one-level reply depth limit: a reply to a reply is rejected.
   * Increments Post.comments_count atomically inside a Prisma transaction.
   *
   * @param {string} userId   - Authenticated user's ID
   * @param {string} postId   - Target post's ID
   * @param {{ body: string, parent_id?: string }} params
   * @returns {Promise<Object>} Sanitized comment DTO
   */
  async createComment(userId, postId, { body, parent_id }) {
    // 1. Validate post exists and is not deleted
    const post = await postRepository.findById(postId);
    if (!post || post.isDeleted) {
      throw new NotFoundError('Post not found');
    }

    // 2. Validate parent comment if provided
    let parent = null;
    if (parent_id) {
      parent = await commentRepository.findById(parent_id);

      if (!parent || parent.post_id !== postId) {
        throw new NotFoundError('Parent comment not found on this post');
      }

      if (parent.parent_id !== null) {
        throw new BadRequestError('Reply depth limit reached. Cannot reply to a reply.');
      }
    }

    // 3. Run atomic transaction: create comment + increment post counter
    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          user_id: userId,
          post_id: postId,
          parent_id: parent_id ?? null,
          body,
        },
        include: {
          user: {
            select: { id: true, username: true, avatar_url: true },
          },
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: { comments_count: { increment: 1 } },
      });

      return newComment;
    });

    // 4. Post-commit side effect: dispatch notifications (fire-and-forget)
    setImmediate(() => {
      if (post.user_id !== userId) {
        notificationService.dispatchCommentNotification(userId, postId, comment.id, post.user_id)
          .catch(err => console.error('[NotificationService] comment dispatch failed:', err));
      }
      if (parent_id && parent && parent.user_id !== userId) {
        notificationService.dispatchReplyNotification(userId, postId, comment.id, parent.user_id)
          .catch(err => console.error('[NotificationService] reply dispatch failed:', err));
      }
    });

    // 5. Return sanitized comment
    return sanitizeComment(comment);
  }

  /**
   * Get paginated top-level comments for a post.
   * @param {string} postId
   * @param {{ page: number, limit: number }} pagination
   */
  async getComments(postId, { page, limit }) {
    // 1. Validate post exists and is not deleted
    const post = await postRepository.findById(postId);
    if (!post || post.isDeleted) {
      throw new NotFoundError('Post not found');
    }

    // 2. Calculate pagination offset
    const skip = (page - 1) * limit;

    // 3. Fetch top-level comments with total count
    const [comments, total] = await commentRepository.findTopLevelByPostId(postId, { skip, take: limit });

    // 4. Return sanitized paginated result
    return { comments: comments.map(sanitizeComment), total, page, limit };
  }

  /**
   * Get paginated replies for a comment.
   * @param {string} postId
   * @param {string} commentId
   * @param {{ page: number, limit: number }} pagination
   */
  async getReplies(postId, commentId, { page, limit }) {
    // 1. Validate the parent comment exists and belongs to the post
    const parent = await commentRepository.findById(commentId);
    if (!parent || parent.post_id !== postId) {
      throw new NotFoundError('Comment not found on this post');
    }

    // 2. Calculate pagination offset
    const skip = (page - 1) * limit;

    // 3. Fetch replies with total count
    const [replies, total] = await commentRepository.findRepliesByParentId(commentId, { skip, take: limit });

    // 4. Return sanitized paginated result
    return { replies: replies.map(sanitizeComment), total, page, limit };
  }

  /**
   * Update a comment's body (owner only).
   * @param {string} userId
   * @param {string} commentId
   * @param {{ body: string }} params
   * @returns {Promise<Object>} Sanitized comment DTO
   */
  async updateComment(userId, commentId, { body }) {
    // 1. Fetch comment — throw if not found
    const comment = await commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // 2. Ownership check
    if (comment.user_id !== userId) {
      throw new ForbiddenError('You are not allowed to edit this comment');
    }

    // 3. Persist the update
    const updated = await commentRepository.update(commentId, { body });

    // 4. Return sanitized DTO
    return sanitizeComment(updated);
  }

  /**
   * Delete a comment (owner only).
   * Cascade-deletes replies and decrements Post.comments_count accordingly.
   * @param {string} userId
   * @param {string} commentId
   * @returns {Promise<{ message: string }>}
   */
  async deleteComment(userId, commentId) {
    // 1. Fetch comment — throw if not found
    const comment = await commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // 2. Ownership check
    if (comment.user_id !== userId) {
      throw new ForbiddenError('You are not allowed to delete this comment');
    }

    // 3. Atomic transaction: delete comment(s) + decrement post counter
    await prisma.$transaction(async (tx) => {
      let totalDeleted;

      if (comment.parent_id === null) {
        // Top-level comment: count replies first, then delete (cascade removes replies)
        const replyCount = await tx.comment.count({ where: { parent_id: commentId } });
        await tx.comment.delete({ where: { id: commentId } });
        totalDeleted = replyCount + 1;
      } else {
        // Reply: just delete the single record
        await tx.comment.delete({ where: { id: commentId } });
        totalDeleted = 1;
      }

      // Decrement with floor guard: only decrement if count >= totalDeleted
      const result = await tx.post.updateMany({
        where: { id: comment.post_id, comments_count: { gte: totalDeleted } },
        data: { comments_count: { decrement: totalDeleted } },
      });

      // If count was already below totalDeleted, clamp to 0
      if (result.count === 0) {
        await tx.post.update({
          where: { id: comment.post_id },
          data: { comments_count: 0 },
        });
      }
    });

    // 4. Return success message
    return { message: 'Comment deleted successfully' };
  }
}

module.exports = new CommentService();
