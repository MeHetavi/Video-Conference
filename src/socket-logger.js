// Socket Logger - Import this in your app.js file
// Add to the top: const SocketLogger = require('./socket-logger');

const LOG_PREFIX = '[MEDIA FLOW]';

class SocketLogger {
  static logConnection(socketId) {
    console.log(`${LOG_PREFIX} Socket connected: ${socketId}`);
  }
  
  static logDisconnection(socketId, reason) {
    console.log(`${LOG_PREFIX} Socket disconnected: ${socketId}, reason: ${reason}`);
  }
  
  static logCreateRoom(socketId, roomId) {
    console.log(`${LOG_PREFIX} Socket ${socketId} creating room: ${roomId}`);
  }
  
  static logJoinRoom(socketId, roomId, name) {
    console.log(`${LOG_PREFIX} Socket ${socketId} (${name}) joining room: ${roomId}`);
  }
  
  static logGetProducers(socketId, roomId) {
    console.log(`${LOG_PREFIX} Socket ${socketId} requesting producers in room: ${roomId}`);
  }
  
  static logGetRouterRtpCapabilities(socketId) {
    console.log(`${LOG_PREFIX} Socket ${socketId} requesting router RTP capabilities`);
  }
  
  static logCreateWebRtcTransport(socketId) {
    console.log(`${LOG_PREFIX} Socket ${socketId} creating WebRTC transport`);
  }
  
  static logConnectTransport(socketId, transportId) {
    console.log(`${LOG_PREFIX} Socket ${socketId} connecting transport: ${transportId}`);
  }
  
  static logProduce(socketId, kind, transportId) {
    console.log(`${LOG_PREFIX} Socket ${socketId} producing ${kind} on transport: ${transportId}`);
  }
  
  static logConsume(socketId, transportId, producerId) {
    console.log(`${LOG_PREFIX} Socket ${socketId} consuming producer ${producerId} on transport: ${transportId}`);
  }
  
  static logResumeConsumer(socketId, consumerId) {
    console.log(`${LOG_PREFIX} Socket ${socketId} resuming consumer: ${consumerId}`);
  }
  
  static logProducerScore(producerId, score) {
    console.log(`${LOG_PREFIX} Producer ${producerId} score: ${JSON.stringify(score)}`);
  }
  
  static logConsumerScore(consumerId, score) {
    console.log(`${LOG_PREFIX} Consumer ${consumerId} score: ${JSON.stringify(score)}`);
  }
  
  static logError(context, error) {
    console.error(`${LOG_PREFIX} Error in ${context}:`, error);
  }
}

module.exports = SocketLogger;