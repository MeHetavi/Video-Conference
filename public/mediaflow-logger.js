// Media Flow Logger - Add this file to your project
// Include this in your HTML with: <script src="mediaflow-logger.js"></script>

(function () {
  // Store original methods to avoid infinite recursion
  const originalCreateOffer = RTCPeerConnection.prototype.createOffer;
  const originalCreateAnswer = RTCPeerConnection.prototype.createAnswer;
  const originalSetLocalDescription = RTCPeerConnection.prototype.setLocalDescription;
  const originalSetRemoteDescription = RTCPeerConnection.prototype.setRemoteDescription;
  const originalAddIceCandidate = RTCPeerConnection.prototype.addIceCandidate;

  // Log prefix
  const LOG_PREFIX = '[MEDIA FLOW]';

  // Override RTCPeerConnection methods to add logging
  RTCPeerConnection.prototype.createOffer = function () {
    return originalCreateOffer.apply(this, arguments)
      .catch(err => {
        console.error(`${LOG_PREFIX} Error creating offer:`, err);
        throw err;
      });
  };

  RTCPeerConnection.prototype.createAnswer = function () {
    return originalCreateAnswer.apply(this, arguments)
      .catch(err => {
        console.error(`${LOG_PREFIX} Error creating answer:`, err);
        throw err;
      });
  };

  RTCPeerConnection.prototype.setLocalDescription = function (description) {
    return originalSetLocalDescription.apply(this, arguments)
      .catch(err => {
        console.error(`${LOG_PREFIX} Error setting local description:`, err);
        throw err;
      });
  };

  RTCPeerConnection.prototype.setRemoteDescription = function (description) {
    return originalSetRemoteDescription.apply(this, arguments)
      .catch(err => {
        console.error(`${LOG_PREFIX} Error setting remote description:`, err);
        throw err;
      });
  };

  RTCPeerConnection.prototype.addIceCandidate = function (candidate) {
    return originalAddIceCandidate.apply(this, arguments)
      .catch(err => {
        console.error(`${LOG_PREFIX} Error adding ICE candidate:`, err);
        throw err;
      });
  };

  // Log getUserMedia errors
  const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
  navigator.mediaDevices.getUserMedia = function (constraints) {
    return originalGetUserMedia.apply(this, arguments)
      .catch(err => {
        console.error(`${LOG_PREFIX} Error getting user media:`, err);
        throw err;
      });
  };

  console.log(`${LOG_PREFIX} Media flow logger initialized`);
})();

