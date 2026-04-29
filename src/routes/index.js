const express = require('express');
const router = express.Router();

// Define specific routes
const authRoutes = require('../modules/auth/auth.routes');
const tenantRoutes = require('../modules/tenant/tenant.routes');
const adminRoutes = require('../modules/admin/admin.routes');

router.use('/auth', authRoutes);
router.use('/tenant', tenantRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
