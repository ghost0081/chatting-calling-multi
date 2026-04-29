const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { verifyAdmin } = require('../../middlewares/auth.middleware');

router.use(verifyAdmin); // Protect all admin routes

router.post('/tenants', adminController.createTenant);
router.get('/tenants', adminController.getTenants);
router.put('/tenants/:id/status', adminController.updateTenantStatus);
router.get('/stats', adminController.getDashboardStats);
router.get('/logs', adminController.getLogs);
router.get('/health', adminController.getHealth);

module.exports = router;
