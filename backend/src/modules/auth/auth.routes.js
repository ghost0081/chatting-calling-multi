const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { verifyClientKeys } = require('../../middlewares/auth.middleware');

// Endpoint for client backends to generate a JWT for their users
router.post('/token', verifyClientKeys, authController.generateUserToken);

// Admin login
router.post('/admin/login', authController.adminLogin);

module.exports = router;
