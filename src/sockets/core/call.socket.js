const DbManager = require('../../config/dbManager');
const state = require('./socket.state');
const { sendAck } = require('./socket.utils');

/**
 * Production-Grade Calling Lifecycle: Start, Accept, Reject, End
 */
module.exports = (io, socket) => {
  const { id: userId, tenantId } = socket.user;

  // --- START CALL ---
  socket.on('call:start', async (payload, callback) => {
    const { receiverId, type = 'audio' } = payload;
    if (!receiverId) return sendAck(callback, false, null, 'receiverId required', 'INVALID_PAYLOAD');

    try {
      // 1. Check if caller is already busy
      if (state.busyUsers.has(userId)) {
        return sendAck(callback, false, null, 'You are already in a call', 'BUSY');
      }

      // 2. Check if receiver is online and not busy
      if (!state.isUserOnline(receiverId)) {
        return sendAck(callback, false, null, 'User is offline', 'OFFLINE');
      }
      if (state.busyUsers.has(receiverId)) {
        return sendAck(callback, false, null, 'User is busy', 'BUSY');
      }

      const tenantDb = await DbManager.getTenantDb(tenantId);

      // 3. Create Call Session in DB
      const [result] = await tenantDb.execute(
        `INSERT INTO call_sessions (caller_id, receiver_id, type, status) VALUES (?, ?, ?, 'initiated')`,
        [userId, receiverId, type]
      );
      const callId = result.insertId;

      // 4. Register in State Manager
      const session = { callId, callerId: userId, receiverId, type, status: 'ringing', startTime: null };
      state.activeCalls.set(callId, session);
      state.busyUsers.set(userId, callId);
      state.busyUsers.set(receiverId, callId);

      // 5. Notify Receiver (all their sockets)
      const targetSockets = state.getSocketsByUserId(receiverId);
      targetSockets.forEach(sid => {
        io.to(sid).emit('call:incoming', { callId, callerId: userId, type });
      });

      sendAck(callback, true, { callId });

      // 6. Timeout: If not answered in 45s, auto-cancel
      setTimeout(async () => {
        const current = state.activeCalls.get(callId);
        if (current && current.status === 'ringing') {
          await endCall(io, tenantDb, callId, 'missed');
        }
      }, 45000);

    } catch (err) {
      console.error('Call Start Error:', err);
      sendAck(callback, false, null, 'Internal Error', 'INTERNAL_ERROR');
    }
  });

  // --- ACCEPT CALL ---
  socket.on('call:accept', async (payload, callback) => {
    const { callId } = payload;
    const session = state.activeCalls.get(callId);
    if (!session || session.status !== 'ringing') return sendAck(callback, false, null, 'Call expired', 'EXPIRED');

    try {
      const tenantDb = await DbManager.getTenantDb(tenantId);
      session.status = 'ongoing';
      session.startTime = new Date();

      await tenantDb.execute(
        "UPDATE call_sessions SET status = 'ongoing', started_at = NOW() WHERE id = ?",
        [callId]
      );

      // Notify Caller
      const callerSockets = state.getSocketsByUserId(session.callerId);
      callerSockets.forEach(sid => {
        io.to(sid).emit('call:accepted', { callId, receiverId: userId });
      });

      sendAck(callback, true);
    } catch (err) { console.error('Call Accept Error:', err); }
  });

  // --- REJECT CALL ---
  socket.on('call:reject', async (payload) => {
    const { callId } = payload;
    const session = state.activeCalls.get(callId);
    if (session) {
      const tenantDb = await DbManager.getTenantDb(tenantId);
      await endCall(io, tenantDb, callId, 'rejected');
    }
  });

  // --- END CALL ---
  socket.on('call:end', async (payload) => {
    const { callId } = payload;
    const session = state.activeCalls.get(callId);
    if (session) {
      const tenantDb = await DbManager.getTenantDb(tenantId);
      await endCall(io, tenantDb, callId, 'completed');
    }
  });

  // --- HELPER: End Call Logic ---
  async function endCall(io, tenantDb, callId, status) {
    const session = state.activeCalls.get(callId);
    if (!session) return;

    // Calculate duration
    let duration = 0;
    if (session.startTime) {
      duration = Math.floor((new Date() - session.startTime) / 1000);
    }

    // 1. Update DB
    await tenantDb.execute(
      "UPDATE call_sessions SET status = ?, ended_at = NOW(), duration_seconds = ? WHERE id = ?",
      [status, duration, callId]
    );

    // 2. Clear State
    state.activeCalls.delete(callId);
    state.busyUsers.delete(session.callerId);
    state.busyUsers.delete(session.receiverId);

    // 3. Notify Both Parties
    [session.callerId, session.receiverId].forEach(uid => {
      state.getSocketsByUserId(uid).forEach(sid => {
        io.to(sid).emit('call:ended', { callId, status, duration });
      });
    });
  }
};
