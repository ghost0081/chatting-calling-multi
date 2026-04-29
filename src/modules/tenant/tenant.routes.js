const express = require('express');
const router = express.Router();
const tenantController = require('./tenant.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.use(verifyToken);

// Conversation management
router.post('/conversations', tenantController.createConversation);
router.get('/conversations', tenantController.getConversations);

// Messages
router.get('/conversations/:conversation_id/messages', tenantController.getMessages);

// Users status
router.get('/users/:external_user_id/status', tenantController.getUserStatus);

module.exports = router;
