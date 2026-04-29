const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const chatSocket = require('./chat');
const callSocket = require('./call');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Restrict this in production
      methods: ['GET', 'POST']
    }
  });

  // Redis Pub/Sub removed for single-server configuration
  // If you scale to multiple servers in the future, re-add the Redis adapter here.

  // Socket Authentication (Simple User ID + App ID)
  io.use(async (socket, next) => {
    const { userId, appId } = socket.handshake.auth;
    
    if (!userId || !appId) {
      return next(new Error('Authentication error: userId and appId are required'));
    }
    
    try {
      const db = require('../config/db');
      // Look up tenant by appId
      const tenantsResult = await db.query('SELECT id FROM tenants WHERE app_id = ?', [appId]);
      const tenants = tenantsResult.rows;
      
      if (!tenants || tenants.length === 0) {
        return next(new Error('Authentication error: Invalid appId'));
      }

      socket.user = { 
        user_id: userId, 
        tenant_id: tenants[0].id 
      };
      next();
    } catch (err) {
      console.error('Socket Auth Error:', err.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.user_id} (Tenant: ${socket.user.tenant_id})`);

    // Join Tenant Room
    socket.join(`tenant:${socket.user.tenant_id}`);
    
    // Join User Room
    socket.join(`user:${socket.user.user_id}`);

    // Update online status
    // TODO: Update DB tenant_users is_online = true

    // Register Chat Handlers
    chatSocket.registerHandlers(io, socket);

    // Register Call Handlers
    callSocket.registerHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.user_id}`);
      // TODO: Update DB tenant_users is_online = false, last_seen
    });
  });
};

const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};

module.exports = { initSocket, getIo };
