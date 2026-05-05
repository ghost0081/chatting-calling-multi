const mysql = require('mysql2/promise');
const db = require('./db');

class DbManager {
  constructor() {
    this.pools = new Map();
  }

  async getTenantDb(tenantId) {
    if (this.pools.has(tenantId)) {
      return this.pools.get(tenantId);
    }

    try {
      // 1. Get tenant db config from master DB
      const result = await db.query('SELECT db_config FROM tenants WHERE id = ?', [tenantId]);
      const tenants = result.rows;
      
      if (!tenants || tenants.length === 0 || !tenants[0].db_config) {
        throw new Error(`Tenant ${tenantId} has no DB configuration`);
      }

      const config = typeof tenants[0].db_config === 'string' 
        ? JSON.parse(tenants[0].db_config) 
        : tenants[0].db_config;

      // 2. Create new pool for this tenant
      const host = config.host || '127.0.0.1';
      const pool = mysql.createPool({
        host: host === 'localhost' ? '127.0.0.1' : host,
        port: config.port || 3306,
        user: config.user,
        password: config.password,
        database: config.database,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0
      });

      this.pools.set(tenantId, pool);
      return pool;
    } catch (error) {
      console.error(`Failed to connect to tenant ${tenantId} database:`, error.message);
      throw error;
    }
  }
}

module.exports = new DbManager();
