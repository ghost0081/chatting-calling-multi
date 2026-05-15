# 📹 Video Calling Implementation Guide (Frontend)

This guide explains how to implement the WebRTC video calling flow using the new **Production-Grade Signaling Engine**.

---

## 1. Prerequisites
You must have the camera and microphone stream ready before starting the call.

```javascript
async function getMedia() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    // Display local stream in a <video> element
    localVideoElement.srcObject = stream;
    return stream;
  } catch (err) {
    console.error("Camera access denied:", err);
  }
}
```

---

## 2. Starting a Video Call (Caller)

1.  **Emit `call:start`**:
    ```javascript
    socket.emit('call:start', { receiverId: '439', type: 'video' }, (res) => {
      if (res.success) {
        console.log("Ringing...");
        const callId = res.data.callId;
        // Proceed to Step 4 (Signaling) once accepted
      }
    });
    ```

---

## 3. Receiving a Video Call (Receiver)

1.  **Listen for `call:incoming`**:
    ```javascript
    socket.on('call:incoming', ({ callId, callerId, type }) => {
      if (type === 'video') {
        showIncomingCallUI(callerId); // Show Accept/Reject buttons
      }
    });
    ```

2.  **Accept the Call**:
    ```javascript
    socket.emit('call:accept', { callId }, (res) => {
      if (res.success) {
        startWebRTC(callId);
      }
    });
    ```

---

## 4. Canceling a Call (Caller)

If the caller wants to stop ringing before the receiver answers:

```javascript
socket.emit('call:cancel', { callId });
```

---

## 5. The WebRTC Signaling Handshake (The Hard Part)

The backend provides three "pipes" for signaling: `call:offer`, `call:answer`, and `call:ice`.

### A. Create the Connection
```javascript
const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

// Add tracks from your local stream to the connection
localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

// When remote track arrives, show it in a <video> element
peerConnection.ontrack = (event) => {
  remoteVideoElement.srcObject = event.streams[0];
};
```

### B. Handle ICE Candidates (Crucial)
```javascript
// Send your candidates to the other person
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('call:ice', { callId, candidate: event.candidate });
  }
};

// Listen for their candidates
socket.on('call:ice', ({ candidate }) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});
```

### C. The Offer/Answer Exchange
**Caller side:**
```javascript
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);
socket.emit('call:offer', { callId, offer });

socket.on('call:answer', async ({ answer }) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});
```

**Receiver side:**
```javascript
socket.on('call:offer', async ({ offer }) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('call:answer', { callId, answer });
});
```

---

## 6. Handling Disconnects & Reconnects
The backend has a **15-second grace period**. If the partner's internet flickers, you will receive:

```javascript
socket.on('call:partner_disconnected', () => {
  showOverlay("Reconnecting...");
});

socket.on('call:partner_reconnected', () => {
  hideOverlay();
});

socket.on('call:ended', ({ status, duration }) => {
  // Status can be: 'completed', 'rejected', 'missed', 'busy', 'cancelled'
  alert(`Call Ended: ${status}. Duration: ${duration}s`);
  closeConnection();
});
```

---

### Important Tips:
*   **Permissions**: Always check `navigator.mediaDevices` support.
*   **Cleanup**: When the call ends, stop all tracks in `localStream` and call `peerConnection.close()`.
*   **STUN/TURN**: Google's STUN server works for testing, but for production, you should use a **TURN server** (like Coturn or Twilio) to handle symmetric NATs.
