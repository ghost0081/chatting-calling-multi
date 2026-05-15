const db = require('../../config/db');
const DbManager = require('../../config/dbManager');
const state = require('./socket.state');
const { sendAck } = require('./socket.utils');
const reconnect = require('./reconnect.socket');
const { getIo } = require('../index');

/**
 * Handles Socket Authentication and Session Initialization
 */
exports.handleAuth = async (socket, next) => {
  const { userId, appId, userType, token } = socket.handshake.auth;

  if (!userId || !appId) {
    return next(new Error('AUTHENTICATION_FAILED: userId and appId required'));
  }

  try {
    // 1. Validate Tenant
    const tenantsResult = await db.query('SELECT id FROM tenants WHERE app_id = ?', [appId]);
    const tenant = tenantsResult.rows[0];
    
    if (!tenant) {
      return next(new Error('INVALID_APP_ID'));
    }

    // 2. Attach metadata to socket session
    socket.user = {
      id: userId,
      tenantId: tenant.id,
      appId: appId,
      type: userType || 'user'
    };

    // 3. Sync User to Tenant Database (Multi-tenant requirement)
    const { username, avatarUrl } = socket.handshake.auth;
    const tenantDb = await DbManager.getTenantDb(tenant.id);
    await tenantDb.execute(
      `INSERT INTO tenant_users (user_id, username, avatar_url, user_type, is_online, last_seen) 
       VALUES (?, ?, ?, ?, true, NOW())
       ON DUPLICATE KEY UPDATE 
       username = VALUES(username), 
       avatar_url = VALUES(avatar_url),
       user_type = VALUES(user_type),
       is_online = true, 
       last_seen = NOW()`,
      [userId, username || 'Unknown', avatarUrl || null, userType || 'user']
    );

    // 4. Register in memory state
    state.addUserSocket(userId, socket.id);

    // 5. Check for mid-call reconnect
    reconnect.handleReconnectSync(getIo(), socket);

    next();
  } catch (err) {
    console.error('Socket Auth Error:', err);
    next(new Error('INTERNAL_SERVER_ERROR'));
  }
};

exports.handleDisconnect = (io, socket) => {
  const userId = socket.user?.id;
  if (!userId) return;

  // 1. Handle mid-call grace period
  reconnect.handleMidCallDisconnect(io, socket);

  const result = state.removeSocket(socket.id);
  
  if (result && result.lastSocket) {
    // Broadcast offline status only if last device disconnected
    socket.broadcast.emit('user_offline', { userId });
    
    // Clear typing states
    state.clearUserTyping(userId);
  }
};
