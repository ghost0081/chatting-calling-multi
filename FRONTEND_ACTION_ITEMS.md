# 🛠️ Frontend Migration Guide (Required Changes)

The backend socket engine has been upgraded to a **Production-Grade** system. Your frontend code needs to be updated to match the new event names and data structures.

---

## 1. Update Socket Event Names
Please rename these events in your frontend code:

| Old Event | New Event | Purpose |
| :--- | :--- | :--- |
| `chat:send` | `send_message` | Sending a message |
| `chat:message` | `new_message` | Receiving a message |
| N/A | `unread_update` | Notification of unread message count |
| N/A | `message_delivered` | Mark message as delivered |
| N/A | `message_read` | Mark conversation as read |
| N/A | `typing_start` | Start typing notification |
| N/A | `typing_stop` | Stop typing notification |
| N/A | `user_typing` | Listening for others typing |

---

## 2. Update Response Handling (ACKs)
The server now returns a **standardized object** for all callbacks. You must check `response.success`.

**Old Way:**
```javascript
socket.emit('chat:send', data, (id) => { ... });
```

**New Way (Required):**
```javascript
socket.emit('send_message', data, (response) => {
  if (response.success) {
    console.log("Message ID:", response.data.id);
  } else {
    console.error("Error:", response.error, "Code:", response.code);
  }
});
```

---

## 3. Implement Delivery & Read Receipts (New)
To show the "Sent", "Delivered", and "Read" status, you must emit these events:

*   **When you receive a `new_message`**: Emit `socket.emit('message_delivered', { messageId, conversationId })`.
*   **When you open a chat**: Emit `socket.emit('message_read', { conversationId })`.

---

## 4. Implement Typing Indicators (New)
*   **When the user starts typing**: Emit `socket.emit('typing_start', { conversationId })`.
*   **When the user stops (or blurs)**: Emit `socket.emit('typing_stop', { conversationId })`.
*   **Listen for others**: `socket.on('user_typing', ({ userId, isTyping }) => { ... })`.

---

## 5. Presence & Online Status
*   **Online**: `socket.on('user_online', ({ userId }) => { ... })`
*   **Offline**: `socket.on('user_offline', ({ userId }) => { ... })`

---

## 6. Rate Limiting
Do not spam events! If you send messages or typing events too quickly (e.g., every 50ms), the server will block the event and return a `RATE_LIMIT` error code. Please debounce your typing events.
