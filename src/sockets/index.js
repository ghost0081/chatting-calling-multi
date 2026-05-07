const { Server } = require('socket.io');
const db = require('../config/db');
const DbManager = require('../config/dbManager');
const state = require('./core/socket.state');
const socketEngine = require('./core/socket.index');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', 
      methods: ['GET', 'POST']
    }
  });

  // Socket Authentication & Sync (Moved back for visibility)
  io.use(async (socket, next) => {
    const { userId, appId, userType, username, avatarUrl } = socket.handshake.auth;
    
    if (!userId || !appId) {
      return next(new Error('Authentication error: userId and appId are required'));
    }
    
    try {
      // 1. Validate Tenant
      const tenantsResult = await db.query('SELECT id FROM tenants WHERE app_id = ?', [appId]);
      const tenant = tenantsResult.rows[0];
      
      if (!tenant) return next(new Error('Authentication error: Invalid appId'));

      // 2. Sync User to Tenant Database
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

      // 3. Attach metadata to socket session
      socket.user = {
        id: userId,
        tenantId: tenant.id,
        appId: appId,
        type: userType || 'user'
      };

      // 4. Register in memory state
      state.addUserSocket(userId, socket.id);

      next();
    } catch (err) {
      console.error('Socket Auth Error:', err.message);
      next(new Error('Authentication error'));
    }
  });

  // Initialize the rest of the production-grade engine (Routing, Handlers, Cleanup)
  socketEngine(io);
};

const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};

module.exports = { initSocket, getIo };


