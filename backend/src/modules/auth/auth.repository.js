const { prisma } = require('../../config/db');

/**
 * Data-access layer for authentication-related entities.
 */
class AuthRepository {
  /**
   * Find a user by their email address.
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find a user by their username.
   * @param {string} username
   * @returns {Promise<Object|null>}
   */
  async findByUsername(username) {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Find a user by their ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new user.
   * @param {Object} data
   * @param {string} data.username
   * @param {string} data.email
   * @param {string} data.password_hash
   * @param {string} data.full_name
   * @param {string} [data.role]
   * @returns {Promise<Object>}
   */
  async createUser(data) {
    return prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password_hash: data.password_hash,
        full_name: data.full_name,
        role: data.role || 'USER',
      },
    });
  }

  /**
   * Persist a hashed refresh token.
   * @param {string} userId
   * @param {string} tokenHash
   * @param {Date} expiresAt
   * @returns {Promise<Object>}
   */
  async saveRefreshToken(userId, tokenHash, expiresAt) {
    return prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });
  }

  /**
   * Find a refresh token by its hash, including the associated user.
   * @param {string} tokenHash
   * @returns {Promise<Object|null>}
   */
  async findRefreshToken(tokenHash) {
    return prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });
  }

  /**
   * Delete a single refresh token by its hash.
   * @param {string} tokenHash
   * @returns {Promise<Object>}
   */
  async deleteRefreshToken(tokenHash) {
    return prisma.refreshToken.delete({
      where: { token_hash: tokenHash },
    });
  }

  /**
   * Revoke every refresh token belonging to a user.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async deleteAllUserRefreshTokens(userId) {
    return prisma.refreshToken.deleteMany({
      where: { user_id: userId },
    });
  }
}

module.exports = new AuthRepository();
