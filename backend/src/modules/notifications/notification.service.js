'use strict';

/**
 * NotificationService
 *
 * Handles fire-and-forget in-app notification dispatch for LIKE, COMMENT,
 * and REPLY events. Features:
 *  - Exponential-backoff retry (up to 3 attempts)
 *  - In-memory TTL deduplication cache (60-second window)
 */
class NotificationService {
  constructor() {
    /**
     * Dedup cache: Map<string, number>
     * key   → `actorId:recipientId:type:referenceId`
     * value → expiry timestamp (Date.now() + 60_000)
     */
    this._dedupCache = new Map();
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Retry wrapper with exponential backoff.
   * Attempts `fn` up to `maxRetries` times.
   * On each failure waits `200 * attempt` ms before the next try.
   * After all retries exhausted, logs the error to stderr and returns silently.
   *
   * @param {() => Promise<void>} fn
   * @param {number} maxRetries
   */
  async _dispatchWithRetry(fn, maxRetries = 3) {
    let lastErr;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await fn();
        return; // success — stop retrying
      } catch (err) {
        lastErr = err;
        // Wait before retrying (exponential backoff: 200ms, 400ms, 600ms …)
        await new Promise(resolve => setTimeout(resolve, 200 * attempt));
      }
    }
    console.error('[NotificationService] dispatch failed after retries:', lastErr);
  }

  /**
   * Check whether an identical notification has already been dispatched
   * within the last 60 seconds. Also evicts expired entries on each call.
   *
   * @param {string} actorId
   * @param {string} recipientId
   * @param {string} type          - 'LIKE' | 'COMMENT' | 'REPLY'
   * @param {string} referenceId   - postId for LIKE, commentId for COMMENT/REPLY
   * @returns {boolean} true if duplicate (should skip), false if new (proceed)
   */
  _isDuplicate(actorId, recipientId, type, referenceId) {
    const now = Date.now();

    // Evict all expired entries to keep cache memory-bounded
    for (const [key, expiry] of this._dedupCache.entries()) {
      if (expiry <= now) {
        this._dedupCache.delete(key);
      }
    }

    const key = `${actorId}:${recipientId}:${type}:${referenceId}`;

    if (this._dedupCache.has(key) && this._dedupCache.get(key) > now) {
      return true; // duplicate within window
    }

    // Register as seen for the next 60 seconds
    this._dedupCache.set(key, now + 60_000);
    return false;
  }

  // ─── Public dispatch methods ─────────────────────────────────────────────────

  /**
   * Dispatch a LIKE notification.
   * Skipped silently when an identical notification was sent within 60 s.
   *
   * @param {string} actorId     - ID of the user who performed the like
   * @param {string} postId      - ID of the liked post
   * @param {string} recipientId - ID of the post owner
   */
  async dispatchLikeNotification(actorId, postId, recipientId) {
    if (this._isDuplicate(actorId, recipientId, 'LIKE', postId)) {
      return;
    }

    await this._dispatchWithRetry(async () => {
      // TODO: replace with actual notification persistence / socket / push
      console.log('[Notification] LIKE:', { actorId, postId, recipientId });
    });
  }

  /**
   * Dispatch a COMMENT notification.
   * Skipped silently when an identical notification was sent within 60 s.
   *
   * @param {string} actorId     - ID of the user who wrote the comment
   * @param {string} postId      - ID of the post that was commented on
   * @param {string} commentId   - ID of the newly created comment
   * @param {string} recipientId - ID of the post owner
   */
  async dispatchCommentNotification(actorId, postId, commentId, recipientId) {
    if (this._isDuplicate(actorId, recipientId, 'COMMENT', commentId)) {
      return;
    }

    await this._dispatchWithRetry(async () => {
      // TODO: replace with actual notification persistence / socket / push
      console.log('[Notification] COMMENT:', { actorId, postId, commentId, recipientId });
    });
  }

  /**
   * Dispatch a REPLY notification to the parent comment's owner.
   * Skipped silently when an identical notification was sent within 60 s.
   *
   * @param {string} actorId     - ID of the user who wrote the reply
   * @param {string} postId      - ID of the post the comment belongs to
   * @param {string} commentId   - ID of the reply comment
   * @param {string} recipientId - ID of the parent comment's owner
   */
  async dispatchReplyNotification(actorId, postId, commentId, recipientId) {
    if (this._isDuplicate(actorId, recipientId, 'REPLY', commentId)) {
      return;
    }

    await this._dispatchWithRetry(async () => {
      // TODO: replace with actual notification persistence / socket / push
      console.log('[Notification] REPLY:', { actorId, postId, commentId, recipientId });
    });
  }
}

module.exports = new NotificationService();
