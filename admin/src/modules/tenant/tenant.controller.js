const db = require('../../config/db');

exports.createConversation = async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const { type, participant_external_ids } = req.body;

    // Start a transaction
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const convResult = await client.execute(
        `INSERT INTO conversations (tenant_id, type) VALUES (?, ?)`,
        [tenant_id, type || 'one-to-one']
      );
      const conversationId = convResult[0].insertId;

      // Find internal user IDs for the external IDs
      // Using IN clause for MySQL instead of ANY
      const placeholders = participant_external_ids.map(() => '?').join(',');
      const [usersResult] = await client.query(
        `SELECT id, external_user_id FROM tenant_users WHERE tenant_id = ? AND external_user_id IN (${placeholders})`,
        [tenant_id, ...participant_external_ids]
      );

      const userIds = usersResult.map(row => row.id);
      
      // Ensure the creator is also added
      if (!userIds.includes(req.user.user_id)) {
        userIds.push(req.user.user_id);
      }

      // Add participants
      for (const uid of userIds) {
        await client.execute(
          `INSERT INTO participants (conversation_id, user_id) VALUES (?, ?)`,
          [conversationId, uid]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ success: true, conversation_id: conversationId });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    const { tenant_id, user_id } = req.user;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await db.query(
      `SELECT c.id, c.type, c.last_message_at 
       FROM conversations c
       JOIN participants p ON c.id = p.conversation_id
       WHERE c.tenant_id = ? AND p.user_id = ?
       ORDER BY c.last_message_at DESC
       LIMIT ? OFFSET ?`,
      [tenant_id, user_id, limit, offset]
    );

    res.status(200).json({ success: true, conversations: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const { conversation_id } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Check if user is participant
    const checkResult = await db.query(
      `SELECT 1 FROM participants WHERE conversation_id = ? AND user_id = ?`,
      [conversation_id, req.user.user_id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not a participant of this conversation' });
    }

    const result = await db.query(
      `SELECT m.id, m.sender_id, m.type, m.text, m.media_url, m.status, m.created_at, u.external_user_id as sender_external_id
       FROM messages m
       LEFT JOIN tenant_users u ON m.sender_id = u.id
       WHERE m.conversation_id = ? AND m.tenant_id = ? AND m.is_deleted = false
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [conversation_id, tenant_id, limit, offset]
    );

    res.status(200).json({ success: true, messages: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getUserStatus = async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const { external_user_id } = req.params;

    const result = await db.query(
      `SELECT is_online, last_seen FROM tenant_users WHERE tenant_id = ? AND external_user_id = ?`,
      [tenant_id, external_user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
