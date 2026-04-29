const mysql = require('mysql2/promise');
require('dotenv').config({ override: true });

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'u308350891_saas',
  password: 'Meet@081105',
  database: 'u308350891_saas',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  namedPlaceholders: false
});

module.exports = {
  // Wrapper to make it backwards compatible with some existing code
  query: async (text, params) => {
    // In postgres, $1, $2 were used. 
    // We already need to replace those in controllers, but this ensures we return the format expected.
    const [rows, fields] = await pool.query(text, params);
    return { rows, fields };
  },
  execute: async (text, params) => {
    const [result] = await pool.execute(text, params);
    return result;
  },
  getConnection: () => pool.getConnection(),
  getClient: () => pool.getConnection(), // For compatibility with the 'pg' syntax
  pool
};
