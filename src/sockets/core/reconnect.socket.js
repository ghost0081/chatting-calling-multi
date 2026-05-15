const state = require('./socket.state');

/**
 * Reconnect Management Logic
 * Handles temporary network drops during active calls.
 */

const RECONNECT_GRACE_PERIOD = 15000; // 15 seconds

exports.handleMidCallDisconnect = (io, socket) => {
  const { id: userId } = socket.user;
  const callId = state.busyUsers.get(String(userId));

  if (!callId) return;

  const session = state.activeCalls.get(callId);
  if (!session || session.status !== 'ongoing') return;

  console.log(`[Reconnect] User ${userId} disconnected mid-call. Starting grace period.`);

  // 1. Notify Partner
  const partnerId = (String(userId) === String(session.callerId)) ? session.receiverId : session.callerId;
  const partnerSockets = state.getSocketsByUserId(partnerId);
  
  partnerSockets.forEach(sid => {
    io.to(sid).emit('call:partner_disconnected', { 
      callId, 
      partnerId: userId,
      gracePeriodMs: RECONNECT_GRACE_PERIOD 
    });
  });

  // 2. Start Grace Timer
  const timer = setTimeout(async () => {
    // If still disconnected after grace period, end the call
    if (!state.isUserOnline(userId)) {
      console.log(`[Reconnect] Grace period expired for ${userId}. Terminating call.`);
      
      // We trigger a programmatic end_call
      // This will be handled by the cleanup service
    }
  }, RECONNECT_GRACE_PERIOD);

  state.reconnectSessions.set(userId, { callId, timer });
};

exports.handleReconnectSync = (io, socket) => {
  const { id: userId } = socket.user;
  const reconSession = state.reconnectSessions.get(userId);

  if (reconSession) {
    console.log(`[Reconnect] User ${userId} returned. Syncing call state.`);
    clearTimeout(reconSession.timer);
    state.reconnectSessions.delete(userId);

    const session = state.activeCalls.get(reconSession.callId);
    if (session) {
      // 1. Notify Partner
      const partnerId = (String(userId) === String(session.callerId)) ? session.receiverId : session.callerId;
      state.getSocketsByUserId(partnerId).forEach(sid => {
        io.to(sid).emit('call:partner_reconnected', { callId: reconSession.callId, partnerId: userId });
      });

      // 2. Send current state to reconnected user
      socket.emit('call:sync', { 
        callId: reconSession.callId, 
        status: session.status,
        startTime: session.startTime,
        partnerId
      });
    }
  }
};
