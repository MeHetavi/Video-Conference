// Worker Logger - Import this in your app.js file where workers are created
// Add to the top: const WorkerLogger = require('./worker-logger');

const LOG_PREFIX = '[MEDIA FLOW]';

class WorkerLogger {
  static logWorkerCreation(workerId, pid) {
    console.log(`${LOG_PREFIX} Mediasoup worker created: ID=${workerId}, PID=${pid}`);
  }
  
  static logWorkerClosed(workerId, pid) {
    console.log(`${LOG_PREFIX} Mediasoup worker closed: ID=${workerId}, PID=${pid}`);
  }
  
  static logWorkerDied(workerId, pid) {
    console.error(`${LOG_PREFIX} Mediasoup worker died: ID=${workerId}, PID=${pid}`);
  }
  
  static logRouterCreation(workerId, routerId) {
    console.log(`${LOG_PREFIX} Router ${routerId} created on worker ${workerId}`);
  }
  
  static logRouterClosed(routerId) {
    console.log(`${LOG_PREFIX} Router ${routerId} closed`);
  }
  
  static logResourceUsage(workerId, pid, usage) {
    console.log(`${LOG_PREFIX} Worker ${workerId} (PID=${pid}) resource usage:`, usage);
  }
  
  static logError(context, workerId, error) {
    console.error(`${LOG_PREFIX} Error in ${context} for worker ${workerId}:`, error);
  }
}

module.exports = WorkerLogger;