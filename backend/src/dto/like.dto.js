/**
 * Like DTO helpers.
 *
 * Responsible for shaping and sanitizing like data
 * before sending it to the client.
 */

/**
 * Sanitise a raw Prisma Like object (with user included).
 * Returns a clean object with only the fields needed by the client.
 *
 * @param {Object} like - Prisma Like record with `user` relation included
 * @returns {{ userId: string|null, username: string|null, avatar_url: string|null, likedAt: Date }}
 */
function sanitizeLike(like) {
  return {
    userId: like.user?.id ?? null,
    username: like.user?.username ?? null,
    avatar_url: like.user?.avatar_url ?? null,
    likedAt: like.created_at,
  };
}

module.exports = { sanitizeLike };
