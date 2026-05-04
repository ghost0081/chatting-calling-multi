# AI Prompt: Complete Chat Implementation

**Instruction for the AI (Cursor / Antigravity / ChatGPT):**
"I want to implement a complete, premium real-time chat system in my frontend using the Antigravity backend. Follow the requirements below to generate the code."

---

### 1. Technical Context
*   **Backend URL**: `https://darkgray-yak-842420.hostingersite.com`
*   **Socket URL**: `wss://darkgray-yak-842420.hostingersite.com`
*   **Auth Method**: Direct `userId` and `appId` (No JWT needed).
*   **Library**: `socket.io-client`.

### 2. Required Features
Generate a modern, responsive React/Tailwind component that includes:
1.  **Socket Initialization**: Connect on mount using the current user's ID.
2.  **Conversation List (Inbox)**:
    *   Fetch using `GET /api/v1/chat/conversations/:userId?appId=...`.
    *   Display last message and timestamp.
3.  **Chat Window**:
    *   Load message history using `GET /api/v1/chat/messages/:conversationId?appId=...`.
    *   Implement `socket.emit('send_message', ...)` to send new messages.
    *   Listen for `socket.on('receive_message', ...)` for real-time updates.
4.  **Polish**:
    *   Auto-scroll to bottom on new messages.
    *   Typing indicators (`user_typing` event).
    *   Online status indicators (`user_status` event).

### 3. Implementation Logic (Reference)
*   **Connecting 2 People**: To start a new chat, use `POST /api/v1/chat/conversations/direct` with `participantIds: [myId, partnerId]`.
*   **Room Management**: Always emit `join_conversation` with the `conversationId` before starting a chat session.

---

### 4. Code Structure Request
"Please generate:
1.  A `useChat` custom hook to manage all socket logic and message state.
2.  A `ChatApp` container component.
3.  `ChatList` and `ChatMessage` UI components.
4.  Ensure it uses Tailwind CSS for a premium, WhatsApp/Slack style look."
