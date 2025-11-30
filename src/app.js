const express = require('express')
// Load environment variables from .env if present
try {
  require('dotenv').config()
} catch {
  // dotenv is optional; ignore if not installed
}
const app = express()
const https = require('httpolyglot')
const fs = require('fs')
const mediasoup = require('mediasoup')
const config = require('./config')
const path = require('path')
const Room = require('./Room')
const Peer = require('./Peer')

const LOG_PREFIX = '[MEDIA FLOW]';

const options = {
  key: fs.readFileSync(path.join(__dirname, config.sslKey), 'utf-8'),
  cert: fs.readFileSync(path.join(__dirname, config.sslCrt), 'utf-8')
}

const httpsServer = https.createServer(options, app)
const io = require('socket.io')(httpsServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

const roomList = new Map()

// Add a map to store captured images for each room
const roomCapturedImages = new Map()

app.get('/', (req, res) => {
  res.send('This is not the video conferencing route. Please go to /:roomId');
});

// Expose runtime configuration for the frontend via a small JS file
app.get('/config.js', (req, res) => {
  const apiBaseUrl = process.env.API_BASE_URL || 'https://prana.ycp.life/api/v1'
  res.type('application/javascript').send(
    `window.API_BASE_URL = '${apiBaseUrl.replace(/'/g, "\\'")}';\n`
  )
})

app.use(express.static(path.join(__dirname, '..', 'public')))

app.get('/:roomId/:username?/:isTrainer?', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

httpsServer.listen(config.listenPort, () => {
  console.log('Listening on https://' + config.listenIp + ':' + config.listenPort)
})

// all mediasoup workers
let workers = []
let nextMediasoupWorkerIdx = 0
  /**
   * roomList
   * {
   *  room_id: Room {
   *      id:
   *      router:
   *      peers: {
   *          id:,
   *          name:,
   *          master: [boolean],
   *          transports: [Map],
   *          producers: [Map],
   *          consumers: [Map],
   *          rtpCapabilities:
   *      }
   *  }
   */

  ; (async () => {
    await createWorkers()
  })()

async function createWorkers() {
  console.log(`${LOG_PREFIX} Creating ${config.mediasoup.numWorkers} mediasoup workers`);

  let { numWorkers } = config.mediasoup;

  for (let i = 0; i < numWorkers; i++) {
    let worker = await mediasoup.createWorker({
      logLevel: config.mediasoup.worker.logLevel,
      logTags: config.mediasoup.worker.logTags,
      rtcMinPort: config.mediasoup.worker.rtcMinPort,
      rtcMaxPort: config.mediasoup.worker.rtcMaxPort
    });

    console.log(`${LOG_PREFIX} Worker ${i} created with PID: ${worker.pid}`);


    worker.on('died', () => {
      console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
      setTimeout(() => process.exit(1), 2000);
    });

    workers.push(worker);
  }

  console.log(`${LOG_PREFIX} All workers created successfully`);
}

io.on('connection', (socket) => {
  console.log(`${LOG_PREFIX} Client connected: ${socket.id}`);

  // Set room_id from query parameters if available
  const query = socket.handshake.query;
  if (query.roomId) {
    socket.room_id = query.roomId;
    console.log(`${LOG_PREFIX} Set room_id from query:`, {
      socketId: socket.id,
      roomId: query.roomId
    });
  }

  socket.on('createRoom', async ({ room_id }, callback) => {
    if (roomList.has(room_id)) {
      callback('already exists')
    } else {
      let worker = await getMediasoupWorker()
      roomList.set(room_id, new Room(room_id, worker, io))
      callback(room_id)
    }
  })

  socket.on('getParticipants', ({ room_id }, callback) => {
    const room = roomList.get(room_id);
    if (!room) {
      return callback({ error: 'Room not found' });
    }

    const peers = Array.from(room.getPeers().values());
    const participants = peers.map(peer => ({
      socketId: peer.id,
      name: peer.name,
      isTrainer: peer.isTrainer || false,
      profile_pic: peer.profile_pic || null
    }));

    // Check if the requesting user is a trainer
    const isTrainer = room.getPeers().get(socket.id)?.isTrainer || false;

    callback({
      participants,
      isTrainer
    });
  })


  socket.on('join', ({ room_id, name, isTrainer, profile_pic }, cb) => {
    if (!roomList.has(room_id)) {
      return cb({
        error: 'Room does not exist'
      })
    }

    // Convert isTrainer to boolean
    const isTrainerBool = isTrainer === '1' || isTrainer === true;

    // Add the peer with trainer status and profile picture
    roomList.get(room_id).addPeer(new Peer(socket.id, name, isTrainerBool, profile_pic || null));
    socket.room_id = room_id;

    // Join the socket to the room
    socket.join(room_id);

    // Notify all peers in the room that a new participant has joined
    socket.to(room_id).emit('newPeer', {
      peerId: socket.id,
      name: name,
      isTrainer: isTrainerBool,
      profile_pic: profile_pic || null
    });

    // Send all captured images to the new user
    const roomImages = roomCapturedImages.get(room_id) || [];
    socket.emit('loadCapturedImages', roomImages);

    cb(roomList.get(room_id).toJson());
  })

  socket.on('getProducers', () => {
    if (!roomList.has(socket.room_id)) return

    // send all the current producer to newly joined member
    let producerList = roomList.get(socket.room_id).getProducerListForPeer()

    socket.emit('newProducers', producerList)
  })

  socket.on('getRouterRtpCapabilities', (_, callback) => {


    try {
      callback(roomList.get(socket.room_id).getRtpCapabilities())
    } catch (e) {
      callback({
        error: e.message
      })
    }
  })

  socket.on('createWebRtcTransport', async (_, callback) => {


    try {
      const { params } = await roomList.get(socket.room_id).createWebRtcTransport(socket.id)

      callback(params)
    } catch (err) {
      console.error(err)
      callback({
        error: err.message
      })
    }
  })

  socket.on('connectTransport', async ({ transport_id, dtlsParameters }, callback) => {

    if (!roomList.has(socket.room_id)) return
    await roomList.get(socket.room_id).connectPeerTransport(socket.id, transport_id, dtlsParameters)

    callback('success')
  })

  socket.on('produce', async ({ kind, rtpParameters, producerTransportId }, callback) => {
    if (!roomList.has(socket.room_id)) {
      return callback({ error: 'not is a room' })
    }

    let producer_id = await roomList.get(socket.room_id).produce(socket.id, producerTransportId, rtpParameters, kind)



    // Notify all peers in the room to update their participants list
    io.to(socket.room_id).emit('producerStateChanged', {
      peerId: socket.id,
      kind: kind,
      state: 'added'
    })

    callback({
      producer_id
    })
  })

  socket.on('consume', async ({ consumerTransportId, producerId, rtpCapabilities }, callback) => {
    //TODO null handling
    let params = await roomList.get(socket.room_id).consume(socket.id, consumerTransportId, producerId, rtpCapabilities)



    callback(params)
  })

  socket.on('resume', async (data, callback) => {
    await consumer.resume()
    callback()
  })

  socket.on('getMyRoomInfo', (_, cb) => {
    cb(roomList.get(socket.room_id).toJson())
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    if (!socket.room_id) return;

    // Get the room and remove the peer
    const room = roomList.get(socket.room_id);
    if (room) {
      try {
        // Check if the peer exists before removing
        if (room.getPeers().has(socket.id)) {
          // Get the peer's name before removing
          const peerName = room.getPeers().get(socket.id).name;
          console.log(`Removing peer ${peerName} (${socket.id}) from room ${socket.room_id}`);

          room.removePeer(socket.id);

          // Notify other peers that this peer has left
          io.to(socket.room_id).emit('peerClosed', {
            peerId: socket.id,
            name: peerName
          });

          // If room is empty, clean up captured images
          if (room.getPeers().size === 0) {
            roomCapturedImages.delete(socket.room_id);
          }

          console.log(`Notified room ${socket.room_id} that peer ${peerName} has left`);
        }
      } catch (error) {
        console.error('Error removing peer on disconnect:', error);
      }
    }
  })

  socket.on('producerClosed', ({ producer_id }) => {
    if (!socket.room_id || !producer_id) {
      console.warn('Invalid room_id or producer_id in producerClosed event');
      return;
    }

    const room = roomList.get(socket.room_id);
    if (!room) {
      console.warn(`Room ${socket.room_id} not found`);
      return;
    }

    room.closeProducer(socket.id, producer_id);

    // Get the kind (audio/video) of the closed producer
    const peer = room.getPeers().get(socket.id);
    const kind = peer ? (producer_id.includes('audio') ? 'audio' : 'video') : null;

    // Notify all peers in the room to update their participants list
    if (kind) {
      io.to(socket.room_id).emit('producerStateChanged', {
        peerId: socket.id,
        kind: kind,
        state: 'closed'
      });
    }
  });

  socket.on('exitRoom', async (_, callback) => {
    console.log('Client exiting room:', socket.id);

    if (!roomList.has(socket.room_id)) {
      callback({
        error: 'not currently in a room'
      });
      return;
    }

    const room = roomList.get(socket.room_id);

    // Get the peer's name before removing
    let peerName = 'Unknown';
    if (room.getPeers().has(socket.id)) {
      peerName = room.getPeers().get(socket.id).name;
    }

    // Close transports
    await room.removePeer(socket.id);

    // Notify other peers that this peer has left
    socket.to(socket.room_id).emit('peerClosed', {
      peerId: socket.id,
      name: peerName
    });

    console.log(`Notified room ${socket.room_id} that peer ${peerName} has left`);

    // Check if room is empty and clean up if needed
    if (room.getPeers().size === 0) {
      console.log(`Room ${socket.room_id} is empty, removing it`);
      roomList.delete(socket.room_id);
    }

    const oldRoomId = socket.room_id;
    socket.room_id = null;

    callback(`Successfully exited room ${oldRoomId}`);
  })

  socket.on('kickParticipant', async ({ peerId }, callback) => {
    if (!socket.room_id) {
      return callback({ error: 'Not in a room' });
    }

    const room = roomList.get(socket.room_id);
    if (!room) {
      return callback({ error: 'Room not found' });
    }

    // Check if the requester is a trainer
    const isTrainer = room.getPeers().get(socket.id)?.isTrainer || false;

    if (!isTrainer) {
      return callback({ error: 'Not authorized' });
    }

    // Check if the peer to kick exists in the room
    if (!room.getPeers().has(peerId)) {
      return callback({ error: 'Participant not found in room' });
    }

    // Don't allow kicking another trainer
    if (room.getPeers().get(peerId)?.isTrainer) {
      return callback({ error: 'Cannot kick another trainer' });
    }

    // Get the socket of the participant to kick
    const peerToKick = io.sockets.sockets.get(peerId);
    if (peerToKick) {
      // Notify the participant they're being kicked
      peerToKick.emit('kickedFromRoom');
    }

    try {
      // Remove the peer from the room
      await room.removePeer(peerId);

      // Notify other peers that this peer has left
      socket.to(socket.room_id).emit('peerClosed', {
        peerId: peerId
      });

      callback({ success: true });
    } catch (error) {
      console.error('Error removing peer:', error);
      callback({ error: 'Failed to remove participant' });
    }
  })

  socket.on('restartIce', async ({ transportId }, callback) => {
    try {
      if (!socket.room_id) {
        return callback({ error: 'not in a room' });
      }

      const room = roomList.get(socket.room_id);
      if (!room) {
        return callback({ error: 'room not found' });
      }

      const peer = room.getPeers().get(socket.id);
      if (!peer) {
        return callback({ error: 'peer not found' });
      }

      // Find the transport
      let transport;
      if (peer.transports.has(transportId)) {
        transport = peer.transports.get(transportId);
      } else {
        return callback({ error: 'transport not found' });
      }

      // Restart ICE
      const iceParameters = await transport.restartIce();
      callback({ iceParameters });

      console.log(`ICE restarted for transport ${transportId} (peer: ${socket.id})`);
    } catch (error) {
      console.error('Error restarting ICE:', error);
      callback({ error: error.message });
    }
  });

  // Add handler for capturing and broadcasting images
  socket.on('captureAndBroadcastImage', ({ imageData, timestamp }) => {
    console.log(`${LOG_PREFIX} Received image capture broadcast request from:`, socket.id);

    if (!socket.room_id) {
      console.error(`${LOG_PREFIX} No room_id found for socket ${socket.id}`);
      return;
    }

    const room = roomList.get(socket.room_id);
    if (!room) {
      console.error(`${LOG_PREFIX} Room not found:`, socket.room_id);
      return;
    }

    console.log(`${LOG_PREFIX} Room found, storing image for room:`, socket.room_id);

    // Store the captured image in the room's image list
    if (!roomCapturedImages.has(socket.room_id)) {
      console.log(`${LOG_PREFIX} Creating new captured images array for room:`, socket.room_id);
      roomCapturedImages.set(socket.room_id, []);
    }

    const roomImages = roomCapturedImages.get(socket.room_id);
    roomImages.push({
      imageData,
      timestamp,
      capturedBy: socket.id
    });

    // Keep only the last 5 images
    if (roomImages.length > 5) {
      roomImages.shift();
    }

    // Get the number of peers in the room
    const peerCount = room.getPeers().size;
    console.log(`${LOG_PREFIX} Broadcasting image to ${peerCount} peers in room:`, socket.room_id);

    // Broadcast the captured image to all peers in the room
    socket.to(socket.room_id).emit('displayCapturedImage', {
      imageData,
      timestamp,
      capturedBy: socket.id
    });

    console.log(`${LOG_PREFIX} Image broadcast completed for room:`, socket.room_id);
  });
})

// TODO remove - never used?
function room() {
  return Object.values(roomList).map((r) => {
    return {
      router: r.router.id,
      peers: Object.values(r.peers).map((p) => {
        return {
          name: p.name
        }
      }),
      id: r.id
    }
  })
}

/**
 * Get next mediasoup Worker.
 */
function getMediasoupWorker() {
  const worker = workers[nextMediasoupWorkerIdx]

  if (++nextMediasoupWorkerIdx === workers.length) nextMediasoupWorkerIdx = 0

  return worker
}
