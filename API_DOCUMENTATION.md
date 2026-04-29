# Antigravity API Documentation

## Base URL
`http://api.yourdomain.com/api/v1`

## 1. Authentication

### Admin Login
- **Endpoint**: `POST /auth/admin/login`
- **Body**:
  ```json
  {
    "email": "admin@antigravity.com",
    "password": "yourpassword"
  }
  ```
- **Response**: JWT Token for Admin Panel access.

### Client User Token Generation
Clients call this from their secure backend to generate JWTs for their end-users.
- **Endpoint**: `POST /auth/token`
- **Body**:
  ```json
  {
    "app_id": "app_12345",
    "public_key": "pk_abcdef",
    "secret_key": "sk_ghijklmno",
    "external_user_id": "user_9876"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "token": "eyJhb...",
    "user_id": 45
  }
  ```

## 2. Tenant API (Requires Bearer Token)

### Create Conversation
- **Endpoint**: `POST /tenant/conversations`
- **Body**:
  ```json
  {
    "type": "one-to-one",
    "participant_external_ids": ["user_5555"]
  }
  ```
- **Response**: `conversation_id`

### Get Conversations
- **Endpoint**: `GET /tenant/conversations?limit=20&offset=0`

### Get Messages
- **Endpoint**: `GET /tenant/conversations/:conversation_id/messages`

### Get User Status (Online/Last Seen)
- **Endpoint**: `GET /tenant/users/:external_user_id/status`

---

## Socket.IO Events

Connect to URL: `http://api.yourdomain.com`
Auth: Pass `{ auth: { token: 'JWT_TOKEN_HERE' } }`

### Chat Events
- `emit('join_conversation', { conversation_id })`
- `emit('send_message', { conversation_id, text, type, media_url })`
- `on('receive_message', (data) => {})`
- `emit('typing', { conversation_id, is_typing })`
- `on('user_typing', (data) => {})`

### WebRTC Events
- `emit('call_initiate', { receiver_id, type: 'audio'|'video' })`
- `on('incoming_call', (data) => {})`
- `emit('call_accept', { call_id })`
- `emit('call_reject', { call_id })`
- `emit('webrtc_offer', { target_user_id, offer, call_id })`
- `emit('webrtc_answer', { target_user_id, answer, call_id })`
- `emit('ice_candidate', { target_user_id, candidate, call_id })`
