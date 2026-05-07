const DbManager = require('../../config/dbManager');
const state = require('./socket.state');
const { sendAck, formatMessage, validatePayload } = require('./socket.utils');

/**
 * Core Chat Handlers: Messaging, Delivery Status, Read Receipts
 */
module.exports = (io, socket) => {
  const { id: userId, tenantId } = socket.user;

  // --- SEND MESSAGE ---
  socket.on('send_message', async (payload, callback) => {
    try {
      const validation = validatePayload(payload, ['conversationId', 'content']);
      if (!validation.valid) return sendAck(callback, false, null, validation.error, 'INVALID_PAYLOAD');

      const { conversationId, content, type = 'text', metadata = {} } = payload;
      const tenantDb = await DbManager.getTenantDb(tenantId);

      // 1. Check if conversation exists and user is participant
      const [participants] = await tenantDb.execute(
        'SELECT user_id FROM participants WHERE conversation_id = ?',
        [conversationId]
      );

      const isParticipant = participants.some(p => p.user_id === userId);
      if (!isParticipant) return sendAck(callback, false, null, 'Not a participant', 'FORBIDDEN');

      // 2. Save Message to Database
      const [result] = await tenantDb.execute(
        `INSERT INTO messages (conversation_id, sender_id, type, content, status, created_at) 
         VALUES (?, ?, ?, ?, 'sent', NOW())`,
        [conversationId, userId, type, content]
      );

      const savedMessage = formatMessage({
        id: result.insertId,
        conversation_id: conversationId,
        sender_id: userId,
        content,
        type,
        metadata,
        status: 'sent'
      });

      // 3. Update conversation last_message_at
      await tenantDb.execute(
        'UPDATE conversations SET last_message_at = NOW() WHERE id = ?',
        [conversationId]
      );

      // 4. Real-time Delivery & Unread Updates
      for (const p of participants) {
        if (p.user_id !== userId) {
          const targetSockets = state.getSocketsByUserId(p.user_id);
          
          // Get unread count for this specific conversation for the recipient
          const [unread] = await tenantDb.execute(
            "SELECT COUNT(*) as count FROM messages WHERE conversation_id = ? AND sender_id != ? AND status != 'read'",
            [conversationId, p.user_id]
          );

          targetSockets.forEach(sid => {
            io.to(sid).emit('new_message', savedMessage);
            io.to(sid).emit('unread_update', { 
              conversationId, 
              unreadCount: unread[0].count 
            });
          });
        }
      }

      // 5. Success Acknowledgement
      sendAck(callback, true, savedMessage);

    } catch (err) {
      console.error('Chat Error (send_message):', err);
      sendAck(callback, false, null, 'Internal server error', 'INTERNAL_ERROR');
    }
  });

  // --- MESSAGE DELIVERED ---
  socket.on('message_delivered', async (payload) => {
    const { messageId, conversationId } = payload;
    if (!messageId) return;

    try {
      const tenantDb = await DbManager.getTenantDb(tenantId);
      await tenantDb.execute(
        "UPDATE messages SET status = 'delivered' WHERE id = ? AND status = 'sent'",
        [messageId]
      );

      // Notify sender
      const [msg] = await tenantDb.execute('SELECT sender_id FROM messages WHERE id = ?', [messageId]);
      if (msg.length > 0) {
        const senderSockets = state.getSocketsByUserId(msg[0].sender_id);
        senderSockets.forEach(sid => {
          io.to(sid).emit('message_status_update', { messageId, status: 'delivered', conversationId });
        });
      }
    } catch (e) { console.error('Delivered status error:', e); }
  });

  // --- MESSAGE READ ---
  socket.on('message_read', async (payload) => {
    const { conversationId } = payload;
    if (!conversationId) return;

    try {
      const tenantDb = await DbManager.getTenantDb(tenantId);
      
      // Update all messages in conversation to 'read'
      await tenantDb.execute(
        "UPDATE messages SET status = 'read' WHERE conversation_id = ? AND sender_id != ? AND status != 'read'",
        [conversationId, userId]
      );

      // Notify participants
      const [participants] = await tenantDb.execute(
        'SELECT user_id FROM participants WHERE conversation_id = ?',
        [conversationId]
      );

      participants.forEach(p => {
        if (p.user_id !== userId) {
          state.getSocketsByUserId(p.user_id).forEach(sid => {
            io.to(sid).emit('conversation_read', { conversationId, readerId: userId });
            io.to(sid).emit('unread_update', { conversationId, unreadCount: 0 });
          });
        }
      });
    } catch (e) { console.error('Read receipt error:', e); }
  });
};
