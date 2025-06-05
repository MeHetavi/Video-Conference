// RoomClient Logger - Include this in your HTML
// <script src="room-client-logger.js"></script>

(function () {
  // Original RoomClient class
  const OriginalRoomClient = window.RoomClient;

  // Log prefix
  const LOG_PREFIX = '[MEDIA FLOW]';

  // Override RoomClient to add logging
  window.RoomClient = function (...args) {
    // Create original instance
    const instance = new OriginalRoomClient(...args);

    // Log room joining
    const originalJoin = instance.join;
    instance.join = function () {
      return originalJoin.apply(this, arguments);
    };

    // Log device loading
    const originalLoadDevice = instance.loadDevice;
    instance.loadDevice = function (routerRtpCapabilities) {
      return originalLoadDevice.apply(this, arguments)
        .catch(err => {
          console.error(`${LOG_PREFIX} Error loading device:`, err);
          throw err;
        });
    };

    // Log transport initialization
    const originalInitTransports = instance.initTransports;
    instance.initTransports = function (device) {
      return originalInitTransports.apply(this, arguments)
        .catch(err => {
          console.error(`${LOG_PREFIX} Error initializing transports:`, err);
          throw err;
        });
    };

    // Log media production
    const originalProduce = instance.produce;
    instance.produce = function (type, deviceId) {
      return originalProduce.apply(this, arguments)
        .catch(err => {
          console.error(`${LOG_PREFIX} Error producing ${type}:`, err);
          throw err;
        });
    };

    // Log consumption
    const originalConsume = instance.consume;
    instance.consume = function (producer_id, peer_name) {
      return originalConsume.apply(this, arguments)
        .catch(err => {
          console.error(`${LOG_PREFIX} Error consuming producer ${producer_id}:`, err);
          throw err;
        });
    };

    // Log resuming consumers
    const originalResumeConsumer = instance.resumeConsumer;
    instance.resumeConsumer = function (consumer) {
      return originalResumeConsumer.apply(this, arguments)
        .catch(err => {
          console.error(`${LOG_PREFIX} Error resuming consumer ${consumer.id}:`, err);
          throw err;
        });
    };

    return instance;
  };
})();
