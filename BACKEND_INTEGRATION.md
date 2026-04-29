# Antigravity Backend Integration Guide

This guide is for backend developers who need to secure and sync their user base with the Antigravity infrastructure.

---

## 1. Security (API Keys)
In your Antigravity Admin Panel, you will find:
*   **App ID**: Public identifier.
*   **Public Key**: Used for client-side identification.
*   **Secret Key**: **DO NOT SHARE.** Use this only in your backend for signing and syncing.

---

## 2. Syncing Users
Antigravity needs to know which users exist in your system to route messages correctly. Call this API whenever a new user signs up on your platform.

**Endpoint**: `POST /api/v1/tenant/users/sync`
**Headers**: `X-App-Secret: YOUR_SECRET_KEY`
**Body**:
```json
{
  "external_user_id": "YOUR_INTERNAL_USER_ID"
}
```

---

## 3. Generating JWT Tokens
Your backend must sign tokens for your users so they can connect to Antigravity.

```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { 
    user_id: "USER_ID_FROM_YOUR_DB", 
    app_id: "YOUR_APP_ID" 
  },
  "YOUR_SECRET_KEY",
  { expiresIn: '24h' }
);
```

---

## 4. BYODB Schema Setup
To use the "Bring Your Own Database" feature:
1.  Initialize a MySQL database.
2.  Import the `client_db.sql` schema.
3.  Enter the database connection string in the Antigravity Admin Panel.

---

## 5. Webhooks
You can register a Webhook URL in the Admin Panel to receive real-time notifications for:
*   `message.sent`
*   `call.missed`
*   `user.online`

Validate the `X-Antigravity-Signature` header in your webhook handler to ensure the request came from us.
