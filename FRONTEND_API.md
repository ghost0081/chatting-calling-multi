# Antigravity Frontend Developer API Guide

This document explains how to connect your frontend (Web/Mobile) to the Antigravity communication engine.

---

## 1. Connection Details
*   **Base API URL**: `https://darkgray-yak-842420.hostingersite.com/api/v1`
*   **Socket URL**: `wss://darkgray-yak-842420.hostingersite.com`

---

## 2. Real-Time (Socket.io)

### Connection (Socket.io)
```javascript
const socket = io("https://darkgray-yak-842420.hostingersite.com", {
  auth: { 
    userId: "438",                  // Your User ID
    appId: "app_95f0b110a79f40d3", // Your App ID
    userType: "users",             // 'users' or 'astrologer'
    username: "Hanish Rahar",      // Display Name
    avatarUrl: "profile.png"       // Avatar URL
  }
});
```

---

### Standard Response Format (ACK)
All socket events return an acknowledgement object:
```json
{
  "success": true,
  "code": "SUCCESS",
  "data": { ... },
  "error": null
}
```

---

### Core Messaging Events

#### Event: Sending a Message
**Event Name**: `send_message`
**Payload**:
```json
{
  "conversationId": 123,
  "content": "Hello world",
  "type": "text"
}
```

#### Event: Receiving a Message
**Event Name**: `new_message`
**Payload**:
```json
{
  "id": 456,
  "sender_id": "789",
  "content": "Hello world",
  "type": "text",
  "created_at": "2026-05-11T..."
}
```

---

### Real-Time Calling Events

#### Event: Start a Call
**Event Name**: `call:start`
**Payload**: `{ "receiverId": "439", "type": "audio" }`

#### Event: Incoming Call
**Event Name**: `call:incoming`
**Data**: `{ "callId": 1, "callerId": "438", "type": "audio" }`

#### Event: Signaling (WebRTC)
Events: `call:offer`, `call:answer`, `call:ice`
**Payload**: `{ "callId": 1, "offer/answer/candidate": ... }`


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

