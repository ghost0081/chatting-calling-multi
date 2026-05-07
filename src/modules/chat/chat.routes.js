const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');

router.get('/messages/:conversationId', chatController.getMessages);
router.post('/messages', chatController.sendMessage);
router.get('/conversations/:userId', chatController.getConversations);
router.post('/conversations/direct', chatController.getOrCreateConversation);
router.get('/contacts/:userId', chatController.getContacts);

module.exports = router;
