const { prisma } = require('../../config/db');

const USER_SELECT = {
  id: true,
  username: true,
  avatar_url: true,
};

class CommentRepository {
  /**
   * Find a single comment by ID, including the author.
   * @param {string} commentId
   */
  async findById(commentId) {
    return prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: { select: USER_SELECT },
      },
    });
  }

  /**
   * Find top-level comments for a post (parent_id IS NULL), newest first.
   * @param {string} postId
   * @param {{ skip: number, take: number }} pagination
   * @returns {Promise<[Comment[], number]>}
   */
  async findTopLevelByPostId(postId, { skip, take }) {
    const where = { post_id: postId, parent_id: null };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: USER_SELECT },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    return [comments, total];
  }

  /**
   * Find replies for a parent comment, oldest first.
   * @param {string} parentId
   * @param {{ skip: number, take: number }} pagination
   * @returns {Promise<[Comment[], number]>}
   */
  async findRepliesByParentId(parentId, { skip, take }) {
    const where = { parent_id: parentId };

    const [replies, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'asc' },
        include: {
          user: { select: USER_SELECT },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    return [replies, total];
  }

  /**
   * Count how many replies a comment has.
   * Used to compute the total decrement before a cascade delete.
   * @param {string} parentId
   * @returns {Promise<number>}
   */
  async countReplies(parentId) {
    return prisma.comment.count({ where: { parent_id: parentId } });
  }

  /**
   * Create a new comment and return it with its author.
   * @param {{ user_id: string, post_id: string, parent_id?: string|null, body: string }} data
   */
  async create({ user_id, post_id, parent_id, body }) {
    return prisma.comment.create({
      data: {
        user_id,
        post_id,
        parent_id: parent_id ?? null,
        body,
      },
      include: {
        user: { select: USER_SELECT },
      },
    });
  }

  /**
   * Update a comment's body and return the updated record with its author.
   * @param {string} commentId
   * @param {{ body: string }} data
   */
  async update(commentId, { body }) {
    return prisma.comment.update({
      where: { id: commentId },
      data: { body },
      include: {
        user: { select: USER_SELECT },
      },
    });
  }

  /**
   * Hard-delete a comment by ID.
   * Prisma cascade rules (defined in schema) will delete any replies automatically.
   * @param {string} commentId
   */
  async delete(commentId) {
    return prisma.comment.delete({ where: { id: commentId } });
  }
}

module.exports = new CommentRepository();
