# 📞 WebRTC Calling Frontend Integration Guide

This guide explains how to use the new **Production-Grade Calling Engine**. It handles signaling, busy-states, and automatic timeouts.

---

## 1. Event Overview

### Lifecycle Events
| Event | Type | Purpose |
| :--- | :--- | :--- |
| `call:start` | Emit | Start a new call. Payload: `{ receiverId, type: 'audio'|'video' }` |
| `call:incoming` | Listen | You are receiving a call. Data: `{ callId, callerId, type }` |
| `call:accept` | Emit | Accept the incoming call. Payload: `{ callId }` |
| `call:accepted` | Listen | Other side accepted. You should now start WebRTC handshake. |
| `call:reject` | Emit | Reject the call. |
| `call:end` | Emit | Hang up an ongoing call. |
| `call:ended` | Listen | Call was terminated (Normal, Rejected, Busy, or Timeout). |

### Signaling Events (WebRTC)
| Event | Type | Purpose |
| :--- | :--- | :--- |
| `call:offer` | Emit/Listen | Forward SDP Offer. Payload: `{ callId, offer }` |
| `call:answer` | Emit/Listen | Forward SDP Answer. Payload: `{ callId, answer }` |
| `call:ice` | Emit/Listen | Forward ICE Candidate. Payload: `{ callId, candidate }` |

---

## 2. Standard Calling Flow

### A. The Handshake (Caller Side)
1.  Emit `call:start` with `receiverId`.
2.  Wait for `call:accepted`.
3.  Once accepted, create your `RTCPeerConnection`.
4.  Create a **WebRTC Offer**.
5.  Emit `call:offer` with that SDP.
6.  Listen for `call:answer` and set it as `RemoteDescription`.
7.  Listen for `call:ice` and `addIceCandidate`.

### B. The Handshake (Receiver Side)
1.  Listen for `call:incoming`.
2.  Show the "Incoming Call" UI.
3.  When user clicks Accept, emit `call:accept`.
4.  Listen for `call:offer` from the caller.
5.  Set the offer as `RemoteDescription`.
6.  Create a **WebRTC Answer**.
7.  Emit `call:answer` with that SDP.
8.  Start sending your `ICE candidates` via `call:ice`.

---

## 3. Important Logic
*   **Busy State**: If the target is already in a call, `call:start` will return a `BUSY` error code in the ACK.
*   **Timeouts**: If a call is not accepted within 45 seconds, the server will automatically end it with a `missed` status.
*   **Standard ACKs**: All emits return `{ success, code, data, error }`. Always verify `success === true`.

---

## 4. Example: Accepting a Call
```javascript
socket.on('call:incoming', ({ callId, callerId, type }) => {
  // 1. Show Ringing UI
  // 2. On Click Accept:
  socket.emit('call:accept', { callId }, (res) => {
     if (res.success) {
       // Start WebRTC initialization...
     }
  });
});
```
