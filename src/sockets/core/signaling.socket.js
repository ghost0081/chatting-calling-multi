const state = require('./socket.state');

/**
 * WebRTC Signaling Handlers (SDP & ICE Exchange)
 * These forward heavy media handshakes between peers O(1).
 */
module.exports = (io, socket) => {
  const { id: userId } = socket.user;

  // --- SEND OFFER ---
  socket.on('call:offer', (payload) => {
    const { callId, offer } = payload;
    const session = state.activeCalls.get(callId);
    if (!session) return;

    const targetId = (userId === session.callerId) ? session.receiverId : session.callerId;
    state.getSocketsByUserId(targetId).forEach(sid => {
      io.to(sid).emit('call:offer', { callId, offer, senderId: userId });
    });
  });

  // --- SEND ANSWER ---
  socket.on('call:answer', (payload) => {
    const { callId, answer } = payload;
    const session = state.activeCalls.get(callId);
    if (!session) return;

    const targetId = (userId === session.callerId) ? session.receiverId : session.callerId;
    state.getSocketsByUserId(targetId).forEach(sid => {
      io.to(sid).emit('call:answer', { callId, answer, senderId: userId });
    });
  });

  // --- SEND ICE CANDIDATE ---
  socket.on('call:ice', (payload) => {
    const { callId, candidate } = payload;
    const session = state.activeCalls.get(callId);
    if (!session) return;

    const targetId = (userId === session.callerId) ? session.receiverId : session.callerId;
    state.getSocketsByUserId(targetId).forEach(sid => {
      io.to(sid).emit('call:ice', { callId, candidate, senderId: userId });
    });
  });
};
