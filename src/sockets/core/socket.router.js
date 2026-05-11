const auth = require('./auth.socket');
const chat = require('./chat.socket');
const call = require('./call.socket');
const signaling = require('./signaling.socket');
const presence = require('./presence.socket');
const rateLimit = require('./rateLimiter');
const { sendAck } = require('./socket.utils');

/**
 * Socket Event Router & Central Dispatch
 */

module.exports = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`[SocketEngine] User ${userId} connected. Total sockets: ${io.engine.clientsCount}`);

    // Standardized wrapper for rate limiting and error tracking
    const on = (event, limit, handler) => {
      socket.on(event, (payload, callback) => {
        if (!rateLimit(socket, event, limit)) {
          return sendAck(callback, false, null, 'Rate limit exceeded', 'RATE_LIMIT');
        }
        handler(payload, callback);
      });
    };

    // Load Modular Handlers
    chat(io, socket);
    presence(io, socket);
    call(io, socket);
    signaling(io, socket);

    // Backward compatibility for existing call handlers
    try {
      const callSocket = require('../call');
      if (callSocket && callSocket.registerHandlers) {
        callSocket.registerHandlers(io, socket);
      }
    } catch (e) {
      // callSocket not found or not needed
    }

    // Global Events
    socket.on('disconnect', () => {
      auth.handleDisconnect(io, socket);
      console.log(`[SocketEngine] User ${userId} disconnected.`);
    });
    
    // Explicit Ping/Pong for connection health
    socket.on('heartbeat', (cb) => {
      if (typeof cb === 'function') cb({ success: true, timestamp: Date.now() });
    });
  });
};
