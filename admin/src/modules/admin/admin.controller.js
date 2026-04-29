const db = require('../../config/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

exports.createTenant = async (req, res, next) => {
  try {
    const { name, plan_id, db_config } = req.body;
    
    const app_id = `app_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
    const public_key = `pk_${crypto.randomBytes(16).toString('hex')}`;
    const secret_key = `sk_${crypto.randomBytes(32).toString('hex')}`;

    // db_config should be { host, user, password, database, port }
    const dbConfigJson = db_config ? JSON.stringify(db_config) : null;

    const [insertResult] = await db.execute(
      `INSERT INTO tenants (name, app_id, public_key, secret_key, plan_id, status, db_config)
       VALUES (?, ?, ?, ?, ?, 'active', ?)`,
      [name, app_id, public_key, secret_key, plan_id || null, dbConfigJson]
    );

    res.status(201).json({ 
      success: true, 
      tenant: { id: insertResult.insertId, name, app_id, public_key, secret_key, db_config } 
    });
  } catch (error) {
    next(error);
  }
};

exports.getTenants = async (req, res, next) => {
  try {
    const result = await db.query(`SELECT id, name, app_id, public_key, status, created_at FROM tenants ORDER BY created_at DESC`);
    res.status(200).json({ success: true, tenants: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.updateTenantStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // active, suspended

    await db.execute(`UPDATE tenants SET status = ? WHERE id = ?`, [status, id]);
    res.status(200).json({ success: true, message: 'Tenant status updated' });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    // Highly optimized queries for admin dashboard
    const tenantsCount = await db.query(`SELECT COUNT(*) FROM tenants`);
    const activeUsersCount = await db.query(`SELECT COUNT(*) FROM tenant_users WHERE is_online = true`);
    const totalMessages = await db.query(`SELECT COUNT(*) FROM messages`);
    const totalCalls = await db.query(`SELECT COUNT(*) FROM call_sessions`);

    res.status(200).json({
      success: true,
      stats: {
        total_clients: parseInt(tenantsCount.rows[0]['COUNT(*)']),
        active_users: parseInt(activeUsersCount.rows[0]['COUNT(*)']),
        total_messages: parseInt(totalMessages.rows[0]['COUNT(*)']),
        total_calls: parseInt(totalCalls.rows[0]['COUNT(*)'])
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getLogs = async (req, res, next) => {
  try {
    // 1. Fetch recent logs
    const logsResult = await db.query(`
      SELECT l.*, t.name as tenant_name 
      FROM system_logs l 
      LEFT JOIN tenants t ON l.tenant_id = t.id 
      ORDER BY l.created_at DESC 
      LIMIT 100
    `);

    // 2. Fetch daily stats
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_today,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors_today,
        SUM(CASE WHEN event_type LIKE 'Webhook%' AND status = 'success' THEN 1 ELSE 0 END) as webhooks_success,
        SUM(CASE WHEN event_type LIKE 'Webhook%' THEN 1 ELSE 0 END) as webhooks_total
      FROM system_logs 
      WHERE created_at >= CURDATE()
    `);

    const stats = statsResult.rows[0];
    const total = parseInt(stats.total_today) || 0;
    const errors = parseInt(stats.errors_today) || 0;
    const errorRate = total > 0 ? ((errors / total) * 100).toFixed(2) : '0.00';
    
    const wTotal = parseInt(stats.webhooks_total) || 0;
    const wSuccess = parseInt(stats.webhooks_success) || 0;
    const webhookRate = wTotal > 0 ? ((wSuccess / wTotal) * 100).toFixed(1) : '100.0';

    res.status(200).json({ 
      success: true, 
      logs: logsResult.rows,
      stats: {
        total_events: total,
        webhook_health: webhookRate + '%',
        error_rate: errorRate + '%'
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getHealth = async (req, res, next) => {
  try {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    res.status(200).json({
      success: true,
      health: {
        uptime: Math.floor(uptime),
        memory: (memory.rss / 1024 / 1024).toFixed(2) + ' MB',
        db_status: 'online',
        redis_status: 'offline'
      }
    });
  } catch (error) {
    next(error);
  }
};
