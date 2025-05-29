const config = require('./config')
const fs = require('fs')
const path = require('path')

// In Peer.js
const PeerLogger = require('./peer-logger');
const options = {
  key: fs.readFileSync(path.join(__dirname, config.sslKey), 'utf-8'),
  cert: fs.readFileSync(path.join(__dirname, config.sslCrt), 'utf-8')
}
module.exports = class Peer {
  constructor(socket_id, name, isTrainer = false) {
    this.id = socket_id
    this.name = name
    this.isTrainer = isTrainer
    this.transports = new Map()
    this.consumers = new Map()
    this.producers = new Map()

    PeerLogger.logPeerCreation(this.id, this.name);
  }

  addTransport(transport) {
    this.transports.set(transport.id, transport)
    PeerLogger.logAddTransport(this.id, transport.id);
  }

  async connectTransport(transport_id, dtlsParameters) {
    if (!this.transports.has(transport_id)) {
      throw new Error(`Transport ${transport_id} not found`);
    }

    PeerLogger.logConnectTransport(this.id, transport_id, dtlsParameters);
    await this.transports.get(transport_id).connect({ dtlsParameters });
  }

  async createProducer(producerTransportId, rtpParameters, kind) {
    PeerLogger.logCreateProducer(this.id, producerTransportId, kind);

    //TODO handle null errors
    let producer = await this.transports.get(producerTransportId).produce({
      kind,
      rtpParameters
    })

    this.producers.set(producer.id, producer)
    PeerLogger.logProducerCreated(this.id, producer.id, kind);

    producer.on(
      'transportclose',
      function () {
        producer.close()
        this.producers.delete(producer.id)
      }.bind(this)
    )

    return producer
  }

  async createConsumer(consumer_transport_id, producer_id, rtpCapabilities) {
    let consumerTransport = this.transports.get(consumer_transport_id)

    let consumer = null
    try {
      consumer = await consumerTransport.consume({
        producerId: producer_id,
        rtpCapabilities,
        paused: false //producer.kind === 'video',
      })
    } catch (error) {
      console.error('Consume failed', error)
      return
    }

    if (consumer.type === 'simulcast') {
      await consumer.setPreferredLayers({
        spatialLayer: 2,
        temporalLayer: 2
      })
    }

    this.consumers.set(consumer.id, consumer)

    consumer.on(
      'transportclose',
      function () {
        this.consumers.delete(consumer.id)
      }.bind(this)
    )

    return {
      consumer,
      params: {
        producerId: producer_id,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused
      }
    }
  }

  closeProducer(producer_id) {
    try {
      this.producers.get(producer_id).close()
    } catch (e) {
      console.warn(e)
    }

    this.producers.delete(producer_id)
  }

  getProducer(producer_id) {
    return this.producers.get(producer_id)
  }

  close() {
    this.transports.forEach((transport) => transport.close())
  }

  removeConsumer(consumer_id) {
    this.consumers.delete(consumer_id)
  }

  async restartIce(transport_id) {
    if (!this.transports.has(transport_id)) {
      throw new Error(`Transport ${transport_id} not found`);
    }

    const transport = this.transports.get(transport_id);
    const iceParameters = await transport.restartIce();

    return iceParameters;
  }
}
