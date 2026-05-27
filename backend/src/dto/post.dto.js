/**
 * Post DTO helpers.
 *
 * Responsible for shaping and sanitizing post data
 * before sending it to the client.
 */

/**
 * Sanitise a raw Prisma post object.
 * Removes unwanted fields and structures response.
 *
 * @param {Object} post
 * @returns {Object}
 */
function sanitizePost(post) {
  if (!post) return null;

  return {
    id: post.id,
    caption: post.caption,
    media_url: post.media_url,
    likes_count: post.likes_count,
    comments_count: post.comments_count,
    created_at: post.created_at,

    // Include minimal user info (avoid exposing everything)
    user: post.user
      ? {
          id: post.user.id,
          username: post.user.username,
          avatar_url: post.user.avatar_url,
        }
      : undefined,
  };
}

/**
 * Convert single post to response format
 */
function toPostResponse(post) {
  return sanitizePost(post);
}

/**
 * Convert multiple posts (array) to response format
 */
function toPostListResponse(posts = []) {
  return posts.map(sanitizePost);
}

module.exports = {
  sanitizePost,
  toPostResponse,
  toPostListResponse,
};