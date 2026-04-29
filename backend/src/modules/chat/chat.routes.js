const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');

// GET /api/v1/chat/messages/:conversationId?appId=...
router.get('/messages/:conversationId', chatController.getMessages);

// GET /api/v1/chat/conversations/:userId?appId=...
router.get('/conversations/:userId', chatController.getConversations);

module.exports = router;
