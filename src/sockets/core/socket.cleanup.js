const state = require('./socket.state');
const DbManager = require('../../config/dbManager');

/**
 * Background Cleanup Service
 * Prevents memory leaks and "zombie" states by cleaning up stale calls and sessions.
 */

const STALE_CALL_TIMEOUT = 1000 * 60 * 10; // 10 minutes safety timeout

module.exports = () => {
  // Run cleanup every 1 minute
  setInterval(async () => {
    const now = Date.now();

    for (const [callId, session] of state.activeCalls) {
      // 1. Clean up "hanging" ringing calls (no response after 60s)
      if (session.status === 'ringing' && (now - session.createdAt > 60000)) {
        console.log(`[Cleanup] Ending stale ringing call: ${callId}`);
        await endStaleCall(callId, 'missed');
      }

      // 2. Safety check for extreme cases (zombie calls)
      if (now - session.createdAt > STALE_CALL_TIMEOUT) {
        console.log(`[Cleanup] Force ending zombie call: ${callId}`);
        await endStaleCall(callId, 'failed');
      }
    }

    // 3. Cleanup stale typing states
    for (const [convId, typers] of state.typingStates) {
      if (typers.size === 0) state.typingStates.delete(convId);
    }
  }, 60000);
};

async function endStaleCall(callId, status) {
  const session = state.activeCalls.get(callId);
  if (!session) return;

  try {
    // We need a dummy DB object or a way to get the correct tenantDb
    // For simplicity in this demo, we assume the cleanup task can resolve the tenant
    // In production, session should store tenantId
  } catch (err) {
    console.error(`[Cleanup] Error ending call ${callId}:`, err);
  } finally {
    state.activeCalls.delete(callId);
    state.busyUsers.delete(session.callerId);
    state.busyUsers.delete(session.receiverId);
  }
}
