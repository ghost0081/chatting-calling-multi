# Frontend Implementation Guide: Antigravity Chat

This guide explains how to integrate your existing user base with the Antigravity communication engine.

---

## 1. Getting your User ID
Since Antigravity uses **Plug-and-Play IDs**, you do not need to generate new tokens. Simply use the unique ID your user already has in your system (e.g., their Database Primary Key, UUID, or Firebase UID).

**Requirement**: 
*   **User ID**: The ID of the currently logged-in user.
*   **App ID**: Your unique platform identifier (provided by the Admin).

---

## 2. Connecting to the Socket
Install the `socket.io-client` library and connect using the following configuration:

```javascript
import { io } from "socket.io-client";

const socket = io("https://darkgray-yak-842420.hostingersite.com", {
  auth: { 
    userId: "12345", // The ID from your own database
    appId: "YOUR_APP_ID" // Your unique App ID
  }
});

socket.on("connect", () => {
  console.log("Connected to Antigravity!");
});
```

---

## 3. How to Chat Between 2 People

### Step A: Get the Conversation ID
To chat with someone, you first need a `conversationId`. You should fetch this from your backend or use our API to "Get or Create" a direct conversation between two users.

**API Endpoint**: `POST /api/v1/chat/conversations/direct`
**Payload**:
```json
{
  "appId": "YOUR_APP_ID",
  "participantIds": ["YOUR_USER_ID", "PARTNER_USER_ID"]
}
```

### Step B: Join the Conversation Room
Once you have the `conversationId`, tell the socket to listen for messages in that room:

```javascript
socket.emit("join_conversation", { conversation_id: 123 });
```

### Step C: Sending a Message
```javascript
const sendMessage = (text) => {
  socket.emit("send_message", {
    conversation_id: 123,
    text: text,
    type: "text"
  }, (response) => {
    if (response.success) {
      console.log("Message sent!", response.message);
    }
  });
};
```

### Step D: Receiving a Message
```javascript
socket.on("receive_message", (message) => {
  console.log("New message received:", message);
  // Add to your state/UI
});
```

---

## 4. UI Best Practices
*   **Online Status**: Listen for `user_status` events to show who is online.
*   **Typing Indicator**: Emit `typing` when the user starts typing to show a "John is typing..." animation to the partner.
*   **Message History**: Use `GET /api/v1/chat/messages/:conversationId?appId=...` to load old messages when the chat opens.
