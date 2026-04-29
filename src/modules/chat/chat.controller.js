const db = require('../../config/db');
const DbManager = require('../../config/dbManager');

exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { appId } = req.query;

    const tenantResult = await db.query('SELECT * FROM tenants WHERE app_id = ?', [appId]);
    const tenant = tenantResult.rows[0];
    if (!tenant) return res.status(404).json({ success: false, message: 'App not found' });

    const tenantDb = await DbManager.getTenantDb(tenant.id);

    const messages = await tenantDb.execute(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 50',
      [conversationId]
    );

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { appId } = req.query;

    const tenantResult = await db.query('SELECT * FROM tenants WHERE app_id = ?', [appId]);
    const tenant = tenantResult.rows[0];
    if (!tenant) return res.status(404).json({ success: false, message: 'App not found' });

    const tenantDb = await DbManager.getTenantDb(tenant.id);

    const conversations = await tenantDb.execute(
      `SELECT c.* FROM conversations c
       JOIN participants p ON c.id = p.conversation_id
       WHERE p.user_id = ?
       ORDER BY c.last_message_at DESC`,
      [userId]
    );

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};
