const mysql = require('mysql2/promise');
const masterDb = require('../config/db');

class DbManager {
  constructor() {
    this.pools = new Map();
  }

  /**
   * Get a database connection pool for a specific tenant
   * @param {number} tenantId 
   */
  async getTenantDb(tenantId) {
    if (this.pools.has(tenantId)) {
      return this.pools.get(tenantId);
    }

    // Fetch tenant DB config from Master DB
    const { rows } = await masterDb.query(
      'SELECT db_config FROM tenants WHERE id = ?',
      [tenantId]
    );

    if (rows.length === 0 || !rows[0].db_config) {
      throw new Error(`No DB configuration found for tenant ${tenantId}`);
    }

    const config = typeof rows[0].db_config === 'string' 
      ? JSON.parse(rows[0].db_config) 
      : rows[0].db_config;

    // Create a new pool for the tenant
    const pool = mysql.createPool({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection and initialize tables if needed
    try {
      const connection = await pool.getConnection();
      console.log(`Connected to Tenant ${tenantId} Database: ${config.database}`);
      
      // Auto-initialize tables in Client's DB
      await this.initializeClientTables(connection);
      
      connection.release();
    } catch (err) {
      console.error(`Failed to connect to Tenant ${tenantId} DB:`, err.message);
      throw err;
    }

    this.pools.set(tenantId, pool);
    return pool;
  }

  async initializeClientTables(connection) {
    const tables = [
      `CREATE TABLE IF NOT EXISTS tenant_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        external_user_id VARCHAR(255) NOT NULL,
        is_online BOOLEAN DEFAULT FALSE,
        last_seen TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(external_user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) DEFAULT 'one-to-one',
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS participants (
        conversation_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (conversation_id, user_id),
        INDEX idx_participants_user (user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        sender_id INT NULL,
        type VARCHAR(50) DEFAULT 'text',
        text TEXT,
        media_url VARCHAR(1024),
        status VARCHAR(50) DEFAULT 'sent',
        is_deleted BOOLEAN DEFAULT FALSE,
        is_edited BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_messages_conversation (conversation_id)
      )`,
      `CREATE TABLE IF NOT EXISTS call_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        caller_id INT NOT NULL,
        receiver_id INT NOT NULL,
        type VARCHAR(50) DEFAULT 'audio',
        status VARCHAR(50) DEFAULT 'initiated',
        started_at TIMESTAMP NULL,
        ended_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of tables) {
      await connection.execute(sql);
    }
  }
}

module.exports = new DbManager();
