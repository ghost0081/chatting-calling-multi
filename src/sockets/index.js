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

  // Socket Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { tenant_id, user_id, external_user_id }
      next();
    } catch (err) {
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
