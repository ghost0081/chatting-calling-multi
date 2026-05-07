# Client Frontend Developer API Guide (Updated)

This document explains how your frontend developer (Web/Mobile) should connect to the chat engine. It has been updated to support **Role-Based Chatting (User ↔ Astrologer)**.

---

## 1. Connection Details
*   **Base API URL**: `https://thewisegym.com/api/v1`
*   **Socket URL**: `https://thewisegym.com`

---

## 2. Real-Time Connection (Socket.io)

When connecting to the socket, you **MUST** pass the following details in the `auth` object. This ensures the user is correctly registered and their role is saved.

### Connection Example:
```javascript
const socket = io("https://thewisegym.com", {
  auth: { 
    userId: "438",                  // The ID from your own database
    appId: "app_95f0b110a79f40d3", // Your unique App ID
    userType: "users",             // MUST be 'users' or 'astrologer'
    username: "Hanish Rahar",      // User's display name
    avatarUrl: "profile.png"       // User's profile image link
  }
});
```

---

## 3. Getting Chat List (Unified API)

Use this API to show the list of people the user can talk to.

**Endpoint**: `GET /chat/conversations/:userId?appId=YOUR_APP_ID`

### How it behaves for different roles:
1.  **For regular Users (`userType: users`)**:
    *   This API returns **ALL available Astrologers** in the system.
    *   If a conversation exists, `conversation_id` will be provided.
    *   If no conversation exists yet, `conversation_id` will be `null`.
2.  **For Astrologers (`userType: astrologer`)**:
    *   This API returns only the Users who have actually sent a message to the astrologer.

**Example Response**:
```json
{
  "success": true,
  "conversations": [
    {
      "other_user_id": "1",
      "other_first_name": "Paramjyotika",
      "other_last_name": "Sanjay",
      "other_avatar": "astro.png",
      "other_type": "astrologer",
      "conversation_id": 2,          // null if never chatted
      "last_message": "Hello!",      // null if never chatted
      "last_message_at": "..."
    }
  ]
}
```

---

## 4. Starting or Opening a Chat

Before opening a chat window, you should ensure a `conversationId` exists. If the `conversation_id` in the list above is `null`, you must call this API first:

**Endpoint**: `POST /chat/conversations/direct`

**Body**:
```json
{
  "appId": "YOUR_APP_ID",
  "participantIds": ["438", "1"] // [User_ID, Astrologer_ID]
}
```

**Restriction**: This API will return an error (403) if you try to connect two users of the same type (e.g. User to User).

---

## 5. Sending & Receiving Messages

### Via REST API:
`POST /chat/messages`
```json
{
  "appId": "YOUR_APP_ID",
  "conversationId": 2,
  "senderId": "438",
  "text": "Hello Astrologer!",
  "type": "text"
}
```

### Via Socket (Real-time):
**Emit Event**: `send_message`
**Receive Event**: `receive_message`

---

## 6. Important Notes
*   **User Types**: Ensure you always use the string **`users`** for regular users and **`astrologer`** for astrologers.
*   **Initial Sync**: The very first time a user uses the chat, they should connect via Socket so the backend can "sync" their profile details into the chat database.