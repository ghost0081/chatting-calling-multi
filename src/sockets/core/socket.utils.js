/**
 * Standardized Socket Response Utility
 */

exports.sendAck = (callback, success, data = {}, error = null, code = 'SUCCESS') => {
  if (typeof callback !== 'function') return;
  callback({
    success,
    code: success ? code : (code === 'SUCCESS' ? 'ERROR' : code),
    data,
    error
  });
};

exports.formatMessage = (data) => {
  return {
    id: data.id,
    conversation_id: data.conversation_id,
    sender_id: data.sender_id,
    content: data.content,
    type: data.type || 'text',
    metadata: data.metadata || {},
    status: data.status || 'sent', // sent, delivered, read
    created_at: data.created_at || new Date()
  };
};

exports.validatePayload = (payload, requiredFields) => {
  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  return { valid: true };
};
