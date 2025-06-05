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
  const localVideo = document.getElementById('localMedia');
  const localVideoContainer = localVideo.querySelector('.video-container');
  const remoteTiles = Array.from(container.querySelectorAll('.video-container'));

  // Move local video into the remote videos container if it's not already there
  if (localVideoContainer && localVideoContainer.parentElement !== container) {
    container.appendChild(localVideoContainer);
  }

  // Get all video tiles including local video
  const tiles = Array.from(container.querySelectorAll('.video-container'));

  // Reset any previous custom styles
  tiles.forEach(tile => {
    tile.style.gridArea = '';
    tile.classList.remove('trainer-video', 'local-video', 'other-participant');
  });

  // Clear container classes
  container.classList.remove('trainer-layout', 'standard-layout');

  // Get current user's trainer status
  const currentUserIsTrainer = this.isTrainer;

  if (currentUserIsTrainer == 0) {
    // Special layout for non-trainers
    setupNonTrainerLayout(container, tiles);
  } else {
    // Standard layout for trainers
    setupStandardLayout(container, tiles);
  }

  // Explicitly set the height of the video container to ensure it stays above controls
  const controlHeight = 80; // Fixed control height
  document.getElementById('videoMedia').style.height = `calc(100vh - ${controlHeight}px)`;

  // Ensure the remote videos container respects this boundary
  container.style.maxHeight = `calc(100vh - ${controlHeight}px)`;
}

function setupNonTrainerLayout(container, tiles) {
  container.classList.add('trainer-layout');

  let trainerTile = null;
  let localTile = null;
  const otherTiles = [];

  tiles.forEach(tile => {
    const isLocal = tile.id && tile.id.includes('local-');
    const overlay = tile.querySelector('.video-overlay');
    const isTrainer = overlay && overlay.querySelector('.video-trainer-badge');

    if (isLocal) {
      localTile = tile;
      tile.classList.add('local-video');
    } else if (isTrainer) {
      trainerTile = tile;
      tile.classList.add('trainer-video');
    } else {
      otherTiles.push(tile);
      tile.classList.add('other-participant');
    }
  });

  const hasTrainer = trainerTile !== null;
  const hasLocal = localTile !== null;
  const totalTopTiles = (hasTrainer ? 1 : 0) + (hasLocal ? 1 : 0);
  const hasOthers = otherTiles.length > 0;

  if (totalTopTiles === 0 && hasOthers) {
    setupGridLayout(container, otherTiles);
    return;
  }

  container.innerHTML = '';

  container.style.cssText = `
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    scroll-behavior: smooth;
    height: 100%;
  `;

  const mainSection = document.createElement('div');
  mainSection.className = 'main-video-section';
  mainSection.style.cssText = `
    display: grid;
    gap: 10px;
    padding: 10px;
    box-sizing: border-box;
    flex-shrink: 0;
    width: 100%;
    height: calc(100vh - 80px);
  `;

  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .main-video-section {
        grid-template-columns: 1fr !important;
        grid-template-rows: ${totalTopTiles === 2 ? '1fr 1fr' : '1fr'} !important;
        gap: 8px !important;
        padding: 8px !important;
      }
      .other-participants-scroll-section {
        grid-template-columns: 1fr !important;
        grid-auto-rows: minmax(200px, 1fr) !important;
        gap: 8px !important;
        padding: 8px !important;
      }
    }
    @media (min-width: 769px) {
      .main-video-section {
        grid-template-columns: ${totalTopTiles === 2 ? '1fr 1fr' : '1fr'} !important;
        grid-template-rows: 1fr !important;
      }
    }
  `;
  document.head.appendChild(style);

  if (trainerTile) {
    mainSection.appendChild(trainerTile);
  }
  if (localTile) {
    mainSection.appendChild(localTile);
  }

  container.appendChild(mainSection);

  if (hasOthers) {
    const scrollSection = document.createElement('div');
    scrollSection.className = 'other-participants-scroll-section';
    scrollSection.style.cssText = `
      display: grid;
      gap: 10px;
      padding: 20px 10px;
      width: 100%;
      background-color: rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
    `;

    // Calculate optimal number of columns based on screen width
    const screenWidth = window.innerWidth;
    let columns;
    if (screenWidth <= 480) {
      columns = 1;
    } else if (screenWidth <= 768) {
      columns = 2;
    } else {
      columns = Math.min(3, Math.ceil(Math.sqrt(otherTiles.length)));
    }

    scrollSection.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    scrollSection.style.gridAutoRows = `minmax(200px, 1fr)`;

    otherTiles.forEach(tile => {
      scrollSection.appendChild(tile);
    });

    container.appendChild(scrollSection);
  }
}

function setupStandardLayout(container, tiles) {
  const localVideo = document.getElementById('localMedia');
  const localVideoContainer = localVideo.querySelector('.video-container');
  const remoteTiles = Array.from(container.querySelectorAll('.video-container'));

  if (localVideoContainer && localVideoContainer.parentElement !== container) {
    container.appendChild(localVideoContainer);
  }

  tiles.forEach(tile => {
    tile.style.gridArea = '';
  });

  const count = tiles.length;
  if (count === 1) {
    container.style.gridTemplateColumns = '1fr';
    container.style.gridTemplateRows = '1fr';
  } else if (count === 2) {
    container.style.gridTemplateColumns = '1fr 1fr';
    container.style.gridTemplateRows = '1fr';
  } else if (count === 3) {
    container.style.gridTemplateColumns = '1fr 1fr';
    container.style.gridTemplateRows = '1fr 1fr';
    tiles[0].style.gridArea = '1 / 1 / 3 / 2';
    tiles[1].style.gridArea = '1 / 2 / 2 / 3';
    tiles[2].style.gridArea = '2 / 2 / 3 / 3';
  } else if (count === 4) {
    container.style.gridTemplateColumns = '1fr 1fr';
    container.style.gridTemplateRows = '1fr 1fr';
  } else {
    const columns = Math.ceil(Math.sqrt(count));
    container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${Math.ceil(count / columns)}, 1fr)`;
  }

  const controlHeight = 80;
  document.getElementById('videoMedia').style.height = `calc(100vh - ${controlHeight}px)`;
  container.style.maxHeight = `calc(100vh - ${controlHeight}px)`;
}

function setupGridLayout(container, tiles) {
  const columns = Math.ceil(Math.sqrt(tiles.length));
  container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  container.style.gridTemplateRows = `repeat(${Math.ceil(tiles.length / columns)}, 1fr)`;
}

class RoomClient {
  constructor(localMediaEl, remoteVideoEl, remoteAudioEl, mediasoupClient, socket, room_id, name, successCallback, isTrainer = '0') {
    this.name = name
    this.localMediaEl = localMediaEl
    this.remoteVideoEl = remoteVideoEl
    this.remoteAudioEl = remoteAudioEl
    this.mediasoupClient = mediasoupClient
    this.isTrainer = isTrainer === '1' || isTrainer === true
    this.socket = socket
    this.producerTransport = null
    this.consumerTransport = null
    this.device = null
    this.room_id = room_id
    this.successCallback = successCallback
    this.consumers = new Map()
    this.producers = new Map()
    this.participants = []
    this.getParticipants()
    /**
     * map that contains a mediatype as key and producer_id as value
     */
    this.producerLabel = new Map()
    this.isVideoOnFullScreen = false
    this.isDevicesVisible = false
    this.routerRtpCapabilities = null
    this.recvTransport = null
    this.sendTransport = null
    this.poseDetectionActive = false
    this.poseDetection = null
    this.poseComparisonMode = 'live'
    this.latestCapturedPose = null
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

    // Add new properties for transport recovery
    this.transportRetryCount = 0
    this.maxTransportRetries = 3
    this.transportRetryDelay = 2000 // 2 seconds

    // Add properties for image capture
    this.captureCanvas = document.createElement('canvas')
    this.captureContext = this.captureCanvas.getContext('2d')
    this.capturedImages = new Map() // Store captured images with timestamps

    this.initPoseComparison()

    this.createRoom(room_id).then(
      async function () {
        await this.join(name, room_id, isTrainer)
        this.initSockets()
        this._isOpen = true
        // Call the callback
        if (typeof this.successCallback === 'function') {
          this.successCallback()
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
          // Create a container for the local video
          const container = document.createElement('div');
          container.className = 'video-container';
          container.id = `container-local-${socket.id}`;

          // Create the video element
          const video = document.createElement('video');
          video.autoplay = true;
          video.playsInline = true;
          video.id = socket.id;
          video.className = 'vid';

          // Create an overlay for the name and trainer tag
          const overlay = document.createElement('div');
          overlay.className = 'video-overlay';

          // Set the overlay content
          overlay.innerHTML = `
            <div class="video-info">
              <span class="video-name you-indicator">You</span>
              ${this.isTrainer ? '<span class="video-trainer-badge">Trainer</span>' : ''}
            </div>
          `;

          // Add the video and overlay to the container
          container.appendChild(video);
          container.appendChild(overlay);

          // Add the container to the remote videos container
          document.getElementById('remoteVideos').appendChild(container);

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

            // Update layout after adding local video
            updateLayout();
          } catch (err) {
            console.error('Error during join:', err);
          }
        }.bind(this)
      )
      .catch((err) => {
        console.log('Join error:', err);
      });

    // Create capture button if user is trainer
    this.createCaptureButton()

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
          try {
            await this.socket.request('connectTransport', {
              dtlsParameters,
              transport_id: data.id
            });
            callback();
          } catch (error) {
            errback(error);
          }
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
        async function (state) {
          switch (state) {
            case 'connecting':
              console.log('Producer transport connecting...');
              break;
            case 'connected':
              console.log('Producer transport connected');
              this.transportRetryCount = 0; // Reset retry count on successful connection
              break;
            case 'failed':
              console.log('Producer transport failed');
              await this.handleTransportFailure();
              break;
            case 'disconnected':
              console.log('Producer transport disconnected');
              await this.handleTransportFailure();
              break;
            case 'closed':
              console.log('Producer transport closed');
              await this.handleTransportFailure();
              break;
            default:
              break;
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
        if (data.state == 'closed') {
          document.getElementById('poseDetectionButton').classList.add('hidden')
        }
        else {
          document.getElementById('poseDetectionButton').classList.remove('hidden')
        }
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

    // Add listener for receiving captured images
    this.socket.on('displayCapturedImage', ({ imageData, timestamp, capturedBy }) => {
      console.log('Received captured image from:', capturedBy);
      this.displayCapturedImage(imageData, timestamp, capturedBy);
    });

    // Add listener for loading captured images when joining a room
    this.socket.on('loadCapturedImages', (images) => {
      console.log('Loading captured images:', images.length);
      images.forEach(({ imageData, timestamp, capturedBy }) => {
        this.displayCapturedImage(imageData, timestamp, capturedBy);
      });
    });
  }

  //////// MAIN FUNCTIONS /////////////

  async produce(type, deviceId = null, codec = 'vp8') {
    try {
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
        const producer = await this.producerTransport.produce({
          track,
          encodings: params.encodings,
          codecOptions: params.codecOptions,
          codec: params.codec,
          appData: {
            socketId: socket.id,
            mediaType: type
          }
        })

        console.log('Producer created successfully:', producer.id)

        this.producers.set(producer.id, producer)

        if (!audio) {
          const container = document.getElementById(`container-local-${socket.id}`);
          if (container) {
            const video = container.querySelector('video');
            if (video) {
              video.srcObject = stream;
              video.play().catch(e => console.error('Error playing video:', e));
            }
          }
        }

        producer.on('trackended', () => {
          this.closeProducer(type)
        })

        producer.on('transportclose', () => {
          console.log('Producer transport close')
          if (!audio) {
            stream.getTracks().forEach(function (track) {
              track.stop()
            })
          }
          this.producers.delete(producer.id)
          this.updateCaptureButtonVisibility()
        })

        producer.on('close', () => {
          console.log('Closing producer')
          if (!audio) {
            stream.getTracks().forEach(function (track) {
              track.stop()
            })
          }
          this.producers.delete(producer.id)
          this.updateCaptureButtonVisibility()
        })

        this.producerLabel.set(type, producer.id)
        this.updateCaptureButtonVisibility()

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

        this.getParticipants()
      } catch (err) {
        console.error('Error in produce:', err)
        throw err
      }
    } catch (err) {
      console.error('Produce error:', err)
      // Attempt to recover if it's a transport-related error
      if (err.message && err.message.includes('transport')) {
        await this.handleTransportFailure();
      }
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
        elem.playsinline = true;
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
        document.getElementById('remoteVideos').appendChild(container);

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

      // Update participants list to reflect new video
      this.updateParticipantsList();

      return {
        consumer,
        params: {
          producerId: producer_id,
          id: consumer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          type: consumer.type,
          producerPaused: consumer.producerPaused,
          producerSocketId: appData.producerSocketId,
          mediaType: appData.mediaType
        }
      };
    } catch (error) {
      console.error('Error in consume:', error);
      return null;
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

    const producer = this.producers.get(producer_id)
    if (producer) {
      producer.close()
      this.producers.delete(producer_id)
      this.producerLabel.delete(type)
      this.updateCaptureButtonVisibility()

      if (type !== mediaType.audio) {
        // Find the local video container
        const container = document.getElementById(`container-local-${socket.id}`);
        if (container) {
          const video = container.querySelector('video');
          if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(function (track) {
              track.stop()
            })
            video.srcObject = null;
          }
        }
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
    try {
      const consumer = this.consumers.get(consumer_id);
      if (!consumer) return;

      // Remove the video container
      const container = document.getElementById(`container-${consumer_id}`);
      if (container) {
        container.remove();
      }

      // Remove the consumer
      this.consumers.delete(consumer_id);
      consumer.close();

      // Update the layout
      updateLayout();

      // Update participants list
      this.updateParticipantsList();
    } catch (error) {
      console.error('Error removing consumer:', error);
    }
  }

  exit(offline = false) {
    try {
      // Close all producers
      this.producers.forEach((producer) => {
        producer.close();
      });
      this.producers.clear();

      // Close all consumers
      this.consumers.forEach((consumer) => {
        consumer.close();
      });
      this.consumers.clear();

      // Close transports
      if (this.producerTransport) {
        this.producerTransport.close();
      }
      if (this.consumerTransport) {
        this.consumerTransport.close();
      }

      // Clear all video containers
      const remoteVideosContainer = document.getElementById('remoteVideos');
      if (remoteVideosContainer) {
        remoteVideosContainer.innerHTML = '';
      }

      const localMediaContainer = document.getElementById('localMedia');
      if (localMediaContainer) {
        localMediaContainer.innerHTML = '';
      }

      // Clear audio elements
      const remoteAudioContainer = document.getElementById('remoteAudio');
      if (remoteAudioContainer) {
        remoteAudioContainer.innerHTML = '';
      }

      // Hide all call-related UI elements
      const callContainer = document.getElementById('videoMedia');
      const loginContainer = document.getElementById('loginContainer');
      const participantsPanel = document.getElementById('participantsPanel');
      const capturedImagesContainer = document.getElementById('capturedImagesContainer');
      const captureButton = document.querySelector('.capture-button');
      const poseButton = document.getElementById('poseDetectionButton');
      const toggleCapturedImagesBtn = document.getElementById('toggleCapturedImages');

      if (callContainer) callContainer.style.display = 'none';
      if (loginContainer) loginContainer.style.display = 'block';
      if (participantsPanel) participantsPanel.style.display = 'none';
      if (capturedImagesContainer) capturedImagesContainer.style.display = 'none';
      if (captureButton) captureButton.style.display = 'none';
      if (poseButton) poseButton.style.display = 'none';
      if (toggleCapturedImagesBtn) toggleCapturedImagesBtn.style.display = 'none';

      // Clear any remaining overlays or countdowns
      const countdowns = document.querySelectorAll('.capture-countdown');
      countdowns.forEach(countdown => countdown.remove());

      // Clear any captured images
      if (capturedImagesContainer) {
        capturedImagesContainer.innerHTML = '';
      }

      // Update layout
      updateLayout();

      // Update participants list
      this.updateParticipantsList();

      // Emit exit event
      this.event(RoomClient.EVENTS.exitRoom);

      // Close socket connection if not offline
      if (!offline) {
        this.socket.disconnect();
      }

      this._isOpen = false;

      // Reset any global variables or states
      this.participants = [];
      this.capturedImages.clear();
      this.latestCapturedPose = null;
      this.poseDetectionActive = false;
      if (this.poseDetection) {
        this.stopPoseDetection();
      }

      // Refresh the window
      window.location.reload();
    } catch (error) {
      console.error('Error during exit:', error);
    }
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

  async recreateProducerTransport() {
    console.log('Handling transport failure...');

    // Increment retry count
    this.transportRetryCount = (this.transportRetryCount || 0) + 1;

    // Maximum retry attempts
    const maxRetries = 3;

    if (this.transportRetryCount <= maxRetries) {
      console.log(`Attempting to recreate transport (attempt ${this.transportRetryCount}/${maxRetries})...`);

      try {
        // Close existing transport
        if (this.producerTransport) {
          this.producerTransport.close();
        }

        // Create new transport
        const data = await this.socket.request('createWebRtcTransport', {
          forceTcp: false,
          rtpCapabilities: this.device.rtpCapabilities
        });

        if (data.error) {
          throw new Error(data.error);
        }

        this.producerTransport = this.device.createSendTransport(data);

        // Reattach event handlers
        this.producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
          try {
            await this.socket.request('connectTransport', {
              dtlsParameters,
              transport_id: data.id
            });
            callback();
          } catch (error) {
            errback(error);
          }
        });

        this.producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
          try {
            const { producer_id } = await this.socket.request('produce', {
              producerTransportId: this.producerTransport.id,
              kind,
              rtpParameters
            });
            callback({ id: producer_id });
          } catch (err) {
            errback(err);
          }
        });

        // Restart all producers
        for (const [type, producerId] of this.producerLabel.entries()) {
          const producer = this.producers.get(producerId);
          if (producer) {
            await this.produce(type);
          }
        }

        console.log('Transport recreated successfully');
        return true;
      } catch (error) {
        console.error('Failed to recreate transport:', error);
        return false;
      }
    } else {
      console.error('Max retry attempts reached. Transport recovery failed.');
      // Notify user or take appropriate action
      this.event(_EVENTS.transportError);
    }
  }

  async handleTransportFailure() {
    console.log('Handling transport failure...');

    // Increment retry count
    this.transportRetryCount = (this.transportRetryCount || 0) + 1;

    // Maximum retry attempts
    const maxRetries = 3;

    if (this.transportRetryCount <= maxRetries) {
      console.log(`Attempting to recreate transport (attempt ${this.transportRetryCount}/${maxRetries})...`);

      try {
        // Close existing transport
        if (this.producerTransport) {
          this.producerTransport.close();
        }

        // Create new transport
        const data = await this.socket.request('createWebRtcTransport', {
          forceTcp: false,
          rtpCapabilities: this.device.rtpCapabilities
        });

        if (data.error) {
          throw new Error(data.error);
        }

        this.producerTransport = this.device.createSendTransport(data);

        // Reattach event handlers
        this.producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
          try {
            await this.socket.request('connectTransport', {
              dtlsParameters,
              transport_id: data.id
            });
            callback();
          } catch (error) {
            errback(error);
          }
        });

        this.producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
          try {
            const { producer_id } = await this.socket.request('produce', {
              producerTransportId: this.producerTransport.id,
              kind,
              rtpParameters
            });
            callback({ id: producer_id });
          } catch (err) {
            errback(err);
          }
        });

        // Restart all producers
        for (const [type, producerId] of this.producerLabel.entries()) {
          const producer = this.producers.get(producerId);
          if (producer) {
            await this.produce(type);
          }
        }

        console.log('Transport recreated successfully');
        return true;
      } catch (error) {
        console.error('Failed to recreate transport:', error);
        return false;
      }
    } else {
      console.error('Max retry attempts reached. Transport recovery failed.');
      // Notify user or take appropriate action
      this.event(_EVENTS.transportError);
    }
  }

  // Add new methods for image capture functionality
  captureAndBroadcastImage() {
    // Get the video element using the correct selector
    const videoElement = document.querySelector(`#container-local-${this.socket.id} video`)
    if (!videoElement) {
      console.warn('No video element found')
      return
    }

    // Get the video container
    const videoContainer = videoElement.closest('.video-container')
    if (!videoContainer) {
      console.warn('No video container found')
      return
    }

    // Get the capture button
    const captureButton = document.querySelector('.capture-button')
    if (!captureButton) {
      console.warn('No capture button found')
      return
    }

    // Hide capture button
    captureButton.style.display = 'none'

    // Create cancel button
    const cancelButton = document.createElement('button')
    cancelButton.innerHTML = 'Cancel'
    cancelButton.className = 'cancel-capture-button'
    cancelButton.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      z-index: 1000;
      padding: 10px 20px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
    `

    // Add cancel button to document
    document.body.appendChild(cancelButton)

    // Create countdown overlay if it doesn't exist
    let countdownOverlay = videoContainer.querySelector('.capture-countdown')
    if (!countdownOverlay) {
      countdownOverlay = document.createElement('div')
      countdownOverlay.className = 'capture-countdown'
      videoContainer.appendChild(countdownOverlay)
    }

    // Show countdown overlay
    countdownOverlay.classList.remove('hidden')

    // Start countdown
    let count = 10
    countdownOverlay.textContent = count

    const countdownInterval = setInterval(() => {
      count--
      countdownOverlay.textContent = count

      if (count <= 0) {
        clearInterval(countdownInterval)
        countdownOverlay.classList.add('hidden')

        // Set canvas dimensions to match video
        this.captureCanvas.width = videoElement.videoWidth
        this.captureCanvas.height = videoElement.videoHeight

        // Draw the current video frame to the canvas
        this.captureContext.drawImage(videoElement, 0, 0)

        // Get the image data as base64
        const imageData = this.captureCanvas.toDataURL('image/jpeg')

        // Create timestamp
        const timestamp = new Date().toISOString()

        // Store the captured image
        this.capturedImages.set(timestamp, imageData)

        // Broadcast the image to all peers
        this.socket.emit('captureAndBroadcastImage', {
          imageData,
          timestamp
        })

        // Display the image locally
        this.displayCapturedImage(imageData, timestamp, this.socket.id)

        // Remove cancel button and show capture button
        cancelButton.remove()
        captureButton.style.display = 'block'
      }
    }, 1000)

    // Add click handler for cancel button
    cancelButton.addEventListener('click', () => {
      clearInterval(countdownInterval)
      countdownOverlay.classList.add('hidden')
      cancelButton.remove()
      captureButton.style.display = 'block'
    })
  }

  displayCapturedImage(imageData, timestamp, capturedBy) {
    // Create image container if it doesn't exist
    let container = document.getElementById('capturedImagesContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'capturedImagesContainer';
      container.className = 'captured-images-container hidden';
      document.body.appendChild(container);

      // Create toggle button if it doesn't exist
      let toggleButton = document.getElementById('toggleCapturedImages');
      if (!toggleButton) {
        toggleButton = document.createElement('button');
        toggleButton.id = 'toggleCapturedImages';
        toggleButton.className = 'toggle-captured-images-btn';
        toggleButton.innerHTML = '<i class="fas fa-images"></i>';
        toggleButton.title = 'Toggle Captured Images';

        toggleButton.addEventListener('click', () => {
          container.classList.toggle('hidden');
          toggleButton.classList.toggle('active');
        });

        document.body.appendChild(toggleButton);
      }
    }

    // Create image wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'captured-image-wrapper';

    // Create timestamp element
    const timestampEl = document.createElement('div');
    timestampEl.className = 'captured-image-timestamp';
    timestampEl.textContent = new Date(timestamp).toLocaleTimeString();

    // Create image element
    const img = document.createElement('img');
    img.className = 'captured-image';
    img.src = imageData;
    img.alt = 'Captured pose';

    // Try to detect pose from the captured image if pose detection is available
    if (window.poseDetection) {
      // Create a temporary canvas element to load the image
      const tempCanvas = document.createElement('canvas');
      const tempContext = tempCanvas.getContext('2d');
      const tempImage = new Image();

      tempImage.onload = async () => {
        try {
          // Set canvas dimensions to match image
          tempCanvas.width = tempImage.width;
          tempCanvas.height = tempImage.height;

          // Draw image to canvas
          tempContext.drawImage(tempImage, 0, 0);

          // Initialize detector if not already initialized
          if (!window.poseDetection.detector) {
            console.log('Initializing pose detector for captured image...');
            try {
              // Create detector using TensorFlow.js pose detection
              const detectorConfig = {
                modelType: 'SinglePose.Lightning',
                enableSmoothing: true,
                minPoseScore: 0.3
              };
              window.poseDetection.detector = await poseDetection.createDetector(
                poseDetection.SupportedModels.MoveNet,
                detectorConfig
              );
              console.log('Pose detector initialized successfully');
            } catch (error) {
              console.error('Error initializing pose detector:', error);
              throw error;
            }
          }

          // Detect pose from the canvas
          const poses = await window.poseDetection.detector.estimatePoses(tempCanvas);
          if (poses && poses.length > 0) {
            const poseData = poses[0];

            // Ensure we have valid keypoints
            if (poseData.keypoints && poseData.keypoints.length > 0) {
              // Store pose data with the image
              if (window.poseDetection.storePoseDataWithImage) {
                window.poseDetection.storePoseDataWithImage(img, poseData);
                console.log('Stored pose data with image:', {
                  keypoints: poseData.keypoints.length,
                  score: poseData.score
                });
              }

              // Update latest captured pose
              this.latestCapturedPose = poseData;

              // If we're in captured mode, update the pose detection
              if (this.poseComparisonMode === 'captured') {
                this.stopPoseDetection();
                this.startPoseDetection();
              }
            } else {
              console.warn('No valid keypoints found in detected pose');
            }
          } else {
            console.warn('No poses detected in captured image');
          }
        } catch (error) {
          console.warn('Error detecting pose from captured image:', error);
        } finally {
          // Clean up
          tempCanvas.remove();
          tempImage.remove();
        }
      };

      // Handle image load errors
      tempImage.onerror = (error) => {
        console.error('Error loading image for pose detection:', error);
        tempCanvas.remove();
        tempImage.remove();
      };

      // Start loading the image
      tempImage.src = imageData;
    } else {
      console.warn('Pose detection not available for captured image');
    }

    // Add elements to wrapper
    wrapper.appendChild(timestampEl);
    wrapper.appendChild(img);

    // Add wrapper to container
    container.appendChild(wrapper);

    // Show container if it was hidden
    container.classList.remove('hidden');
  }

  // Add method to create capture button
  createCaptureButton() {
    const button = document.createElement('button')
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M440-440ZM144.62-160Q117-160 98.5-178.5 80-197 80-224.62v-430.76Q80-683 98.5-701.5 117-720 144.62-720h118.3l74-80h207.7v40H354.23l-73.77 80H144.62q-10.77 0-17.7 6.92-6.92 6.93-6.92 17.7v430.76q0 10.77 6.92 17.7 6.93 6.92 17.7 6.92h590.76q10.77 0 17.7-6.92 6.92-6.93 6.92-17.7v-320h40v320q0 27.62-18.5 46.12Q763-160 735.38-160H144.62ZM760-680v-80h-80v-40h80v-80h40v80h80v40h-80v80h-40ZM440-290.77q62.69 0 105.96-43.27 43.27-43.27 43.27-105.96 0-62.69-43.27-105.96-43.27-43.27-105.96-43.27-62.69 0-105.96 43.27-43.27 43.27-43.27 105.96 0 62.69 43.27 105.96 43.27 43.27 105.96 43.27Zm0-40q-46.62 0-77.92-31.31-31.31-31.3-31.31-77.92 0-46.62 31.31-77.92 31.3-31.31 77.92-31.31 46.62 0 77.92 31.31 31.31 31.3 31.31 77.92 0 46.62-31.31 77.92-31.3 31.31-77.92 31.31Z"/></svg>'
    button.className = 'capture-button'
    button.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      z-index: 1000;
      padding: 10px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
      width: 44px;
      height: 44px;
      display: none;
      align-items: center;
      justify-content: center;
    `

    button.addEventListener('click', () => {
      this.captureAndBroadcastImage()
    })

    document.body.appendChild(button)
  }

  updateCaptureButtonVisibility() {
    const captureButton = document.querySelector('.capture-button');
    if (captureButton) {
      const hasVideoProducer = this.producerLabel.has(mediaType.video);
      captureButton.style.display = hasVideoProducer ? 'flex' : 'none';
    }
  }

  initPoseComparison() {
    const poseDetectionMode = document.getElementById('poseDetectionMode');
    if (poseDetectionMode) {
      poseDetectionMode.addEventListener('change', (e) => {
        this.poseComparisonMode = e.target.value;
        console.log('Pose comparison mode changed to:', this.poseComparisonMode);

        // Update pose detection when mode changes
        if (this.poseDetectionActive) {
          this.stopPoseDetection();
          this.startPoseDetection();
        }
      });
    }
  }

  startPoseDetection() {
    if (!this.poseDetection) {
      console.error('Pose detection not initialized');
      return;
    }

    // Get the video element
    const videoElement = document.querySelector(`#container-local-${this.socket.id} video`);
    if (!videoElement) {
      console.error('No video element found');
      return;
    }

    // Get the video container
    const videoContainer = videoElement.closest('.video-container');
    if (!videoContainer) {
      console.error('No video container found');
      return;
    }

    // Start pose detection with the appropriate comparison mode
    this.poseDetection.startDetection(videoElement, videoContainer, {
      comparisonMode: this.poseComparisonMode,
      referencePose: this.poseComparisonMode === 'captured' ? this.latestCapturedPose : null
    });
  }

  stopPoseDetection() {
    if (this.poseDetection) {
      this.poseDetection.stopDetection();
    }
  }
}
