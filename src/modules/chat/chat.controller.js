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

    const [messages] = await tenantDb.execute(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 50',
      [conversationId]
    );

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { appId, conversationId, senderId, text, type, mediaUrl } = req.body;

    if (!appId || !conversationId || !senderId || !text) {
      return res.status(400).json({ success: false, message: 'Missing required fields: appId, conversationId, senderId, text' });
    }

    const tenantResult = await db.query('SELECT * FROM tenants WHERE app_id = ?', [appId]);
    const tenant = tenantResult.rows[0];
    if (!tenant) return res.status(404).json({ success: false, message: 'App not found' });

    const tenantDb = await DbManager.getTenantDb(tenant.id);

    // Save to database
    const [insertResult] = await tenantDb.execute(
      `INSERT INTO messages (conversation_id, sender_id, type, text, media_url, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [conversationId, senderId, type || 'text', text, mediaUrl || null]
    );

    // Update conversation last_message_at
    await tenantDb.execute(
      `UPDATE conversations SET last_message_at = NOW() WHERE id = ?`,
      [conversationId]
    );

    res.status(201).json({ 
      success: true, 
      message: {
        id: insertResult.insertId,
        conversation_id: conversationId,
        sender_id: senderId,
        type: type || 'text',
        text: text,
        created_at: new Date()
      }
    });

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

    const [conversations] = await tenantDb.execute(
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

exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const { appId, participantIds } = req.body; // e.g. ["user1", "user2"]

    if (!participantIds || participantIds.length !== 2) {
      return res.status(400).json({ success: false, message: 'Exactly 2 participants are required for direct chat' });
    }

    const tenantResult = await db.query('SELECT * FROM tenants WHERE app_id = ?', [appId]);
    const tenant = tenantResult.rows[0];
    if (!tenant) return res.status(404).json({ success: false, message: 'App not found' });

    const tenantDb = await DbManager.getTenantDb(tenant.id);

    // 1. Check if direct conversation exists
    const [existing] = await tenantDb.execute(
      `SELECT p1.conversation_id FROM participants p1
       JOIN participants p2 ON p1.conversation_id = p2.conversation_id
       JOIN conversations c ON p1.conversation_id = c.id
       WHERE p1.user_id = ? AND p2.user_id = ? AND c.type = 'direct' LIMIT 1`,
      [participantIds[0], participantIds[1]]
    );

    if (existing.length > 0) {
      return res.status(200).json({ success: true, conversationId: existing[0].conversation_id });
    }

    // 2. Create new conversation
    const [result] = await tenantDb.execute(
      "INSERT INTO conversations (type) VALUES ('direct')"
    );
    const conversationId = result.insertId;

    // 3. Add participants
    await tenantDb.execute(
      "INSERT INTO participants (conversation_id, user_id) VALUES (?, ?), (?, ?)",
      [conversationId, participantIds[0], conversationId, participantIds[1]]
    );

    res.status(201).json({ success: true, conversationId });
  } catch (error) {
    next(error);
  }
};
