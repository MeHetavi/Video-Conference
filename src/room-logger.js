// Room Logger - Import this in your Room.js file
// Add to the top: const RoomLogger = require('./room-logger');

const LOG_PREFIX = '[MEDIA FLOW]';

class RoomLogger {
  static logRoomCreation(roomId, router) {
    console.log(`${LOG_PREFIX} Room created: ${roomId}`);
    console.log(`${LOG_PREFIX} Router ID: ${router.id}`);
  }
  
  static logPeerJoin(roomId, peerId, name) {
    console.log(`${LOG_PREFIX} Peer ${peerId} (${name}) joined room ${roomId}`);
  }
  
  static logPeerLeave(roomId, peerId, name) {
    console.log(`${LOG_PREFIX} Peer ${peerId} (${name}) left room ${roomId}`);
  }
  
  static logTransportCreation(transportId, peerId) {
    console.log(`${LOG_PREFIX} Transport ${transportId} created for peer ${peerId}`);
  }
  
  static logTransportConnect(transportId, peerId, dtlsState) {
    console.log(`${LOG_PREFIX} Transport ${transportId} for peer ${peerId} DTLS state: ${dtlsState}`);
  }
  
  static logTransportClose(transportId, peerId) {
    console.log(`${LOG_PREFIX} Transport ${transportId} closed for peer ${peerId}`);
  }
  
  static logProducerCreation(producerId, peerId, kind) {
    console.log(`${LOG_PREFIX} Producer ${producerId} (${kind}) created by peer ${peerId}`);
  }
  
  static logProducerClose(producerId, peerId) {
    console.log(`${LOG_PREFIX} Producer ${producerId} closed for peer ${peerId}`);
  }
  
  static logConsumerCreation(consumerId, peerId, producerId, kind) {
    console.log(`${LOG_PREFIX} Consumer ${consumerId} (${kind}) created for peer ${peerId} consuming producer ${producerId}`);
  }
  
  static logConsumerClose(consumerId, peerId) {
    console.log(`${LOG_PREFIX} Consumer ${consumerId} closed for peer ${peerId}`);
  }
  
  static logRtpCapabilities(capabilities) {
    console.log(`${LOG_PREFIX} RTP Capabilities:`, JSON.stringify(capabilities, null, 2));
  }
  
  static logError(context, error) {
    console.error(`${LOG_PREFIX} Error in ${context}:`, error);
  }
}

module.exports = RoomLogger;