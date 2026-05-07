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
      `INSERT INTO messages (conversation_id, sender_id, type, content, created_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [conversationId, senderId, type || 'text', text]
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
        content: text,
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

    // Get conversations with details of the other participant from the 'users' table
    const [conversations] = await tenantDb.execute(
      `SELECT 
        c.*,
        u.firstName as other_first_name,
        u.lastName as other_last_name,
        u.profileImage as other_avatar,
        u.userType as other_type,
        u.id as other_user_id
       FROM conversations c
       JOIN participants p1 ON c.id = p1.conversation_id
       JOIN participants p2 ON c.id = p2.conversation_id
       JOIN users u ON p2.user_id = u.id
       WHERE p1.user_id = ? AND p2.user_id != ?
       ORDER BY c.last_message_at DESC`,
      [userId, userId]
    );

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};

exports.getContacts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { appId } = req.query;

    const tenantResult = await db.query('SELECT * FROM tenants WHERE app_id = ?', [appId]);
    const tenant = tenantResult.rows[0];
    if (!tenant) return res.status(404).json({ success: false, message: 'App not found' });

    const tenantDb = await DbManager.getTenantDb(tenant.id);

    // 1. Get current user type from 'users' table
    const [currentUser] = await tenantDb.execute(
      'SELECT userType FROM users WHERE id = ?',
      [userId]
    );

    if (currentUser.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found in client database' });
    }

    const typeToFetch = currentUser[0].userType === 'users' ? 'astrologer' : 'users';

    // 2. Fetch all users of the opposite type
    const [contacts] = await tenantDb.execute(
      'SELECT id as user_id, firstName, lastName, profileImage as avatar_url, userType as user_type FROM users WHERE userType = ? LIMIT 100',
      [typeToFetch]
    );

    res.status(200).json({ success: true, contacts });
  } catch (error) {
    next(error);
  }
};

exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const { appId, participantIds } = req.body; // e.g. ["1", "438"]

    if (!participantIds || participantIds.length !== 2) {
      return res.status(400).json({ success: false, message: 'Exactly 2 participants are required for direct chat' });
    }

    const tenantResult = await db.query('SELECT * FROM tenants WHERE app_id = ?', [appId]);
    const tenant = tenantResult.rows[0];
    if (!tenant) return res.status(404).json({ success: false, message: 'App not found' });

    const tenantDb = await DbManager.getTenantDb(tenant.id);

    // 1. Check user types from the client's 'users' table
    const [users] = await tenantDb.execute(
      'SELECT id, userType FROM users WHERE id IN (?, ?)',
      [participantIds[0], participantIds[1]]
    );

    if (users.length < 2) {
      return res.status(400).json({ success: false, message: 'One or both users not found in the client database' });
    }

    // Role check: Ensure one is astrologer and one is user
    // Note: In your DB 'users' seems to be the type for regular users
    if (users[0].userType === users[1].userType) {
      return res.status(403).json({ 
        success: false, 
        message: `Restriction: ${users[0].userType}s cannot chat with other ${users[0].userType}s` 
      });
    }

    // 2. Check if direct conversation exists
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

    // 3. Create new conversation
    const [result] = await tenantDb.execute(
      "INSERT INTO conversations (type) VALUES ('direct')"
    );
    const conversationId = result.insertId;

    // 4. Add participants
    await tenantDb.execute(
      "INSERT INTO participants (conversation_id, user_id) VALUES (?, ?), (?, ?)",
      [conversationId, participantIds[0], conversationId, participantIds[1]]
    );

    res.status(201).json({ success: true, conversationId });
  } catch (error) {
    next(error);
  }
};
