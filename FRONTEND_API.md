# Antigravity Frontend Developer API Guide

This document explains how to connect your frontend (Web/Mobile) to the Antigravity communication engine.

---

## 1. Connection Details
*   **Base API URL**: `https://darkgray-yak-842420.hostingersite.com/api/v1`
*   **Socket URL**: `wss://darkgray-yak-842420.hostingersite.com`

---

## 2. Real-Time (Socket.io)

### Connection
```javascript
const socket = io("https://your-domain.com", {
  auth: { 
    userId: "USER_ID_FROM_YOUR_APP",
    appId: "YOUR_APP_ID"
  }
});
```

### Event: Sending a Message
**Event Name**: `chat:send`
**Payload**:
```json
{
  "conversationId": 123,
  "text": "Hello world",
  "type": "text"
}
```

### Event: Receiving a Message
**Event Name**: `chat:message`
**Payload**:
```json
{
  "id": 456,
  "senderId": 789,
  "text": "Hello world",
  "createdAt": "2023-10-27T..."
}
```

---

## 3. REST API (History & State)

### Get Message History
`GET /chat/messages/:conversationId?appId=YOUR_APP_ID`

**Parameters**:
*   `conversationId`: (Path) ID of the chat.
*   `appId`: (Query) Your unique App ID.

**Response**:
```json
{
  "success": true,
  "messages": [...]
}
```

### Get Conversation List
`GET /chat/conversations/:userId?appId=YOUR_APP_ID`

**Parameters**:
*   `userId`: (Path) The external ID of the user.
*   `appId`: (Query) Your unique App ID.

---

