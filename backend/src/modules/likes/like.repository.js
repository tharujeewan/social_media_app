const { prisma } = require('../../config/db');

class LikeRepository {
  /**
   * Find a single Like by composite key (userId + postId).
   * Used by the service for upsert-style toggle logic.
   */
  async findOne(userId, postId) {
    return prisma.like.findUnique({
      where: {
        user_id_post_id: {
          user_id: userId,
          post_id: postId,
        },
      },
    });
  }

  /**
   * Paginated list of likes for a post, including the liker's public profile.
   * Returns [likes[], total] via Promise.all.
   */
  async findByPostId(postId, { skip, take }) {
    return Promise.all([
      prisma.like.findMany({
        where: { post_id: postId },
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
            },
          },
        },
      }),
      prisma.like.count({ where: { post_id: postId } }),
    ]);
  }

  /**
   * Create a new Like record for the given user/post pair.
   */
  async create(userId, postId) {
    return prisma.like.create({
      data: {
        user_id: userId,
        post_id: postId,
      },
    });
  }

  /**
   * Delete a Like by composite key (userId + postId).
   */
  async deleteOne(userId, postId) {
    return prisma.like.delete({
      where: {
        user_id_post_id: {
          user_id: userId,
          post_id: postId,
        },
      },
    });
  }
}

module.exports = new LikeRepository();
