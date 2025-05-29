// Peer Logger - Import this in your Peer.js file
// Add to the top: const PeerLogger = require('./peer-logger');

const LOG_PREFIX = '[MEDIA FLOW]';

class PeerLogger {
  static logPeerCreation(id, name) {
    console.log(`${LOG_PREFIX} Peer created: ${id} (${name})`);
  }
  
  static logAddTransport(peerId, transportId) {
    console.log(`${LOG_PREFIX} Transport ${transportId} added to peer ${peerId}`);
  }
  
  static logConnectTransport(peerId, transportId, dtlsParameters) {
    console.log(`${LOG_PREFIX} Connecting transport ${transportId} for peer ${peerId}`);
    console.log(`${LOG_PREFIX} DTLS parameters:`, JSON.stringify(dtlsParameters, null, 2));
  }
  
  static logCreateProducer(peerId, transportId, kind) {
    console.log(`${LOG_PREFIX} Creating ${kind} producer for peer ${peerId} on transport ${transportId}`);
  }
  
  static logProducerCreated(peerId, producerId, kind) {
    console.log(`${LOG_PREFIX} Producer ${producerId} (${kind}) created for peer ${peerId}`);
  }
  
  static logCreateConsumer(peerId, transportId, producerId) {
    console.log(`${LOG_PREFIX} Creating consumer for peer ${peerId} on transport ${transportId} for producer ${producerId}`);
  }
  
  static logConsumerCreated(peerId, consumerId, producerId, kind) {
    console.log(`${LOG_PREFIX} Consumer ${consumerId} (${kind}) created for peer ${peerId} consuming producer ${producerId}`);
  }
  
  static logRemoveConsumer(peerId, consumerId) {
    console.log(`${LOG_PREFIX} Consumer ${consumerId} removed from peer ${peerId}`);
  }
  
  static logRemoveProducer(peerId, producerId) {
    console.log(`${LOG_PREFIX} Producer ${producerId} removed from peer ${peerId}`);
  }
  
  static logCloseTransport(peerId, transportId) {
    console.log(`${LOG_PREFIX} Transport ${transportId} closed for peer ${peerId}`);
  }
  
  static logError(context, peerId, error) {
    console.error(`${LOG_PREFIX} Error in ${context} for peer ${peerId}:`, error);
  }
}

module.exports = PeerLogger;