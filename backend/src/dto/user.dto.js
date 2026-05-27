/**
 * User DTO helpers.
 *
 * Sanitise Prisma user objects before sending them to the client,
 * ensuring no sensitive fields (e.g. password_hash) leak.
 */

/**
 * Strip sensitive fields from a raw Prisma user object.
 * @param {Object} user
 * @returns {Object}
 */
function sanitizeUser(user) {
  if (!user) return null;

  const {
    id,
    username,
    full_name,
    email,
    avatar_url,
    bio,
    role,
    created_at,
    updated_at,
  } = user;

  return {
    id,
    username,
    full_name,
    email,
    avatar_url,
    bio,
    role,
    created_at,
    updated_at,
  };
}

/**
 * Alias for sanitizeUser — clarifies intent when building a response payload.
 * @param {Object} user
 * @returns {Object}
 */
function toUserResponse(user) {
  return sanitizeUser(user);
}

module.exports = {
  sanitizeUser,
  toUserResponse,
};
