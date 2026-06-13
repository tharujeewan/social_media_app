const crypto = require('crypto');
const authRepository = require('./auth.repository');
const { hashPassword, comparePassword } = require('../../utils/hash');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../../utils/jwt');
const {
  AuthenticationError,
  ConflictError,
  NotFoundError,
} = require('../../constants/errors');
const { sanitizeUser } = require('../../dto/user.dto');
const { firebaseAdmin } = require('../../config/firebase');

const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash a raw refresh token with SHA-256 for secure DB storage.
 * @param {string} token
 * @returns {string}
 */
function sha256(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Business-logic layer for authentication.
 */
class AuthService {
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Register a new user.
   * @param {Object} payload
   * @param {string} payload.username
   * @param {string} payload.email
   * @param {string} payload.password
   * @param {string} payload.full_name
   * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
   */
  async register({ username, email, password, full_name }) {
    const existingEmail = await this.repository.findByEmail(email);
    if (existingEmail) {
      throw new ConflictError('Email already registered');
    }

    const existingUsername = await this.repository.findByUsername(username);
    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }

    const password_hash = await hashPassword(password);

    const user = await this.repository.createUser({
      username,
      email,
      password_hash,
      full_name,
    });

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

    const tokenHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await this.repository.saveRefreshToken(user.id, tokenHash, expiresAt);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Log in an existing user.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
   */
  async login(email, password) {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      throw new AuthenticationError('Invalid email or password');
    }

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

    const tokenHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await this.repository.saveRefreshToken(user.id, tokenHash, expiresAt);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Rotate a refresh token and issue a new token pair.
   * @param {string} refreshToken
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  async refreshToken(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);

    const tokenHash = sha256(refreshToken);
    const storedToken = await this.repository.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw new AuthenticationError('Invalid refresh token');
    }

    if (storedToken.expires_at < new Date()) {
      await this.repository.deleteRefreshToken(tokenHash).catch(() => {});
      throw new AuthenticationError('Refresh token has expired');
    }

    await this.repository.deleteRefreshToken(tokenHash).catch(() => {});

    const user = storedToken.user;
    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user.id, role: user.role });

    const newTokenHash = sha256(newRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await this.repository.saveRefreshToken(user.id, newTokenHash, expiresAt);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Log out a user by revoking their refresh token.
   * Idempotent — does not throw if the token is absent.
   * @param {string} refreshToken
   * @returns {Promise<void>}
   */
  async logout(refreshToken) {
    if (!refreshToken) {
      return;
    }
    const tokenHash = sha256(refreshToken);
    try {
      await this.repository.deleteRefreshToken(tokenHash);
    } catch {
      // Idempotent: token may already be revoked or never existed
    }
  }

  /**
   * Authenticate (or auto-register) a user via a Firebase ID token.
   *
   * Flow:
   *  1. Verify the Firebase ID token with the Admin SDK.
   *  2. Look up the user by their Firebase UID or email.
   *  3. If the user doesn't exist, create them automatically.
   *  4. Issue the app's own access + refresh token pair.
   *
   * @param {string} idToken – Firebase ID token from the client.
   * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
   */
  async loginWithFirebase(idToken) {
    let decodedToken;
    try {
      decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    } catch {
      throw new AuthenticationError('Invalid Firebase ID token');
    }

    const { uid, email, name: displayName } = decodedToken;

    if (!email) {
      throw new AuthenticationError(
        'Firebase account must have an associated email address'
      );
    }

    // Try to find an existing user by email
    let user = await this.repository.findByEmail(email);

    if (!user) {
      // Auto-register: derive a unique username from the Firebase UID
      const baseUsername = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
      let username = baseUsername.slice(0, 28);

      // Ensure username uniqueness by appending part of the UID if needed
      const existing = await this.repository.findByUsername(username);
      if (existing) {
        username = `${username.slice(0, 24)}${uid.slice(0, 4)}`;
      }

      // Firebase users have no local password — use a random hash
      const password_hash = await hashPassword(crypto.randomBytes(32).toString('hex'));

      user = await this.repository.createUser({
        username,
        email,
        password_hash,
        full_name: displayName || username,
      });
    }

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

    const tokenHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await this.repository.saveRefreshToken(user.id, tokenHash, expiresAt);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Retrieve the current authenticated user's profile.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getMe(userId) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return sanitizeUser(user);
  }
}

module.exports = new AuthService(authRepository);
