const { sendAck } = require('./socket.utils');

/**
 * Lightweight per-event Rate Limiter
 * O(1) in-memory tracking.
 */

const limits = new Map(); // userId:event -> { count, startTime }

module.exports = (socket, event, limit = 10, windowMs = 1000) => {
  const userId = socket.user?.id;
  if (!userId) return true;

  const key = `${userId}:${event}`;
  const now = Date.now();
  const state = limits.get(key) || { count: 0, startTime: now };

  if (now - state.startTime > windowMs) {
    state.count = 1;
    state.startTime = now;
    limits.set(key, state);
    return true;
  }

  state.count++;
  limits.set(key, state);

  if (state.count > limit) {
    console.warn(`Rate limit exceeded for user ${userId} on event ${event}`);
    return false;
  }

  return true;
};
