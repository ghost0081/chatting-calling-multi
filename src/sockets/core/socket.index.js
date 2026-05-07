const socketRouter = require('./socket.router');
const socketCleanup = require('./socket.cleanup');

/**
 * Socket Engine Initialization
 * High scalability, multi-device sync, and clean architecture.
 */

module.exports = (io) => {
  // Initialize routes and handlers
  socketRouter(io);

  // Start background cleanup tasks
  socketCleanup();

  console.log('🚀 Production Socket Engine initialized.');
};
