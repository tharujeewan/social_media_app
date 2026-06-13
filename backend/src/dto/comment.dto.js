/**
 * Comment DTO helpers.
 *
 * Responsible for shaping and sanitizing comment data
 * before sending it to the client.
 */

/**
 * Sanitise a raw Prisma comment object (with user included).
 * Handles deleted authors where user may be null.
 *
 * @param {Object} comment
 * @returns {Object}
 */
function sanitizeComment(comment) {
  return {
    id: comment.id,
    body: comment.body,
    parent_id: comment.parent_id ?? null,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    user: comment.user
      ? {
          id: comment.user.id,
          username: comment.user.username,
          avatar_url: comment.user.avatar_url ?? null,
        }
      : null,
  };
}

module.exports = { sanitizeComment };
