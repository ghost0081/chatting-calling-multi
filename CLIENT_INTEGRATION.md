# Antigravity Multi-Tenant Integration Guide

Welcome to **Antigravity**, the world's most powerful white-label communication infrastructure. This guide will help you integrate real-time chat and calling into your existing application using our **BYODB (Bring Your Own Database)** architecture.

---

## 1. Prerequisites

Before you begin, ensure you have:
*   **App ID & Secret Key**: Generated from your Antigravity Admin Dashboard.
*   **MySQL Database**: A dedicated database for your communication data (Messages, Call Logs, etc.).
*   **Server Access**: Ability to run a Node.js/Python/PHP backend.

---

## 2. Database Setup (BYODB)

Antigravity uses a **Bring Your Own Database** model for maximum data privacy. You must initialize your dedicated database with our client schema.

1.  Run the `client_db.sql` script (provided in your dashboard) on your MySQL server.
2.  Provide your database credentials (Host, User, Password, DB Name) when creating your Tenant in the Antigravity Admin Panel.

---

## 3. Backend Integration

Your backend needs to communicate with Antigravity to manage users and security.

### Synchronizing Users
When a user signs up on your platform, you should notify Antigravity so they can receive messages.

```javascript
// Example: Syncing a user with Antigravity (Node.js)
const axios = require('axios');

async function syncUser(userId) {
  await axios.post('https://your-antigravity-domain.com/api/v1/users/sync', {
    external_user_id: userId
  }, {
    headers: { 'X-App-Secret': 'YOUR_SECRET_KEY' }
  });
}
```

### Generating Auth Tokens
To keep your data secure, Antigravity requires a signed token for every client connection.

```javascript
const jwt = require('jsonwebtoken');

function getAntigravityToken(userId) {
  return jwt.sign(
    { user_id: userId, app_id: 'YOUR_APP_ID' },
    'YOUR_SECRET_KEY',
    { expiresIn: '24h' }
  );
}
```

---

## 4. REST API Integration

While sockets are used for real-time updates, you can use our REST API to fetch history.

### Fetch Message History
Retrieve the last 50 messages from a specific conversation.

```bash
GET /api/v1/chat/messages/:conversationId?appId=YOUR_APP_ID
```

### Fetch Conversations
Get all active conversations for a specific user.

```bash
GET /api/v1/chat/conversations/:userId?appId=YOUR_APP_ID
```

---

## 5. Frontend Integration (Real-time)

### Web (JavaScript/Socket.io)
```javascript
import { io } from "socket.io-client";

const socket = io("https://your-antigravity-domain.com", {
  auth: {
    token: "GENERATED_JWT_TOKEN"
  }
});

// Listening for messages
socket.on("chat:message", (message) => {
  console.log("New message received:", message.text);
});

// Sending a message
socket.emit("chat:send", {
  conversationId: 123,
  text: "Hello from Antigravity!"
});
```

---

## 5. Security Best Practices

1.  **Never expose your Secret Key**: Only use it in your backend. The frontend should only use the **Public Key** or a temporary **JWT Token**.
2.  **Use SSL/TLS**: Always connect via `https://` and `wss://`.
3.  **Webhook Validation**: If you enable webhooks, verify the `X-Antigravity-Signature` header to ensure requests are authentic.

---

## 6. Support

For technical assistance or API documentation, visit:
*   **Documentation**: [https://docs.antigravity.io](https://docs.antigravity.io)
*   **Support Portal**: [https://support.antigravity.io](https://support.antigravity.io)
