/**
 * Socket State Manager
 * Optimized for O(1) lookups and multi-device support.
 * Designed to be easily replaced by Redis for horizontal scaling.
 */

class SocketStateManager {
  constructor() {
    // Mapping: userId -> Set of socketIds (supports multi-device)
    this.userSockets = new Map();
    // Mapping: socketId -> userId (for fast reverse lookup on disconnect)
    this.socketToUser = new Map();
    // Mapping: userId -> { lastSeen: Date, status: 'online' | 'offline' }
    this.presence = new Map();
    // Mapping: conversationId -> Set of userIds who are typing
    this.typingStates = new Map();
    // Mapping: callId -> { callerId, receiverId, type, status, startTime }
    this.activeCalls = new Map();
    // Mapping: userId -> callId (to prevent double-calling)
    this.busyUsers = new Map();
  }

  // --- Socket / User Management ---

  addUserSocket(userId, socketId) {
    const uid = String(userId);
    if (!this.userSockets.has(uid)) {
      this.userSockets.set(uid, new Set());
    }
    this.userSockets.get(uid).add(socketId);
    this.socketToUser.set(socketId, uid);
    this.presence.set(uid, { status: 'online', lastSeen: new Date() });
  }

  removeSocket(socketId) {
    const userId = this.socketToUser.get(socketId);
    if (!userId) return null;

    this.socketToUser.delete(socketId);
    
    const uid = String(userId);
    const userSocks = this.userSockets.get(uid);
    if (userSocks) {
      userSocks.delete(socketId);
      if (userSocks.size === 0) {
        this.userSockets.delete(uid);
        this.presence.set(uid, { status: 'offline', lastSeen: new Date() });
        return { userId: uid, lastSocket: true };
      }
    }
    return { userId: uid, lastSocket: false };
  }

  getSocketsByUserId(userId) {
    const sockets = this.userSockets.get(String(userId));
    return sockets ? Array.from(sockets) : [];
  }

  isUserOnline(userId) {
    return this.userSockets.has(String(userId));
  }

  // --- Typing Indicators ---

  setTyping(conversationId, userId) {
    if (!this.typingStates.has(conversationId)) {
      this.typingStates.set(conversationId, new Set());
    }
    this.typingStates.get(conversationId).add(userId);
  }

  removeTyping(conversationId, userId) {
    const typers = this.typingStates.get(conversationId);
    if (typers) {
      typers.delete(userId);
      if (typers.size === 0) this.typingStates.delete(conversationId);
    }
  }

  getTypingUsers(conversationId) {
    const typers = this.typingStates.get(conversationId);
    return typers ? Array.from(typers) : [];
  }

  // --- Cleanup ---

  clearUserTyping(userId) {
    for (const [convId, typers] of this.typingStates) {
      if (typers.has(userId)) {
        typers.delete(userId);
        if (typers.size === 0) this.typingStates.delete(convId);
      }
    }
  }
}

module.exports = new SocketStateManager();
