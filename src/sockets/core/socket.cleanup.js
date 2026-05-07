const state = require('./socket.state');

/**
 * Periodically cleans up stale in-memory states to prevent memory leaks.
 */

module.exports = () => {
  setInterval(() => {
    const now = Date.now();
    // 1. Cleanup typing states (any typing > 10s is likely abandoned)
    for (const [convId, typers] of state.typingStates) {
      if (typers.size === 0) state.typingStates.delete(convId);
    }

    // 2. Logging health metrics
    // console.log(`[SocketCleanup] Active users: ${state.userSockets.size}, Total connections: ${state.socketToUser.size}`);
  }, 60000); // Every 1 minute
};
