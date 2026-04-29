const db = require('../config/db');
// Redis removed

exports.registerHandlers = (io, socket) => {
  // Join a specific conversation room
  socket.on('join_conversation', (data) => {
    const { conversation_id } = data;
    if (conversation_id) {
      socket.join(`conversation:${conversation_id}`);
    }
  });

  socket.on('send_message', async (data, callback) => {
    try {
      const { conversation_id, text, type, media_url } = data;
      const { tenant_id, user_id } = socket.user;

      // 1. Get Tenant's Dynamic Database
      const dbManager = require('../utils/dbManager');
      const tenantDb = await dbManager.getTenantDb(tenant_id);

      // 2. Save to database
      const [insertResult] = await tenantDb.execute(
        `INSERT INTO messages (conversation_id, sender_id, type, text, media_url, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [conversation_id, user_id, type || 'text', text, media_url || null]
      );
      
      // 3. Log activity to master DB
      await db.execute(
        'INSERT INTO system_logs (tenant_id, event_type, details, status) VALUES (?, ?, ?, ?)',
        [tenant_id, 'Message Sent', `Message ID: ${insertResult.insertId}`, 'success']
      );
      
      const savedMessage = {
        id: insertResult.insertId,
        tenant_id, // keep for the broadcast payload
        conversation_id,
        sender_id: user_id,
        type: type || 'text',
        text,
        media_url,
        created_at: new Date()
      };

      // Update conversation last_message_at
      await tenantDb.execute(
        `UPDATE conversations SET last_message_at = NOW() WHERE id = ?`,
        [conversation_id]
      );

      // 2. Broadcast to conversation room (excluding sender)
      socket.to(`conversation:${conversation_id}`).emit('receive_message', savedMessage);
      
      // Update analytics in Redis (debounce write to DB)
      // await redisClient.hincrby(`usage:${tenant_id}:${current_month}`, 'messages_count', 1);

      if (callback) callback({ success: true, message: savedMessage });
    } catch (err) {
      console.error('Send message error:', err);
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('typing', (data) => {
    const { conversation_id, is_typing } = data;
    socket.to(`conversation:${conversation_id}`).emit('user_typing', {
      user_id: socket.user.user_id,
      is_typing
    });
  });

  socket.on('message_seen', async (data) => {
    const { message_ids, conversation_id } = data;
    // Update DB to seen
    // Broadcast seen status
    socket.to(`conversation:${conversation_id}`).emit('messages_status_update', {
      message_ids,
      status: 'seen'
    });
  });
};
