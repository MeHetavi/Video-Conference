// Media Flow Logger - Add this file to your project
// Include this in your HTML with: <script src="mediaflow-logger.js"></script>

(function() {
  // Store original methods to avoid infinite recursion
  const originalCreateOffer = RTCPeerConnection.prototype.createOffer;
  const originalCreateAnswer = RTCPeerConnection.prototype.createAnswer;
  const originalSetLocalDescription = RTCPeerConnection.prototype.setLocalDescription;
  const originalSetRemoteDescription = RTCPeerConnection.prototype.setRemoteDescription;
  const originalAddIceCandidate = RTCPeerConnection.prototype.addIceCandidate;
  const originalAddTrack = RTCPeerConnection.prototype.addTrack;
  
  // Log prefix
  const LOG_PREFIX = '[MEDIA FLOW]';
  
  // Override RTCPeerConnection methods to add logging
  RTCPeerConnection.prototype.createOffer = function() {
    console.log(`${LOG_PREFIX} Creating offer`);
    return originalCreateOffer.apply(this, arguments)
      .then(offer => {
        console.log(`${LOG_PREFIX} Offer created successfully`);
        return offer;
      })
      .catch(err => {
        console.error(`${LOG_PREFIX} Error creating offer:`, err);
        throw err;
      });
  };
  
  RTCPeerConnection.prototype.createAnswer = function() {
    console.log(`${LOG_PREFIX} Creating answer`);
    return originalCreateAnswer.apply(this, arguments)
      .then(answer => {
        console.log(`${LOG_PREFIX} Answer created successfully`);
        return answer;
      })
      .catch(err => {
        console.error(`${LOG_PREFIX} Error creating answer:`, err);
        throw err;
      });
  };
  
  RTCPeerConnection.prototype.setLocalDescription = function(description) {
    console.log(`${LOG_PREFIX} Setting local description, type: ${description.type}`);
    return originalSetLocalDescription.apply(this, arguments)
      .then(() => {
        console.log(`${LOG_PREFIX} Local description set successfully`);
      })
      .catch(err => {
        console.error(`${LOG_PREFIX} Error setting local description:`, err);
        throw err;
      });
  };
  
  RTCPeerConnection.prototype.setRemoteDescription = function(description) {
    console.log(`${LOG_PREFIX} Setting remote description, type: ${description.type}`);
    return originalSetRemoteDescription.apply(this, arguments)
      .then(() => {
        console.log(`${LOG_PREFIX} Remote description set successfully`);
      })
      .catch(err => {
        console.error(`${LOG_PREFIX} Error setting remote description:`, err);
        throw err;
      });
  };
  
  RTCPeerConnection.prototype.addIceCandidate = function(candidate) {
    if (candidate) {
      console.log(`${LOG_PREFIX} Adding ICE candidate: ${candidate.candidate}`);
    } else {
      console.log(`${LOG_PREFIX} Adding end-of-candidates indicator`);
    }
    return originalAddIceCandidate.apply(this, arguments)
      .then(() => {
        console.log(`${LOG_PREFIX} ICE candidate added successfully`);
      })
      .catch(err => {
        console.error(`${LOG_PREFIX} Error adding ICE candidate:`, err);
        throw err;
      });
  };
  
  RTCPeerConnection.prototype.addTrack = function(track, ...streams) {
    console.log(`${LOG_PREFIX} Adding ${track.kind} track to peer connection: ${track.id}`);
    try {
      const sender = originalAddTrack.apply(this, arguments);
      console.log(`${LOG_PREFIX} Track added successfully`);
      return sender;
    } catch (err) {
      console.error(`${LOG_PREFIX} Error adding track:`, err);
      throw err;
    }
  };
  
  // Log getUserMedia calls
  const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
  navigator.mediaDevices.getUserMedia = function(constraints) {
    console.log(`${LOG_PREFIX} Requesting user media:`, constraints);
    return originalGetUserMedia.apply(this, arguments)
      .then(stream => {
        console.log(`${LOG_PREFIX} User media obtained successfully`);
        stream.getTracks().forEach(track => {
          console.log(`${LOG_PREFIX} - ${track.kind} track: ${track.label}`);
        });
        return stream;
      })
      .catch(err => {
        console.error(`${LOG_PREFIX} Error getting user media:`, err);
        throw err;
      });
  };
  
  // Log when a track is received
  const trackEventName = 'track';
  const originalAddEventListener = RTCPeerConnection.prototype.addEventListener;
  RTCPeerConnection.prototype.addEventListener = function(type, listener, options) {
    if (type === trackEventName) {
      const wrappedListener = function(e) {
        console.log(`${LOG_PREFIX} Track received:`, e.track.kind);
        listener(e);
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.apply(this, arguments);
  };
  
  console.log(`${LOG_PREFIX} Media flow logger initialized`);
})();