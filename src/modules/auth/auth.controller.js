const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const bcrypt = require('bcrypt');

exports.generateUserToken = async (req, res, next) => {
  try {
    const { app_id, public_key, secret_key } = req.clientAuth;
    const { external_user_id } = req.body;

    if (!external_user_id) {
      return res.status(400).json({ success: false, message: 'external_user_id is required' });
    }

    // 1. Verify tenant credentials
    const tenantResult = await db.query(
      `SELECT id, status FROM tenants WHERE app_id = ? AND public_key = ? AND secret_key = ?`,
      [app_id, public_key, secret_key]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid API credentials' });
    }

    const tenant = tenantResult.rows[0];
    if (tenant.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Tenant is not active' });
    }

    // 2. Get Tenant's Dynamic Database Connection
    const dbManager = require('../../config/dbManager');
    const tenantDb = await dbManager.getTenantDb(tenant.id);

    // 3. Find or create user in the client's own database
    let [users] = await tenantDb.query(
      `SELECT id FROM tenant_users WHERE external_user_id = ?`,
      [external_user_id]
    );

    let userId;
    if (users.length === 0) {
      const [insertResult] = await tenantDb.execute(
        `INSERT INTO tenant_users (external_user_id) VALUES (?)`,
        [external_user_id]
      );
      userId = insertResult.insertId;
    } else {
      userId = users[0].id;
    }

    // 3. Generate JWT
    const token = jwt.sign(
      { tenant_id: tenant.id, user_id: userId, external_user_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user_id: userId
    });
  } catch (error) {
    next(error);
  }
};

exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Quick mock for setup - in production check DB
    // const result = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (email === 'admin@antigravity.com' && password === 'admin123') {
      const token = jwt.sign(
        { role: 'superadmin' },
        process.env.JWT_ADMIN_SECRET || 'supersecretjwtkey_for_admins',
        { expiresIn: '1d' }
      );
      return res.status(200).json({ success: true, token });
    }

    res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  } catch (error) {
    next(error);
  }
};
