const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');

router.get('/messages/:conversationId', chatController.getMessages);
router.get('/conversations/:userId', chatController.getConversations);

module.exports = router;
