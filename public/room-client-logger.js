// RoomClient Logger - Include this in your HTML
// <script src="room-client-logger.js"></script>

(function() {
  // Original RoomClient class
  const OriginalRoomClient = window.RoomClient;
  
  // Log prefix
  const LOG_PREFIX = '[MEDIA FLOW]';
  
  // Override RoomClient to add logging
  window.RoomClient = function(...args) {
    console.log(`${LOG_PREFIX} Creating RoomClient instance`);
    
    // Create original instance
    const instance = new OriginalRoomClient(...args);
    
    // Log room joining
    const originalJoin = instance.join;
    instance.join = function() {
      console.log(`${LOG_PREFIX} Joining room: ${instance.room_id} as ${instance.name}`);
      return originalJoin.apply(this, arguments);
    };
    
    // Log device loading
    const originalLoadDevice = instance.loadDevice;
    instance.loadDevice = function(routerRtpCapabilities) {
      console.log(`${LOG_PREFIX} Loading mediasoup device with router capabilities`);
      return originalLoadDevice.apply(this, arguments)
        .then(result => {
          console.log(`${LOG_PREFIX} Device loaded successfully`);
          return result;
        })
        .catch(err => {
          console.error(`${LOG_PREFIX} Error loading device:`, err);
          throw err;
        });
    };
    
    // Log transport initialization
    const originalInitTransports = instance.initTransports;
    instance.initTransports = function(device) {
      console.log(`${LOG_PREFIX} Initializing WebRTC transports`);
      return originalInitTransports.apply(this, arguments)
        .then(result => {
          console.log(`${LOG_PREFIX} Transports initialized successfully`);
          console.log(`${LOG_PREFIX} Producer transport ID: ${instance.producerTransport.id}`);
          console.log(`${LOG_PREFIX} Consumer transport ID: ${instance.consumerTransport.id}`);
          return result;
        })
        .catch(err => {
          console.error(`${LOG_PREFIX} Error initializing transports:`, err);
          throw err;
        });
    };
    
    // Log media production
    const originalProduce = instance.produce;
    instance.produce = function(type, deviceId) {
      console.log(`${LOG_PREFIX} Producing ${type} media${deviceId ? ` from device ${deviceId}` : ''}`);
      return originalProduce.apply(this, arguments)
        .then(producer => {
          console.log(`${LOG_PREFIX} ${type} producer created: ${producer.id}`);
          return producer;
        })
        .catch(err => {
          console.error(`${LOG_PREFIX} Error producing ${type}:`, err);
          throw err;
        });
    };
    
    // Log consumption
    const originalConsume = instance.consume;
    instance.consume = function(producer_id, peer_name) {
      console.log(`${LOG_PREFIX} Consuming producer ${producer_id} from peer ${peer_name}`);
      return originalConsume.apply(this, arguments)
        .then(consumer => {
          console.log(`${LOG_PREFIX} Consumer created: ${consumer.id} for producer ${producer_id}`);
          return consumer;
        })
        .catch(err => {
          console.error(`${LOG_PREFIX} Error consuming producer ${producer_id}:`, err);
          throw err;
        });
    };
    
    // Log resuming consumers
    const originalResumeConsumer = instance.resumeConsumer;
    instance.resumeConsumer = function(consumer) {
      console.log(`${LOG_PREFIX} Resuming consumer: ${consumer.id}`);
      return originalResumeConsumer.apply(this, arguments)
        .then(result => {
          console.log(`${LOG_PREFIX} Consumer ${consumer.id} resumed successfully`);
          return result;
        })
        .catch(err => {
          console.error(`${LOG_PREFIX} Error resuming consumer ${consumer.id}:`, err);
          throw err;
        });
    };
    
    // Log closing
    const originalClose = instance.close;
    instance.close = function() {
      console.log(`${LOG_PREFIX} Closing RoomClient`);
      return originalClose.apply(this, arguments);
    };
    
    return instance;
  };
  
  console.log(`${LOG_PREFIX} RoomClient logger initialized`);
})();