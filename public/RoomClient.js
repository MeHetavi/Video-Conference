const mediaType = {
  audio: 'audioType',
  video: 'videoType',
  screen: 'screenType'
}
const _EVENTS = {
  exitRoom: 'exitRoom',
  openRoom: 'openRoom',
  startVideo: 'startVideo',
  stopVideo: 'stopVideo',
  startAudio: 'startAudio',
  stopAudio: 'stopAudio',
  startScreen: 'startScreen',
  stopScreen: 'stopScreen'
}

function updateLayout() {
  const container = document.getElementById('remoteVideos');
  const tiles = Array.from(container.querySelectorAll('.video-container'));
  const count = tiles.length;

  // Reset any previous custom styles
  tiles.forEach(tile => {
    tile.style.gridArea = '';
  });

  // Adjust layout based on number of videos
  if (count === 1) {
    container.style.gridTemplateColumns = '1fr';
    container.style.gridTemplateRows = '1fr';
  } else if (count === 2) {
    container.style.gridTemplateColumns = '1fr 1fr';
    container.style.gridTemplateRows = '1fr';
  } else if (count === 3) {
    container.style.gridTemplateColumns = '1fr 1fr';
    container.style.gridTemplateRows = '1fr 1fr';
    tiles[0].style.gridArea = '1 / 1 / 3 / 2'; // full left col
    tiles[1].style.gridArea = '1 / 2 / 2 / 3'; // top right
    tiles[2].style.gridArea = '2 / 2 / 3 / 3'; // bottom right
  } else if (count === 4) {
    container.style.gridTemplateColumns = '1fr 1fr';
    container.style.gridTemplateRows = '1fr 1fr';
  } else {
    // For more than 4, create a responsive grid
    const columns = Math.ceil(Math.sqrt(count));
    container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${Math.ceil(count / columns)}, 1fr)`;
  }

  // Explicitly set the height of the video container to ensure it stays above controls
  const controlHeight = 80; // Fixed control height
  document.getElementById('videoMedia').style.height = `calc(100vh - ${controlHeight}px)`;

  // Ensure the remote videos container respects this boundary
  container.style.maxHeight = `calc(100vh - ${controlHeight}px)`;
}



class RoomClient {
  constructor(localMediaEl, remoteVideoEl, remoteAudioEl, mediasoupClient, socket, room_id, name, successCallback, isTrainer = '0') {
    this.name = name
    this.localMediaEl = localMediaEl
    this.remoteVideoEl = remoteVideoEl
    this.remoteAudioEl = remoteAudioEl
    this.mediasoupClient = mediasoupClient
    this.isTrainer = isTrainer === '1'
    this.socket = socket
    this.producerTransport = null
    this.consumerTransport = null
    this.device = null
    this.room_id = room_id

    // Store the callback
    this._roomOpenCallback = successCallback

    this.isVideoOnFullScreen = false
    this.isDevicesVisible = false

    this.consumers = new Map()
    this.producers = new Map()


    this.participants = [];
    this.getParticipants()
    /**
     * map that contains a mediatype as key and producer_id as value
     */
    this.producerLabel = new Map()

    this._isOpen = false
    this.eventListeners = new Map()

    Object.keys(_EVENTS).forEach(
      function (evt) {
        this.eventListeners.set(evt, [])
      }.bind(this)
    )

    // Add window resize handler
    window.addEventListener('resize', () => {
      updateLayout();
    });

    // Initialize local video position
    this.localVideoPosition = 'top-right'; // Default position

    this.createRoom(room_id).then(
      async function () {
        await this.join(name, room_id, isTrainer)
        this.initSockets()
        this._isOpen = true
        // Call the callback
        if (typeof this._roomOpenCallback === 'function') {
          this._roomOpenCallback()
        }
      }.bind(this)
    )
  }

  ////////// INIT /////////

  async createRoom(room_id) {
    await this.socket
      .request('createRoom', {
        room_id
      })
      .catch((err) => {
        console.log('Create room error:', err)
      })
  }

  async join(name, room_id, isTrainer) {
    socket
      .request('join', {
        name,
        room_id,
        isTrainer
      })
      .then(
        async function (e) {
          const video = document.createElement('video');
          video.autoplay = true;
          video.playsInline = true;
          video.id = socket.id;
          document.getElementById('localMedia').appendChild(video);

          try {
            const data = await this.socket.request('getRouterRtpCapabilities');
            let device = await this.loadDevice(data);
            this.device = device;

            await this.initTransports(device);

            // Process any pending producers that arrived before device was ready
            if (this._pendingProducers && this._pendingProducers.length > 0) {
              const producers = [...this._pendingProducers];
              this._pendingProducers = [];

              for (let { producer_id } of producers) {
                await this.consume(producer_id);
              }
            }

            this.socket.emit('getProducers');
          } catch (err) {
            console.error('Error during join:', err);
          }
        }.bind(this)
      )
      .catch((err) => {
        console.log('Join error:', err);
      });
  }

  // Inside your client code
  async getParticipants() {
    try {
      const data = await this.socket.request('getParticipants', { room_id: this.room_id });

      if (data.error) {
        console.error('Error fetching participants:', data.error);
        return;
      }

      this.participants = data.participants;
      this.isTrainer = data.isTrainer;

      // Update the UI with the new data
      this.updateParticipantsList();

      // Debug participants info
      this.debugParticipants();
    } catch (err) {
      console.error('Failed to fetch participants:', err);
    }
  }

  debugParticipants() {
    // Check DOM elements
    const participantsList = document.getElementById('participantsList');
    const participantsCount = document.getElementById('participantsCount');

    if (participantsList) {
      console.log('DOM participant IDs:', Array.from(participantsList.children).map(el => el.dataset.peerId));
    }

    console.groupEnd();
  }

  updateParticipantsList() {
    const participantsList = document.getElementById('participantsList');
    const participantsCount = document.getElementById('participantsCount');

    if (!participantsList) {
      console.warn('Participants list element not found');
      return;
    }

    // Clear the current list
    participantsList.innerHTML = '';

    // Ensure participants array exists
    if (!this.participants) {
      this.participants = [];
      console.warn('Participants array was undefined, initialized to empty array');
    }

    // Update the count
    if (participantsCount) {
      participantsCount.textContent = `${this.participants.length} users`;
    }


    // Create participant items
    this.participants.forEach(participant => {
      // Check media status for this participant
      const hasAudio = this.hasProducer(participant.socketId, mediaType.audio);
      const hasVideo = this.hasProducer(participant.socketId, mediaType.video);
      const isCurrentUser = participant.socketId === this.socket.id;

      const participantItem = document.createElement('div');
      participantItem.className = 'participant-item';
      participantItem.dataset.peerId = participant.socketId;

      let participantHTML = `
        <div class="participant-info">
          <div class="participant-name">
            ${participant.name}
            ${isCurrentUser ? '<span class="you-indicator">You</span>' : ''}
            ${participant.isTrainer ? '<span class="trainer-indicator">Trainer</span>' : ''}
          </div>
          <div class="participant-status">
            <span class="status-icon ${hasAudio ? 'active' : 'inactive'}">
              <i class="fas ${hasAudio ? 'fa-microphone' : 'fa-microphone-slash'}"></i>
            </span>
            <span class="status-icon ${hasVideo ? 'active' : 'inactive'}">
              <i class="fas ${hasVideo ? 'fa-video' : 'fa-video-slash'}"></i>
            </span>
          </div>
        </div>
      `;

      // Add remove button if current user is trainer and this is not another trainer
      if (this.isTrainer && !isCurrentUser && !participant.isTrainer) {
        participantHTML += `
          <div class="participant-actions">
            <button class="action-btn remove" data-peer-id="${participant.socketId}">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;
      }

      participantItem.innerHTML = participantHTML;
      participantsList.appendChild(participantItem);

      // Add event listener to remove button
      if (this.isTrainer && !isCurrentUser && !participant.isTrainer) {
        const removeBtn = participantItem.querySelector('.remove');
        if (removeBtn) {
          removeBtn.addEventListener('click', () => {
            this.kickParticipant(participant.socketId);
          });
        }
      }
    });

    // Show the participants panel button
    const participantsButton = document.getElementById('participantsButton');
    const toggleParticipantsBtn = document.getElementById('toggleParticipantsBtn');

    if (participantsButton) participantsButton.classList.remove('hidden');
    if (toggleParticipantsBtn) toggleParticipantsBtn.classList.remove('hidden');
  }

  hasProducer(socketId, type) {

    // For local user
    if (socketId === socket.id) {
      const hasProducer = this.producerLabel.has(type);
      return hasProducer;
    }

    // For remote users
    for (const [consumerId, consumer] of this.consumers.entries()) {
      // Log the consumer data for debugging

      // Check if this consumer belongs to the specified socket and is of the right type
      if (consumer.appData &&
        consumer.appData.producerSocketId === socketId) {

        // For audio
        if (type === mediaType.audio && consumer.kind === 'audio') {
          return true;
        }

        // For video
        if ((type === mediaType.video || type === mediaType.screen) &&
          consumer.kind === 'video') {
          return true;
        }
      }
    }

    return false;
  }

  async loadDevice(routerRtpCapabilities) {
    let device;
    try {
      device = new this.mediasoupClient.Device();
    } catch (error) {
      if (error.name === 'UnsupportedError') {
        console.error('Browser not supported');
        alert('Browser not supported');
      }
      console.error(error);
      throw error;
    }

    try {
      await device.load({
        routerRtpCapabilities
      });
      return device;
    } catch (error) {
      console.error('Failed to load device:', error);
      throw error;
    }
  }

  async initTransports(device) {
    // init producerTransport
    {
      const data = await this.socket.request('createWebRtcTransport', {
        forceTcp: false,
        rtpCapabilities: device.rtpCapabilities
      })

      if (data.error) {
        console.error(data.error)
        return
      }

      this.producerTransport = device.createSendTransport(data)

      this.producerTransport.on(
        'connect',
        async function ({ dtlsParameters }, callback, errback) {
          this.socket
            .request('connectTransport', {
              dtlsParameters,
              transport_id: data.id
            })
            .then(callback)
            .catch(errback)
        }.bind(this)
      )

      this.producerTransport.on(
        'produce',
        async function ({ kind, rtpParameters }, callback, errback) {
          try {
            const { producer_id } = await this.socket.request('produce', {
              producerTransportId: this.producerTransport.id,
              kind,
              rtpParameters
            })
            callback({
              id: producer_id
            })
          } catch (err) {
            errback(err)
          }
        }.bind(this)
      )

      this.producerTransport.on(
        'connectionstatechange',
        function (state) {
          switch (state) {
            case 'connecting':
              break

            case 'connected':
              //localVideo.srcObject = stream
              break

            case 'failed':
              this.producerTransport.close()
              break

            default:
              break
          }
        }.bind(this)
      )
    }

    // init consumerTransport
    {
      const data = await this.socket.request('createWebRtcTransport', {
        forceTcp: false
      })

      if (data.error) {
        console.error(data.error)
        return
      }

      // only one needed
      this.consumerTransport = device.createRecvTransport(data)
      this.consumerTransport.on(
        'connect',
        function ({ dtlsParameters }, callback, errback) {
          this.socket
            .request('connectTransport', {
              transport_id: this.consumerTransport.id,
              dtlsParameters
            })
            .then(callback)
            .catch(errback)
        }.bind(this)
      )

      this.consumerTransport.on(
        'connectionstatechange',
        async function (state) {
          switch (state) {
            case 'connecting':
              break

            case 'connected':
              //remoteVideo.srcObject = await stream;
              //await socket.request('resume');
              break

            case 'failed':
              this.consumerTransport.close()
              break

            default:
              break
          }
        }.bind(this)
      )
    }
  }

  initSockets() {
    this.socket.on(
      'consumerClosed',
      function ({ consumer_id }) {
        console.log('Closing consumer:', consumer_id)
        this.removeConsumer(consumer_id)
      }.bind(this)
    )

    /**
     * data: [ {
     *  producer_id:
     *  producer_socket_id:
     * }]
     */
    this.socket.on(
      'newProducers',
      async function (data) {
        console.log('New producers', data);

        // Make sure device is initialized before consuming
        if (!this.device || !this.device.rtpCapabilities) {
          console.warn('Device not initialized yet, cannot consume new producers');
          // Store producers to consume later
          this._pendingProducers = this._pendingProducers || [];
          this._pendingProducers.push(...data);
          return;
        }

        for (let { producer_id } of data) {
          await this.consume(producer_id);
        }

        // Refresh participants list when new producers are added
        this.getParticipants();
      }.bind(this)
    )

    // Add event listener for when participants join/leave
    this.socket.on(
      'peerClosed',
      function (data) {
        console.log('Peer closed event received:', data);

        // Store the name of the participant who left before updating the list
        let leftParticipantName = 'Unknown';
        if (this.participants) {
          const leftParticipant = this.participants.find(p => p.socketId === data.peerId);
          if (leftParticipant && leftParticipant.name) {
            leftParticipantName = leftParticipant.name;
          } else if (data.name) {
            leftParticipantName = data.name;
          }
        }

        // Remove the participant from our local list immediately
        if (this.participants) {
          this.participants = this.participants.filter(p => p.socketId !== data.peerId);

          // Update the UI with our local data first for immediate feedback
          this.updateParticipantsList();
        }

        // Then fetch the latest participants list from the server to ensure consistency
        this.getParticipants();

        console.log(`Participant ${leftParticipantName} (${data.peerId}) has left the room`);
      }.bind(this)
    )

    this.socket.on(
      'disconnect',
      function () {
        this.exit(true)
      }.bind(this)
    )

    // Add event listener for when a new peer joins
    this.socket.on(
      'newPeer',
      function (data) {
        console.log('New peer joined:', data)
        // Refresh the participants list
        this.getParticipants()
      }.bind(this)
    )

    // Add event listener for producer state changes
    this.socket.on(
      'producerStateChanged',
      function (data) {
        console.log('Producer state changed:', data)
        // Refresh the participants list
        this.getParticipants()
      }.bind(this)
    )

    // Add event listener for being kicked from the room
    this.socket.on(
      'kickedFromRoom',
      function () {
        alert('You have been removed from the room by the admin.')
        this.exit(true) // Force exit to return to home screen
      }.bind(this)
    )
  }

  //////// MAIN FUNCTIONS /////////////

  async produce(type, deviceId = null) {
    let mediaConstraints = {}
    let audio = false
    let screen = false
    switch (type) {
      case mediaType.audio:
        mediaConstraints = {
          audio: {
            deviceId: deviceId
          },
          video: false
        }
        audio = true
        break
      case mediaType.video:
        mediaConstraints = {
          audio: false,
          video: {
            width: {
              min: 640,
              ideal: 1920
            },
            height: {
              min: 400,
              ideal: 1080
            },
            deviceId: deviceId
            /*aspectRatio: {
                            ideal: 1.7777777778
                        }*/
          }
        }
        break
      case mediaType.screen:
        mediaConstraints = false
        screen = true
        break
      default:
        return
    }
    if (!this.device.canProduce('video') && !audio) {
      console.error('Cannot produce video')
      return
    }
    if (this.producerLabel.has(type)) {
      console.log('Producer already exists for this type ' + type)
      return
    }
    console.log('Mediacontraints:', mediaConstraints)
    let stream
    try {
      stream = screen
        ? await navigator.mediaDevices.getDisplayMedia()
        : await navigator.mediaDevices.getUserMedia(mediaConstraints)
      console.log(navigator.mediaDevices.getSupportedConstraints())

      const track = audio ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0]
      const params = {
        track
      }
      if (!audio && !screen) {
        params.encodings = [
          {
            rid: 'r0',
            maxBitrate: 100000,
            //scaleResolutionDownBy: 10.0,
            scalabilityMode: 'S1T3'
          },
          {
            rid: 'r1',
            maxBitrate: 300000,
            scalabilityMode: 'S1T3'
          },
          {
            rid: 'r2',
            maxBitrate: 900000,
            scalabilityMode: 'S1T3'
          }
        ]
        params.codecOptions = {
          videoGoogleStartBitrate: 1000
        }
      }
      producer = await this.producerTransport.produce({
        track,
        encodings: params.encodings,
        codecOptions: params.codecOptions,
        codec: params.codec,
        appData: {
          socketId: socket.id,
          mediaType: type
        }
      })

      console.log('Producer', producer)

      this.producers.set(producer.id, producer)

      let elem
      if (!audio) {
        elem = this.localMediaEl.querySelector('video');
        if (elem) {
          // Clear any existing content in localMediaEl
          this.localMediaEl.innerHTML = '';

          // Create a container for the video and its overlay
          const container = document.createElement('div');
          container.className = 'video-container';
          container.id = `container-local`;

          // Create the video element
          elem = document.createElement('video');
          elem.srcObject = stream;
          elem.id = this.socket.id;
          elem.playsinline = false;
          elem.autoplay = true;
          elem.className = 'vid';

          // Create an overlay for the name and trainer tag
          const overlay = document.createElement('div');
          overlay.className = 'video-overlay';

          // Set the overlay content
          overlay.innerHTML = `
            <div class="video-info">
              <span class="video-name">${this.name}</span>
              ${this.isTrainer ? '<span class="video-trainer-badge">Trainer</span>' : ''}
            </div>
          `;

          // Add the video and overlay to the container
          container.appendChild(elem);
          container.appendChild(overlay);

          // Add the container to the local media element
          this.localMediaEl.appendChild(container);

          this.handleFS(elem.id);

          // Initialize draggable functionality
          this.initDraggableLocalVideo();
        }
      }

      producer.on('trackended', () => {
        this.closeProducer(type)
      })

      producer.on('transportclose', () => {
        console.log('Producer transport close')
        if (!audio) {
          elem.srcObject.getTracks().forEach(function (track) {
            track.stop()
          })
          elem.parentNode.removeChild(elem)
        }
        this.producers.delete(producer.id)
      })

      producer.on('close', () => {
        console.log('Closing producer')
        if (!audio) {
          elem.srcObject.getTracks().forEach(function (track) {
            track.stop()
          })

          // elem = this.localMediaEl.querySelector('video');
          if (elem) {
            elem.srcObject = null;
            elem.play(); // ensure video starts playing
          }
        }
        this.producers.delete(producer.id)
      })

      this.producerLabel.set(type, producer.id)

      switch (type) {
        case mediaType.audio:
          this.event(_EVENTS.startAudio)
          break
        case mediaType.video:
          this.event(_EVENTS.startVideo)
          break
        case mediaType.screen:
          this.event(_EVENTS.startScreen)
          break
        default:
          return
      }

      // Update participants list to reflect the new producer state
      this.getParticipants()
    } catch (err) {
      console.log('Produce error:', err)
    }
  }

  async consume(producer_id) {
    try {
      // Check if device is initialized
      if (!this.device || !this.device.rtpCapabilities) {
        console.error('Device not initialized yet, cannot consume');
        return;
      }

      const consumeResult = await this.getConsumeStream(producer_id);
      if (!consumeResult) {
        console.error('Failed to get consume stream');
        return;
      }

      const { consumer, stream, kind, appData } = consumeResult;

      // Store the consumer with its metadata
      this.consumers.set(consumer.id, consumer);

      let elem;
      if (kind === 'video') {
        // Create a container for the video and its overlay
        const container = document.createElement('div');
        container.className = 'video-container';
        container.id = `container-${consumer.id}`;

        // Create the video element
        elem = document.createElement('video');
        elem.srcObject = stream;
        elem.id = consumer.id;
        elem.playsinline = false;
        elem.autoplay = true;
        elem.className = 'vid';

        // Create an overlay for the name and trainer tag
        const overlay = document.createElement('div');
        overlay.className = 'video-overlay';

        // Find the participant info based on the producer socket ID
        const participant = this.participants.find(p => p.socketId === appData.producerSocketId);
        const participantName = participant ? participant.name : 'Unknown';
        const isTrainer = participant ? participant.isTrainer : false;

        // Set the overlay content
        overlay.innerHTML = `
          <div class="video-info">
            <span class="video-name">${participantName}</span>
            ${isTrainer ? '<span class="video-trainer-badge">Trainer</span>' : ''}
          </div>
        `;

        // Add the video and overlay to the container
        container.appendChild(elem);
        container.appendChild(overlay);

        // Add the container to the remote videos element
        this.remoteVideoEl.appendChild(container);

        updateLayout(); // Update layout after adding video
        this.handleFS(elem.id);
      } else {
        elem = document.createElement('audio');
        elem.srcObject = stream;
        elem.id = consumer.id;
        elem.playsinline = false;
        elem.autoplay = true;
        this.remoteAudioEl.appendChild(elem);
      }

      consumer.on(
        'trackended',
        function () {
          this.removeConsumer(consumer.id);
        }.bind(this)
      );

      consumer.on(
        'transportclose',
        function () {
          this.removeConsumer(consumer.id);
        }.bind(this)
      );
    } catch (error) {
      console.error('Error in consume:', error);
    }
  }

  async getConsumeStream(producerId) {
    if (!this.device || !this.device.rtpCapabilities) {
      console.error('Device not initialized yet');
      return null;
    }

    const { rtpCapabilities } = this.device;

    try {
      const data = await this.socket.request('consume', {
        rtpCapabilities,
        consumerTransportId: this.consumerTransport.id,
        producerId
      });

      const { id, kind, rtpParameters, producerSocketId } = data;

      // Determine media type based on kind
      const mediaTypeValue = kind === 'audio' ? mediaType.audio : mediaType.video;

      let codecOptions = {};
      const consumer = await this.consumerTransport.consume({
        id,
        producerId,
        kind,
        rtpParameters,
        codecOptions,
        appData: {
          producerSocketId, // Store the socket ID of the producer
          mediaType: mediaTypeValue // Store the media type
        }
      });

      const stream = new MediaStream();
      stream.addTrack(consumer.track);

      console.log(`Created consumer for producer ${producerId}:`, {
        id: consumer.id,
        kind: consumer.kind,
        producerSocketId,
        mediaType: mediaTypeValue
      });

      return {
        consumer,
        stream,
        kind,
        appData: {
          producerSocketId,
          mediaType: mediaTypeValue
        }
      };
    } catch (error) {
      console.error('Error getting consume stream:', error);
      return null;
    }
  }

  closeProducer(type) {
    if (!this.producerLabel.has(type)) {
      console.log('There is no producer for this type ' + type)
      return
    }

    let producer_id = this.producerLabel.get(type)
    console.log('Close producer', producer_id)

    this.socket.emit('producerClosed', {
      producer_id
    })

    this.producers.get(producer_id).close()
    this.producers.delete(producer_id)
    this.producerLabel.delete(type)

    if (type !== mediaType.audio) {
      let elem = document.getElementById(this.socket.id)
      elem.srcObject.getTracks().forEach(function (track) {
        track.stop()
      })
      elem.srcObject = null
    }

    switch (type) {
      case mediaType.audio:
        this.event(_EVENTS.stopAudio)
        break
      case mediaType.video:
        this.event(_EVENTS.stopVideo)
        break
      case mediaType.screen:
        this.event(_EVENTS.stopScreen)
        break
      default:
        return
    }

    // Update participants list to reflect the closed producer
    this.getParticipants()
  }

  pauseProducer(type) {
    if (!this.producerLabel.has(type)) {
      console.log('There is no producer for this type ' + type)
      return
    }

    let producer_id = this.producerLabel.get(type)
    this.producers.get(producer_id).pause()
  }

  resumeProducer(type) {
    if (!this.producerLabel.has(type)) {
      console.log('There is no producer for this type ' + type)
      return
    }

    let producer_id = this.producerLabel.get(type)
    this.producers.get(producer_id).resume()
  }

  removeConsumer(consumer_id) {
    // Find the container element
    const container = document.getElementById(`container-${consumer_id}`);
    if (container) {
      // Remove the container and all its children
      container.parentNode.removeChild(container);
    } else {
      // Fallback to the old method if container not found
      let elem = document.getElementById(consumer_id);
      if (elem) {
        elem.srcObject.getTracks().forEach(function (track) {
          track.stop();
        });
        elem.parentNode.removeChild(elem);
      }
    }

    updateLayout(); // Update layout after removing video
    this.consumers.delete(consumer_id);
  }

  exit(offline = false) {
    let clean = function () {
      this._isOpen = false
      this.consumerTransport.close()
      this.producerTransport.close()
      this.socket.off('disconnect')
      this.socket.off('newProducers')
      this.socket.off('consumerClosed')
    }.bind(this)

    if (!offline) {
      this.socket
        .request('exitRoom')
        .then((e) => console.log(e))
        .catch((e) => console.warn(e))
        .finally(
          function () {
            clean()
          }.bind(this)
        )
    } else {
      clean()
    }

    this.event(_EVENTS.exitRoom)
  }

  ///////  HELPERS //////////

  async roomInfo() {
    let info = await this.socket.request('getMyRoomInfo')
    return info
  }

  static get mediaType() {
    return mediaType
  }

  event(evt) {
    if (this.eventListeners.has(evt)) {
      this.eventListeners.get(evt).forEach((callback) => callback())
    }
  }

  on(evt, callback) {
    this.eventListeners.get(evt).push(callback)
  }

  //////// GETTERS ////////

  isOpen() {
    return this._isOpen
  }

  static get EVENTS() {
    return _EVENTS
  }

  //////// UTILITY ////////

  copyURL() {
    let tmpInput = document.createElement('input')
    document.body.appendChild(tmpInput)
    tmpInput.value = window.location.href
    tmpInput.select()
    document.execCommand('copy')
    document.body.removeChild(tmpInput)
    console.log('URL copied to clipboard 👍')
  }

  showDevices() {
    if (!this.isDevicesVisible) {
      reveal(devicesList)
      this.isDevicesVisible = true
    } else {
      hide(devicesList)
      this.isDevicesVisible = false
    }
  }

  handleFS(id) {
    let videoPlayer = document.getElementById(id);
    if (!videoPlayer) return;

    // Get the container if it exists
    const container = videoPlayer.closest('.video-container');
    const elementToFullscreen = container || videoPlayer;

    elementToFullscreen.addEventListener('fullscreenchange', (e) => {
      if (videoPlayer.controls) return;
      let fullscreenElement = document.fullscreenElement;
      if (!fullscreenElement) {
        elementToFullscreen.style.pointerEvents = 'auto';
        this.isVideoOnFullScreen = false;
      }
    });

    elementToFullscreen.addEventListener('webkitfullscreenchange', (e) => {
      if (videoPlayer.controls) return;
      let webkitIsFullScreen = document.webkitIsFullScreen;
      if (!webkitIsFullScreen) {
        elementToFullscreen.style.pointerEvents = 'auto';
        this.isVideoOnFullScreen = false;
      }
    });

    elementToFullscreen.addEventListener('click', (e) => {
      if (videoPlayer.controls) return;
      if (!this.isVideoOnFullScreen) {
        if (elementToFullscreen.requestFullscreen) {
          elementToFullscreen.requestFullscreen();
        } else if (elementToFullscreen.webkitRequestFullscreen) {
          elementToFullscreen.webkitRequestFullscreen();
        } else if (elementToFullscreen.msRequestFullscreen) {
          elementToFullscreen.msRequestFullscreen();
        }
        this.isVideoOnFullScreen = true;
        elementToFullscreen.style.pointerEvents = 'none';
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        this.isVideoOnFullScreen = false;
        elementToFullscreen.style.pointerEvents = 'auto';
      }
    });
  }

  async kickParticipant(peerId) {
    try {
      const result = await this.socket.request('kickParticipant', { peerId })
      if (result.error) {
        console.error('Failed to kick participant:', result.error)
      } else {
        // Refresh the participants list after successful kick
        this.getParticipants()
      }
    } catch (err) {
      console.error('Error kicking participant:', err)
    }
  }

  // Add this method to make the local video draggable
  initDraggableLocalVideo() {
    const localVideo = document.getElementById('localMedia');
    if (!localVideo) return;

    // Add corner position indicator and controls
    const cornerControls = document.createElement('div');
    cornerControls.className = 'corner-controls';
    cornerControls.innerHTML = `
      <div class="corner-control top-left" data-position="top-left"></div>
      <div class="corner-control top-right" data-position="top-right"></div>
      <div class="corner-control bottom-left" data-position="bottom-left"></div>
      <div class="corner-control bottom-right" data-position="bottom-right"></div>
    `;

    // Add drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '<i class="fas fa-arrows-alt"></i>';

    localVideo.appendChild(cornerControls);
    localVideo.appendChild(dragHandle);

    // Add event listeners to corner controls
    const controls = cornerControls.querySelectorAll('.corner-control');
    controls.forEach(control => {
      control.addEventListener('click', () => {
        const position = control.dataset.position;
        this.moveLocalVideoToCorner(position);
      });
    });

    // Variables for drag functionality
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    // Make the local video draggable
    dragHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(window.getComputedStyle(localVideo).left);
      startTop = parseInt(window.getComputedStyle(localVideo).top);

      // Add dragging class
      localVideo.classList.add('dragging');

      // Prevent default behavior
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Calculate new position
      let newLeft = startLeft + dx;
      let newTop = startTop + dy;

      // Apply constraints to keep within viewport
      const maxLeft = window.innerWidth - localVideo.offsetWidth;
      const maxTop = window.innerHeight - localVideo.offsetHeight;

      newLeft = Math.max(0, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));

      // Update position
      localVideo.style.left = `${newLeft}px`;
      localVideo.style.top = `${newTop}px`;

      // Remove any position classes
      localVideo.classList.remove('top-left', 'top-right', 'bottom-left', 'bottom-right');
      this.localVideoPosition = 'custom';
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;

      // Remove dragging class
      localVideo.classList.remove('dragging');

      // Snap to nearest corner
      this.snapToNearestCorner();
    });

    // Initial position
    this.moveLocalVideoToCorner(this.localVideoPosition);
  }

  // Method to move local video to a specific corner
  moveLocalVideoToCorner(position) {
    const localVideo = document.getElementById('localMedia');
    if (!localVideo) return;

    // Remove all position classes
    localVideo.classList.remove('top-left', 'top-right', 'bottom-left', 'bottom-right', 'custom');

    // Add the new position class
    localVideo.classList.add(position);

    // Reset inline styles
    localVideo.style.left = '';
    localVideo.style.top = '';

    // Store current position
    this.localVideoPosition = position;

    // Update active state in controls
    const controls = localVideo.querySelectorAll('.corner-control');
    controls.forEach(control => {
      if (control.dataset.position === position) {
        control.classList.add('active');
      } else {
        control.classList.remove('active');
      }
    });
  }

  // Method to snap to the nearest corner when dragging ends
  snapToNearestCorner() {
    const localVideo = document.getElementById('localMedia');
    if (!localVideo) return;

    const rect = localVideo.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Determine which corner is closest
    const isTop = centerY < windowHeight / 2;
    const isLeft = centerX < windowWidth / 2;

    let position;
    if (isTop && isLeft) position = 'top-left';
    else if (isTop && !isLeft) position = 'top-right';
    else if (!isTop && isLeft) position = 'bottom-left';
    else position = 'bottom-right';

    // Move to that corner
    this.moveLocalVideoToCorner(position);
  }

  // Add a method to restart ICE if needed
  async restartIce(transport) {
    try {
      if (transport.connectionState === 'failed') {
        console.log('Restarting ICE for transport', transport.id);

        // Get new ICE parameters from the server
        const { iceParameters } = await this.socket.request('restartIce', {
          transportId: transport.id
        });

        // Restart ICE
        await transport.restartIce({ iceParameters });
        console.log('ICE restarted for transport', transport.id);
      }
    } catch (error) {
      console.error('Error restarting ICE:', error);
    }
  }
}
