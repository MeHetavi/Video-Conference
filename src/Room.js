const config = require('./config')

// In Room.js

module.exports = class Room {
  constructor(room_id, worker, io) {
    this.id = room_id;
    this.worker = worker;
    this.io = io;
    this.peers = new Map();
    this.router = null;

    this._setupRouter();
  }

  async _setupRouter() {
    try {
      this.router = await this.worker.createRouter({ mediaCodecs: config.mediasoup.router.mediaCodecs });
    } catch (error) {
      throw error;
    }
  }

  addPeer(peer) {
    this.peers.set(peer.id, peer);
  }

  getProducerListForPeer() {
    let producerList = []
    this.peers.forEach((peer) => {
      peer.producers.forEach((producer) => {
        producerList.push({
          producer_id: producer.id
        })
      })
    })
    return producerList
  }

  getRtpCapabilities() {
    return this.router.rtpCapabilities
  }

  async createWebRtcTransport(socket_id) {
    const { maxIncomingBitrate, initialAvailableOutgoingBitrate } = config.mediasoup.webRtcTransport

    const transport = await this.router.createWebRtcTransport({
      listenIps: config.mediasoup.webRtcTransport.listenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate
    })
    if (maxIncomingBitrate) {
      try {
        await transport.setMaxIncomingBitrate(maxIncomingBitrate)
      } catch (error) { }
    }

    transport.on(
      'dtlsstatechange',
      function (dtlsState) {
        if (dtlsState === 'closed') {
          transport.close()
        }
      }.bind(this)
    )

    transport.on('close', () => {
      console.log('Transport close', { name: this.peers.get(socket_id).name })
    })

    this.peers.get(socket_id).addTransport(transport)
    return {
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters
      }
    }
  }

  async connectPeerTransport(socket_id, transport_id, dtlsParameters) {
    if (!this.peers.has(socket_id)) return

    await this.peers.get(socket_id).connectTransport(transport_id, dtlsParameters)
  }

  async produce(socket_id, producerTransportId, rtpParameters, kind) {
    // handle undefined errors
    return new Promise(
      async function (resolve, reject) {
        let producer = await this.peers.get(socket_id).createProducer(producerTransportId, rtpParameters, kind)
        resolve(producer.id)
        this.broadCast(socket_id, 'newProducers', [
          {
            producer_id: producer.id,
            producer_socket_id: socket_id
          }
        ])
      }.bind(this)
    )
  }

  async consume(socket_id, consumer_transport_id, producer_id, rtpCapabilities) {
    // handle nulls
    if (
      !this.router.canConsume({
        producerId: producer_id,
        rtpCapabilities
      })
    ) {
      console.error('can not consume')
      return
    }

    // Find the producer's socket ID
    let producerSocketId = null;
    let mediaType = null;

    // Find which peer owns this producer
    for (const [peerId, peer] of this.peers.entries()) {
      if (peer.producers.has(producer_id)) {
        producerSocketId = peerId;
        // Determine if it's audio or video based on the producer's kind
        const producer = peer.producers.get(producer_id);
        mediaType = producer.kind === 'audio' ? 'audioType' : 'videoType';
        break;
      }
    }

    let { consumer, params } = await this.peers
      .get(socket_id)
      .createConsumer(consumer_transport_id, producer_id, rtpCapabilities)

    consumer.on(
      'producerclose',
      function () {

        this.peers.get(socket_id).removeConsumer(consumer.id)
        // tell client consumer is dead
        this.io.to(socket_id).emit('consumerClosed', {
          consumer_id: consumer.id
        })
      }.bind(this)
    )

    // Add producer socket ID to params
    params.producerSocketId = producerSocketId;
    params.mediaType = mediaType;

    return params
  }

  async removePeer(socket_id) {
    // Check if the peer exists before trying to close it
    if (this.peers.has(socket_id)) {
      this.peers.get(socket_id).close()
      this.peers.delete(socket_id)
    } else {
      console.log(`Peer with ID ${socket_id} not found in room ${this.id}`)
    }
  }

  closeProducer(socket_id, producer_id) {
    this.peers.get(socket_id).closeProducer(producer_id)
  }

  broadCast(socket_id, name, data) {
    for (let otherID of Array.from(this.peers.keys()).filter((id) => id !== socket_id)) {
      this.send(otherID, name, data)
    }
  }

  send(socket_id, name, data) {
    this.io.to(socket_id).emit(name, data)
  }

  getPeers() {
    return this.peers
  }

  toJson() {
    return {
      id: this.id,
      peers: JSON.stringify([...this.peers])
    }
  }
}
