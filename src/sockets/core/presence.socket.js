const state = require('./socket.state');
const DbManager = require('../../config/dbManager');

/**
 * Typing Indicators and Presence Handlers
 */
module.exports = (io, socket) => {
  const { id: userId, tenantId } = socket.user;

  // --- TYPING START ---
  socket.on('typing_start', async (payload) => {
    const { conversationId } = payload;
    if (!conversationId) return;

    state.setTyping(conversationId, userId);

    // Notify others in room
    const tenantDb = await DbManager.getTenantDb(tenantId);
    const [participants] = await tenantDb.execute(
      'SELECT user_id FROM participants WHERE conversation_id = ?',
      [conversationId]
    );

    participants.forEach(p => {
      if (p.user_id !== userId) {
        state.getSocketsByUserId(p.user_id).forEach(sid => {
          io.to(sid).emit('user_typing', { conversationId, userId, isTyping: true });
        });
      }
    });

    // Auto-expire typing status after 5 seconds to prevent stuck state
    setTimeout(() => {
      state.removeTyping(conversationId, userId);
    }, 5000);
  });

  // --- TYPING STOP ---
  socket.on('typing_stop', async (payload) => {
    const { conversationId } = payload;
    if (!conversationId) return;

    state.removeTyping(conversationId, userId);
    
    // Notify others
    const tenantDb = await DbManager.getTenantDb(tenantId);
    const [participants] = await tenantDb.execute(
      'SELECT user_id FROM participants WHERE conversation_id = ?',
      [conversationId]
    );

    participants.forEach(p => {
      if (p.user_id !== userId) {
        state.getSocketsByUserId(p.user_id).forEach(sid => {
          io.to(sid).emit('user_typing', { conversationId, userId, isTyping: false });
        });
      }
    });
  });

  // --- GET PRESENCE ---
  socket.on('get_user_presence', (payload, callback) => {
    const { targetUserId } = payload;
    const isOnline = state.isUserOnline(targetUserId);
    const data = state.presence.get(targetUserId) || { status: 'offline', lastSeen: null };
    
    if (typeof callback === 'function') {
      callback({ success: true, isOnline, ...data });
    }
  });
};
