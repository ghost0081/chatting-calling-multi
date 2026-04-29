const masterDb = require('../config/db');
const dbManager = require('../utils/dbManager');

exports.registerHandlers = (io, socket) => {
  // WebRTC Signaling through Socket.IO

  socket.on('call_initiate', async (data, callback) => {
    const { receiver_id, type } = data;
    const caller_id = socket.user.user_id;
    const tenant_id = socket.user.tenant_id;

    try {
      // Get Tenant's Dynamic Database
      const tenantDb = await dbManager.getTenantDb(tenant_id);

      // Create call session in DB
      const [insertResult] = await tenantDb.execute(
        `INSERT INTO call_sessions (caller_id, receiver_id, type, status, started_at)
         VALUES (?, ?, ?, 'initiated', NOW())`,
        [caller_id, receiver_id, type || 'audio']
      );

      const callSession = { id: insertResult.insertId, type: type || 'audio' };

      // Log activity to master DB
      await masterDb.execute(
        'INSERT INTO system_logs (tenant_id, event_type, details, status) VALUES (?, ?, ?, ?)',
        [tenant_id, 'Call Initiated', `${callSession.type} call from ${caller_id} to ${receiver_id}`, 'success']
      );

      // Notify receiver
      socket.to(`user:${receiver_id}`).emit('incoming_call', {
        call_id: callSession.id,
        caller_id,
        type: callSession.type,
      });

      if (callback) callback({ success: true, call_id: callSession.id });
    } catch (err) {
      console.error('Call initiate error:', err);
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('call_accept', async (data) => {
    const { call_id } = data;
    const { tenant_id } = socket.user;
    const tenantDb = await dbManager.getTenantDb(tenant_id);

    // Update DB status to 'ongoing'
    await tenantDb.execute(`UPDATE call_sessions SET status = 'ongoing' WHERE id = ?`, [call_id]);

    // Query caller_id
    const [rows] = await tenantDb.query(`SELECT caller_id FROM call_sessions WHERE id = ?`, [call_id]);
    if (rows.length > 0) {
      const caller_id = rows[0].caller_id;
      // Notify caller that call was accepted
      socket.to(`user:${caller_id}`).emit('call_accepted', { call_id });
    }
  });

  socket.on('call_reject', async (data) => {
    const { call_id } = data;
    const { tenant_id } = socket.user;
    const tenantDb = await dbManager.getTenantDb(tenant_id);

    // Update DB status to 'rejected'
    await tenantDb.execute(`UPDATE call_sessions SET status = 'rejected', ended_at = NOW() WHERE id = ?`, [call_id]);

    const [rows] = await tenantDb.query(`SELECT caller_id FROM call_sessions WHERE id = ?`, [call_id]);
    if (rows.length > 0) {
      socket.to(`user:${rows[0].caller_id}`).emit('call_rejected', { call_id });
    }
  });

  socket.on('call_end', async (data) => {
    const { call_id } = data;
    const { tenant_id } = socket.user;
    const tenantDb = await dbManager.getTenantDb(tenant_id);

    await tenantDb.execute(`UPDATE call_sessions SET status = 'completed', ended_at = NOW() WHERE id = ?`, [call_id]);
  });

  // WebRTC ICE candidates and Offer/Answer exchange
  socket.on('webrtc_offer', (data) => {
    const { target_user_id, offer, call_id } = data;
    socket.to(`user:${target_user_id}`).emit('webrtc_offer_receive', {
      caller_id: socket.user.user_id,
      offer,
      call_id
    });
  });

  socket.on('webrtc_answer', (data) => {
    const { target_user_id, answer, call_id } = data;
    socket.to(`user:${target_user_id}`).emit('webrtc_answer_receive', {
      receiver_id: socket.user.user_id,
      answer,
      call_id
    });
  });

  socket.on('ice_candidate', (data) => {
    const { target_user_id, candidate, call_id } = data;
    socket.to(`user:${target_user_id}`).emit('ice_candidate_receive', {
      sender_id: socket.user.user_id,
      candidate,
      call_id
    });
  });
};
