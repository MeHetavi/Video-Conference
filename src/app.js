const express = require('express')

const app = express()
const https = require('httpolyglot')
const fs = require('fs')
const mediasoup = require('mediasoup')
const config = require('../../mediasoup-sfu-webrtc-video-rooms/src/config')
const path = require('path')
const Room = require('../../mediasoup-sfu-webrtc-video-rooms/src/Room')
const Peer = require('../../mediasoup-sfu-webrtc-video-rooms/src/Peer')

const options = {
  key: fs.readFileSync(path.join(__dirname, config.sslKey), 'utf-8'),
  cert: fs.readFileSync(path.join(__dirname, config.sslCrt), 'utf-8')
}

const httpsServer = https.createServer(options, app)
const io = require('socket.io')(httpsServer)


app.get('/', (req, res) => {
  res.send('This is not the video conferencing route. Please go to /vc');
});

app.use(express.static(path.join(__dirname, '..', 'public')))

app.get('/:username/:roomId/:isTrainer?', (req, res) => {
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
 * }
 */
let roomList = new Map()

  ; (async () => {
    await createWorkers()
  })()

async function createWorkers() {
  let { numWorkers } = config.mediasoup

  for (let i = 0; i < numWorkers; i++) {
    let worker = await mediasoup.createWorker({
      logLevel: config.mediasoup.worker.logLevel,
      logTags: config.mediasoup.worker.logTags,
      rtcMinPort: config.mediasoup.worker.rtcMinPort,
      rtcMaxPort: config.mediasoup.worker.rtcMaxPort
    })

    worker.on('died', () => {
      console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid)
      setTimeout(() => process.exit(1), 2000)
    })
    workers.push(worker)

    // log worker resource usage
    /*setInterval(async () => {
            const usage = await worker.getResourceUsage();

            console.info('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
        }, 120000);*/
  }
}

io.on('connection', (socket) => {
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
      isTrainer: peer.isTrainer || false
    }));

    // Check if the requesting user is a trainer
    const isTrainer = room.getPeers().get(socket.id)?.isTrainer || false;

    callback({
      participants,
      isTrainer
    });
  })


  socket.on('join', ({ room_id, name, isTrainer }, cb) => {


    if (!roomList.has(room_id)) {
      return cb({
        error: 'Room does not exist'
      })
    }

    // Convert isTrainer to boolean
    const isTrainerBool = isTrainer === '1' || isTrainer === true;

    // Add the peer with trainer status
    roomList.get(room_id).addPeer(new Peer(socket.id, name, isTrainerBool));
    socket.room_id = room_id;

    // Join the socket to the room
    socket.join(room_id);

    // Notify all peers in the room that a new participant has joined
    socket.to(room_id).emit('newPeer', {
      peerId: socket.id,
      name: name,
      isTrainer: isTrainerBool
    });

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

          console.log(`Notified room ${socket.room_id} that peer ${peerName} has left`);
        }
      } catch (error) {
        console.error('Error removing peer on disconnect:', error);
      }
    }
  })

  socket.on('producerClosed', ({ producer_id }) => {

    roomList.get(socket.room_id).closeProducer(socket.id, producer_id)

    // Get the kind (audio/video) of the closed producer
    const peer = roomList.get(socket.room_id).getPeers().get(socket.id)
    const kind = peer ? (producer_id.includes('audio') ? 'audio' : 'video') : null

    // Notify all peers in the room to update their participants list
    if (kind) {
      io.to(socket.room_id).emit('producerStateChanged', {
        peerId: socket.id,
        kind: kind,
        state: 'closed'
      })
    }
  })

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
