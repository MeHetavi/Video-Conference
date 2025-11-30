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
  const remoteContainer = document.getElementById('remoteVideos');
  if (!remoteContainer) return;

  const localVideoContainer = document.getElementById('localMedia');
  const localVideoTile = localVideoContainer ? localVideoContainer.querySelector('.video-container') : null;
  const allTiles = Array.from(remoteContainer.querySelectorAll('.video-container'));

  // Filter out local video tile from remote tiles (check for "You" indicator)
  const remoteTiles = allTiles.filter(tile => {
    const overlay = tile.querySelector('.video-overlay');
    if (!overlay) return true;
    const nameElement = overlay.querySelector('.video-name');
    if (!nameElement) return true;
    // Check if it's the local video by looking for "You" indicator
    const youIndicator = overlay.querySelector('.you-indicator');
    return !youIndicator && !nameElement.textContent.includes('(You)');
  });

  // Separate pinned and unpinned videos
  const pinnedTiles = remoteTiles.filter(tile => tile.classList.contains('pinned'));
  const unpinnedTiles = remoteTiles.filter(tile => !tile.classList.contains('pinned'));

  // Ensure local video stays in localMedia container (don't move it to remote container)
  if (localVideoTile && localVideoContainer && localVideoTile.parentElement !== localVideoContainer) {
    localVideoContainer.appendChild(localVideoTile);
  }

  // Style local video as small overlay in bottom-right (Google Meet style)
  if (localVideoTile) {
    localVideoTile.style.width = '100%';
    localVideoTile.style.height = '100%';
    localVideoTile.style.aspectRatio = '16/9';
    localVideoTile.style.borderRadius = '12px';
    localVideoTile.style.overflow = 'hidden';
    localVideoTile.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    localVideoTile.style.position = 'relative';
  }

  // Calculate grid layout based on number of remote participants (Google Meet style)
  // Optimize to minimize empty spaces
  // If there are pinned videos, show them prominently at the top
  const participantCount = remoteTiles.length;
  const pinnedCount = pinnedTiles.length;
  const unpinnedCount = unpinnedTiles.length;
  let gridColumns = 1;
  let gridRows = 1;
  let useCustomLayout = false;

  if (participantCount === 0) {
    // No remote participants - show empty grid, local video will be in overlay
    gridColumns = 1;
    gridRows = 1;
    remoteContainer.style.display = 'grid';
    remoteContainer.style.gridTemplateColumns = '1fr';
    remoteContainer.style.gridTemplateRows = '1fr';
    remoteContainer.style.gap = '8px';
    remoteContainer.style.padding = '8px';
    remoteContainer.style.width = '100%';
    remoteContainer.style.height = '100%';
    remoteContainer.style.minHeight = '0';
    remoteContainer.style.overflow = 'hidden';
  } else if (participantCount === 1) {
    gridColumns = 1;
    gridRows = 1;
  } else if (participantCount === 2) {
    gridColumns = 2;
    gridRows = 1;
  } else if (participantCount === 3) {
    // Special layout: 2 videos in one column (2 rows), 1 video in entire column
    useCustomLayout = true;
    gridColumns = 2;
    gridRows = 2;
  } else if (participantCount === 4) {
    gridColumns = 2;
    gridRows = 2;
  } else if (participantCount === 5) {
    // Optimized: 3 videos in first row, 2 videos in second row
    gridColumns = 3;
    gridRows = 2;
  } else if (participantCount === 6) {
    gridColumns = 3;
    gridRows = 2;
  } else if (participantCount === 7) {
    // Optimized: 4 videos in first row, 3 videos in second row
    gridColumns = 4;
    gridRows = 2;
  } else if (participantCount === 8) {
    gridColumns = 4;
    gridRows = 2;
  } else if (participantCount === 9) {
    gridColumns = 3;
    gridRows = 3;
  } else if (participantCount === 10) {
    // Optimized: 4 videos in first row, 3 videos in second row, 3 videos in third row
    gridColumns = 4;
    gridRows = 3;
  } else if (participantCount === 11) {
    // Optimized: 4 videos in first row, 4 videos in second row, 3 videos in third row
    gridColumns = 4;
    gridRows = 3;
  } else if (participantCount === 12) {
    gridColumns = 4;
    gridRows = 3;
  } else if (participantCount === 13) {
    // Optimized: 4 videos per row for first 3 rows, 1 video in fourth row
    gridColumns = 4;
    gridRows = 4;
  } else if (participantCount === 14) {
    // Optimized: 4 videos per row for first 3 rows, 2 videos in fourth row
    gridColumns = 4;
    gridRows = 4;
  } else if (participantCount === 15) {
    // Optimized: 4 videos per row for first 3 rows, 3 videos in fourth row
    gridColumns = 4;
    gridRows = 4;
  } else if (participantCount === 16) {
    gridColumns = 4;
    gridRows = 4;
  } else {
    // For more than 16, use a scrollable grid with 4 columns
    gridColumns = 4;
    gridRows = Math.ceil(participantCount / 4);
    remoteContainer.style.overflowY = 'auto';
    remoteContainer.style.maxHeight = 'calc(100vh - 100px)';
  }

  // Apply grid layout
  if (participantCount > 0) {
    // If there are pinned videos, create a special layout with sidebar
    if (pinnedCount > 0) {
      // Create two-column layout: pinned video(s) on left, others in scrollable sidebar on right
      remoteContainer.style.display = 'flex';
      remoteContainer.style.flexDirection = 'row';
      remoteContainer.style.gap = '8px';
      remoteContainer.style.padding = '8px';
      remoteContainer.style.width = '100%';
      remoteContainer.style.height = '100%';
      remoteContainer.style.minHeight = '0';
      remoteContainer.style.overflow = 'hidden';

      // Create main area for pinned video (only one can be pinned)
      let pinnedArea = remoteContainer.querySelector('.pinned-videos-area');
      if (!pinnedArea) {
        pinnedArea = document.createElement('div');
        pinnedArea.className = 'pinned-videos-area';
        pinnedArea.style.flex = '1';
        pinnedArea.style.minWidth = '0';
        pinnedArea.style.display = 'flex';
        pinnedArea.style.flexDirection = 'column';
        pinnedArea.style.gap = '8px';
        pinnedArea.style.overflow = 'hidden';
        remoteContainer.appendChild(pinnedArea);
      } else {
        pinnedArea.style.flexDirection = 'column';
      }

      // Reset all tiles first to clear any previous layout styles
      remoteTiles.forEach(tile => {
        tile.style.gridArea = '';
        tile.style.flex = '';
        tile.style.width = '';
        tile.style.height = '';
        tile.style.minHeight = '';
        tile.style.maxHeight = '';
        tile.style.aspectRatio = '';
        tile.style.flexShrink = '';
      });

      // Clear and add pinned video to main area (only first one if multiple somehow)
      pinnedArea.innerHTML = '';
      if (pinnedTiles.length > 0) {
        const pinnedTile = pinnedTiles[0]; // Only take the first pinned video
        // Reset styles first
        pinnedTile.style.gridArea = '';
        pinnedTile.style.flex = '';
        pinnedTile.style.width = '100%';
        pinnedTile.style.height = '100%';
        pinnedTile.style.minHeight = '0';
        pinnedTile.style.maxHeight = '';
        pinnedTile.style.aspectRatio = '';
        pinnedTile.style.flex = '1';
        pinnedArea.appendChild(pinnedTile);
      }

      // Create sidebar for unpinned videos
      let sidebar = remoteContainer.querySelector('.unpinned-videos-sidebar');
      if (!sidebar) {
        sidebar = document.createElement('div');
        sidebar.className = 'unpinned-videos-sidebar';
        sidebar.style.width = '300px';
        sidebar.style.minWidth = '250px';
        sidebar.style.maxWidth = '400px';
        sidebar.style.display = 'flex';
        sidebar.style.flexDirection = 'column';
        sidebar.style.gap = '8px';
        sidebar.style.overflowY = 'auto';
        sidebar.style.overflowX = 'hidden';
        sidebar.style.borderLeft = '1px solid rgba(255, 255, 255, 0.2)';
        sidebar.style.paddingLeft = '8px';
        remoteContainer.appendChild(sidebar);
      }

      // Clear and add ALL unpinned videos to sidebar (including previously pinned ones)
      sidebar.innerHTML = '';
      unpinnedTiles.forEach(tile => {
        // Reset all styles first
        tile.style.gridArea = '';
        tile.style.flex = '';
        tile.style.width = '100%';
        tile.style.aspectRatio = '16/9';
        tile.style.minHeight = '150px';
        tile.style.maxHeight = '250px';
        tile.style.flexShrink = '0';
        tile.style.height = '';
        sidebar.appendChild(tile);
      });

      // Show/hide sidebar based on whether there are unpinned videos
      if (unpinnedCount === 0) {
        sidebar.style.display = 'none';
      } else {
        sidebar.style.display = 'flex';
      }
    } else {
      // No pinned videos, use standard grid layout
      // Remove any sidebar elements if they exist
      const sidebar = remoteContainer.querySelector('.unpinned-videos-sidebar');
      const pinnedArea = remoteContainer.querySelector('.pinned-videos-area');

      // Move all tiles back to main container before removing sidebar/pinnedArea
      if (sidebar) {
        const sidebarTiles = Array.from(sidebar.querySelectorAll('.video-container'));
        sidebarTiles.forEach(tile => {
          // Reset styles before moving
          tile.style.width = '';
          tile.style.height = '';
          tile.style.minHeight = '';
          tile.style.maxHeight = '';
          tile.style.aspectRatio = '';
          tile.style.flexShrink = '';
          tile.style.flex = '';
          remoteContainer.appendChild(tile);
        });
        sidebar.remove();
      }

      if (pinnedArea) {
        // Move all tiles back to main container
        const tiles = Array.from(pinnedArea.querySelectorAll('.video-container'));
        tiles.forEach(tile => {
          // Reset styles before moving
          tile.style.width = '';
          tile.style.height = '';
          tile.style.minHeight = '';
          tile.style.maxHeight = '';
          tile.style.aspectRatio = '';
          tile.style.flex = '';
          remoteContainer.appendChild(tile);
        });
        pinnedArea.remove();
      }

      // Reset all tile styles before applying grid layout
      remoteTiles.forEach(tile => {
        tile.style.gridArea = '';
        tile.style.flex = '';
        tile.style.width = '';
        tile.style.height = '';
        tile.style.minHeight = '';
        tile.style.maxHeight = '';
        tile.style.aspectRatio = '';
        tile.style.flexShrink = '';
      });

      remoteContainer.style.display = 'grid';
      remoteContainer.style.gridTemplateColumns = `repeat(${gridColumns}, 1fr)`;
      remoteContainer.style.gridTemplateRows = `repeat(${gridRows}, 1fr)`;
      remoteContainer.style.gap = '8px';
      remoteContainer.style.padding = '8px';
      remoteContainer.style.width = '100%';
      remoteContainer.style.height = '100%';
      remoteContainer.style.minHeight = '0';
      if (participantCount <= 16) {
        remoteContainer.style.overflow = 'hidden';
      }

      // Apply custom layout for 3 participants
      if (useCustomLayout && remoteTiles.length === 3) {
        // First two videos in left column (stacked)
        remoteTiles[0].style.gridArea = '1 / 1 / 2 / 2'; // Top-left
        remoteTiles[1].style.gridArea = '2 / 1 / 3 / 2'; // Bottom-left
        // Third video takes entire right column
        remoteTiles[2].style.gridArea = '1 / 2 / 3 / 3'; // Full right column
      }

      // Apply default grid styles to all tiles
      remoteTiles.forEach(tile => {
        tile.style.width = '100%';
        tile.style.height = '100%';
        tile.style.aspectRatio = '16/9';
        tile.style.minHeight = '0';
        tile.style.maxHeight = '';
        if (!useCustomLayout || remoteTiles.length !== 3) {
          tile.style.gridArea = '';
        }
        tile.style.flex = '';
      });
    }
  }

  // Style each remote video tile with base styles
  // Layout-specific styles (width, height, aspectRatio) are set in the pinned/unpinned sections above
  remoteTiles.forEach(tile => {
    // Always apply base styles
    tile.style.borderRadius = '12px';
    tile.style.overflow = 'hidden';
    tile.style.position = 'relative';
    tile.style.backgroundColor = '#1B4332';

    // Layout-specific styles are already set in the pinned/unpinned sections above
    // Don't override them here
  });

  // Explicitly set the height of the video container to ensure it stays above controls
  const controlHeight = 80; // Fixed control height
  const videoMedia = document.getElementById('videoMedia');
  if (videoMedia) {
    videoMedia.style.height = `calc(100vh - ${controlHeight}px)`;
  }
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
    // Track pinned videos (socketId -> boolean)
    this.pinnedVideos = new Map();
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
    this.participantContainers = new Map() // Map socketId to container element
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

    // Track attendance on page unload (browser close/navigation)
    this.beforeUnloadHandler = (event) => {
      if (this.room_id && this._isOpen) {
        const token = localStorage.getItem('access_token');
        if (token) {
          const API_BASE_URL = 'http://10.254.167.80:8000/api/v1';
          const endpoint = `${API_BASE_URL}/attendances/session/${this.room_id}/leave`;

          // Use fetch with keepalive for reliable tracking on page unload
          // keepalive ensures the request continues even after page unload
          fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            keepalive: true
          }).catch(() => { }); // Ignore errors on unload
        }
      }
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

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
    // Get profile picture from user profile if available
    let profile_pic = null;
    if (window.userProfile && window.userProfile.profile_pic) {
      profile_pic = window.userProfile.profile_pic;
    }

    // Track attendance - join session
    this.trackAttendance(room_id, 'join').catch(err => {
      console.error('Failed to track attendance (join):', err);
    });

    socket
      .request('join', {
        name,
        room_id,
        isTrainer,
        profile_pic
      })
      .then(
        async function (e) {
          // Create a container for the local video
          const container = document.createElement('div');
          container.className = 'video-container';
          container.id = `container-local-${socket.id}`;
          container.style.position = 'relative';
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.justifyContent = 'center';
          container.style.backgroundColor = '#1B4332';

          // Create the video element
          const video = document.createElement('video');
          video.autoplay = true;
          video.playsInline = true;
          video.id = socket.id;
          video.className = 'vid';
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'contain';
          video.style.display = 'none'; // Initially hidden until video starts
          video.style.pointerEvents = 'none'; // Allow clicks to pass through to container

          // Create profile picture placeholder (shown when video is off)
          const profilePicPlaceholder = document.createElement('div');
          profilePicPlaceholder.className = 'profile-pic-placeholder';
          profilePicPlaceholder.id = `profile-pic-${socket.id}`;
          profilePicPlaceholder.style.width = '100%';
          profilePicPlaceholder.style.height = '100%';
          profilePicPlaceholder.style.display = 'flex';
          profilePicPlaceholder.style.alignItems = 'center';
          profilePicPlaceholder.style.justifyContent = 'center';
          profilePicPlaceholder.style.position = 'absolute';
          profilePicPlaceholder.style.top = '0';
          profilePicPlaceholder.style.left = '0';
          profilePicPlaceholder.style.right = '0';
          profilePicPlaceholder.style.bottom = '0';
          profilePicPlaceholder.style.zIndex = '1';

          // Set profile picture if available
          if (window.userProfile) {
            const profile = window.userProfile;
            if (profile.profile_pic) {
              // Get base URL - try multiple sources
              let baseURL = 'http://10.254.167.80:8000/api/v1';
              if (typeof window.API_BASE_URL !== 'undefined' && window.API_BASE_URL) {
                baseURL = window.API_BASE_URL;
              } else if (typeof window !== 'undefined' && window.location) {
                // Try to construct from current location
                const protocol = window.location.protocol;
                const hostname = window.location.hostname;
                baseURL = `${protocol}//${hostname}:8000/api/v1`;
              }
              const picUrl = profile.profile_pic.startsWith('http')
                ? profile.profile_pic
                : `${baseURL.replace('/api/v1', '')}/${profile.profile_pic}`;
              profilePicPlaceholder.innerHTML = `
                <img src="${picUrl}" alt="${profile.name || 'User'}" 
                     style="width: 200px; height: 200px; border-radius: 50%; object-fit: cover; border: 4px solid white;" />
              `;
            } else {
              // Default avatar with first letter
              const initial = (profile.name || 'U').charAt(0).toUpperCase();
              profilePicPlaceholder.innerHTML = `
                <div style="width: 200px; height: 200px; border-radius: 50%; background-color: #95D5B2; 
                            display: flex; align-items: center; justify-content: center; 
                            color: white; font-size: 72px; font-weight: bold; border: 4px solid white;">
                  ${initial}
                </div>
              `;
            }
          } else {
            // Default avatar if no profile - use name from join if available
            const userName = name || 'U';
            const initial = userName.charAt(0).toUpperCase();
            profilePicPlaceholder.innerHTML = `
              <div style="width: 200px; height: 200px; border-radius: 50%; background-color: #95D5B2; 
                          display: flex; align-items: center; justify-content: center; 
                          color: white; font-size: 72px; font-weight: bold; border: 4px solid white;">
                ${initial}
              </div>
            `;
          }

          // Create an overlay for the name and trainer tag
          const overlay = document.createElement('div');
          overlay.className = 'video-overlay';
          overlay.style.zIndex = '2';

          // Set the overlay content
          overlay.innerHTML = `
            <div class="video-info">
              <span class="video-name you-indicator">You</span>
              ${this.isTrainer ? '<span class="video-trainer-badge">Trainer</span>' : ''}
            </div>
          `;

          // Add elements to the container
          container.appendChild(profilePicPlaceholder);
          container.appendChild(video);
          container.appendChild(overlay);

          // Add the container to the local media container
          document.getElementById('localMedia').appendChild(container);

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
    // this.createCaptureButton()

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
      const total = this.participants.length;
      const label = total === 1 ? 'user' : 'users';
      participantsCount.textContent = `${total} ${label}`;
    }

    const participantsBadge = document.getElementById('participantsBadge');
    if (participantsBadge) {
      const total = this.participants.length;
      participantsBadge.textContent = String(total);
      participantsBadge.classList.toggle('hidden', total === 0);
      participantsBadge.setAttribute('aria-hidden', total === 0 ? 'true' : 'false');
    }

    // Create/update containers for all participants (except local user)
    this.createParticipantContainers();


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

      // Add remove button if current user is trainer and this is not themselves
      // Trainers can remove any user (including other trainers)
      if (this.isTrainer && !isCurrentUser) {
        participantHTML += `
          <div class="participant-actions">
            <button class="action-btn remove" data-peer-id="${participant.socketId}" title="Remove ${participant.name}">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;
      }

      participantItem.innerHTML = participantHTML;
      participantsList.appendChild(participantItem);

      // Add event listener to remove button
      if (this.isTrainer && !isCurrentUser) {
        const removeBtn = participantItem.querySelector('.remove');
        if (removeBtn) {
          removeBtn.addEventListener('click', () => {
            showConfirmModal(
              'Remove Participant',
              `Are you sure you want to remove ${participant.name} from the session?`,
              () => {
                this.kickParticipant(participant.socketId);
                closeConfirmModal();
              }
            );
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

  // Create containers for all participants (showing profile pic if no video)
  createParticipantContainers() {
    if (!this.participants || this.participants.length === 0) {
      return;
    }

    const remoteVideosContainer = document.getElementById('remoteVideos');
    if (!remoteVideosContainer) {
      return;
    }

    // Create containers for all remote participants (not local user)
    this.participants.forEach(participant => {
      // Skip local user - they have their own container
      if (participant.socketId === this.socket.id) {
        return;
      }

      // Check if container already exists
      let container = this.participantContainers.get(participant.socketId);

      if (!container) {
        // Create new container
        container = document.createElement('div');
        container.className = 'video-container';
        container.id = `container-participant-${participant.socketId}`;
        container.dataset.socketId = participant.socketId;
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.backgroundColor = '#1B4332';

        // Create profile picture placeholder
        const profilePicPlaceholder = document.createElement('div');
        profilePicPlaceholder.className = 'profile-pic-placeholder';
        profilePicPlaceholder.id = `profile-pic-participant-${participant.socketId}`;
        profilePicPlaceholder.style.width = '100%';
        profilePicPlaceholder.style.height = '100%';
        profilePicPlaceholder.style.display = 'flex';
        profilePicPlaceholder.style.alignItems = 'center';
        profilePicPlaceholder.style.justifyContent = 'center';
        profilePicPlaceholder.style.position = 'absolute';
        profilePicPlaceholder.style.top = '0';
        profilePicPlaceholder.style.left = '0';
        profilePicPlaceholder.style.right = '0';
        profilePicPlaceholder.style.bottom = '0';
        profilePicPlaceholder.style.zIndex = '1';

        // Set profile picture
        this.setProfilePicture(profilePicPlaceholder, participant.profile_pic, participant.name);

        // Create overlay for name and trainer tag
        const overlay = document.createElement('div');
        overlay.className = 'video-overlay';
        overlay.style.zIndex = '2';
        const isPinned = this.pinnedVideos.get(participant.socketId) || false;
        overlay.innerHTML = `
          <div class="video-info">
            <span class="video-name">${participant.name}</span>
            ${participant.isTrainer ? '<span class="video-trainer-badge">Trainer</span>' : ''}
          </div>
        `;

        // Add click event listener to container to pin/unpin
        // Allow clicking anywhere on the tile (including overlay) to pin/unpin.
        // Ensure we only ever attach ONE pin handler per container to avoid double-toggles.
        if (!container.dataset.pinHandlerAttached) {
          container.dataset.pinHandlerAttached = 'true';
          container.style.cursor = 'pointer';
          container.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.togglePinVideo(participant.socketId);
          });
        }

        // Update container pinned state
        if (isPinned) {
          container.classList.add('pinned');
        }

        container.appendChild(profilePicPlaceholder);
        container.appendChild(overlay);

        // Add to DOM
        remoteVideosContainer.appendChild(container);

        // Store reference
        this.participantContainers.set(participant.socketId, container);
      } else {
        // Update existing container's profile pic and info if needed
        const profilePicPlaceholder = container.querySelector('.profile-pic-placeholder');
        if (profilePicPlaceholder) {
          this.setProfilePicture(profilePicPlaceholder, participant.profile_pic, participant.name);
        }

        // Update overlay
        const overlay = container.querySelector('.video-overlay');
        if (overlay) {
          overlay.innerHTML = `
            <div class="video-info">
              <span class="video-name">${participant.name}</span>
              ${participant.isTrainer ? '<span class="video-trainer-badge">Trainer</span>' : ''}
            </div>
          `;
        }
      }
    });

    // Remove containers for participants who left
    const currentSocketIds = new Set(this.participants.map(p => p.socketId));
    const localSocketId = this.socket.id;

    this.participantContainers.forEach((container, socketId) => {
      if (socketId !== localSocketId && !currentSocketIds.has(socketId)) {
        // Participant left, but keep container if they have active video consumers
        // Only remove if no video consumers exist
        const hasVideoConsumer = Array.from(this.consumers.values()).some(consumer => {
          return consumer.appData && consumer.appData.producerSocketId === socketId;
        });

        if (!hasVideoConsumer) {
          container.remove();
          this.participantContainers.delete(socketId);
        }
      }
    });

    updateLayout();
  }

  // Track attendance API call
  async trackAttendance(session_id, action) {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('No access token found for attendance tracking');
        return;
      }

      // Get API base URL
      const API_BASE_URL = 'http://10.254.167.80:8000/api/v1';

      // Determine endpoint based on action
      const endpoint = action === 'join'
        ? `${API_BASE_URL}/attendances/session/${session_id}/join`
        : `${API_BASE_URL}/attendances/session/${session_id}/leave`;

      // Make API call
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Attendance tracking failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json().catch(() => ({}));
      console.log(`Attendance tracked successfully (${action}):`, data);
      return data;
    } catch (error) {
      console.error(`Error tracking attendance (${action}):`, error);
      throw error;
    }
  }

  // Helper method to set profile picture in a placeholder element
  setProfilePicture(placeholder, profilePic, name) {
    if (profilePic) {
      // Get base URL - try multiple sources
      let baseURL = 'http://10.254.167.80:8000/api/v1';
      if (typeof window.API_BASE_URL !== 'undefined' && window.API_BASE_URL) {
        baseURL = window.API_BASE_URL;
      } else if (typeof window !== 'undefined' && window.location) {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        baseURL = `${protocol}//${hostname}:8000/api/v1`;
      }
      const picUrl = profilePic.startsWith('http')
        ? profilePic
        : `${baseURL.replace('/api/v1', '')}/${profilePic}`;
      placeholder.innerHTML = `
        <img src="${picUrl}" alt="${name || 'User'}" 
             style="width: 200px; height: 200px; border-radius: 50%; object-fit: cover; border: 4px solid white;" />
      `;
    } else {
      // Default avatar with first letter
      const initial = (name || 'U').charAt(0).toUpperCase();
      placeholder.innerHTML = `
        <div style="width: 200px; height: 200px; border-radius: 50%; background-color: #95D5B2; 
                    display: flex; align-items: center; justify-content: center; 
                    color: white; font-size: 72px; font-weight: bold; border: 4px solid white;">
          ${initial}
        </div>
      `;
    }
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
              break;
            case 'connected':
              this.transportRetryCount = 0; // Reset retry count on successful connection
              break;
            case 'failed':
              await this.handleTransportFailure();
              break;
            case 'disconnected':
              await this.handleTransportFailure();
              break;
            case 'closed':
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

        // Show notification if function exists (defined in index.js)
        if (typeof showLeaveNotification === 'function' && data.name && data.peerId !== this.socket.id) {
          showLeaveNotification(data.name);
        }

        // Remove container for the participant who left
        const container = this.participantContainers.get(data.peerId);
        if (container) {
          container.remove();
          this.participantContainers.delete(data.peerId);
        }

        // Remove the participant from our local list immediately
        if (this.participants) {
          this.participants = this.participants.filter(p => p.socketId !== data.peerId);

          // Update the UI with our local data first for immediate feedback
          this.updateParticipantsList();
        }

        // Then fetch the latest participants list from the server to ensure consistency
        this.getParticipants();

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
        // Show notification if function exists (defined in index.js)
        if (typeof showJoinNotification === 'function' && data.name && data.peerId !== this.socket.id) {
          showJoinNotification(data.name, data.isTrainer || false);
        }
        // Refresh the participants list
        this.getParticipants()
      }.bind(this)
    )

    // Add event listener for producer state changes
    // this.socket.on(
    //   'producerStateChanged',
    //   function (data) {
    //     if (data.state == 'closed') {
    //       document.getElementById('poseDetectionButton').classList.add('hidden')
    //     }
    //     else {
    //       document.getElementById('poseDetectionButton').classList.remove('hidden')
    //     }
    //     // Refresh the participants list
    //     this.getParticipants()
    //   }.bind(this)
    // )

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
      this.displayCapturedImage(imageData, timestamp, capturedBy);
    });

    // Add listener for loading captured images when joining a room
    this.socket.on('loadCapturedImages', (images) => {
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
        return
      }
      let stream
      try {
        stream = screen
          ? await navigator.mediaDevices.getDisplayMedia()
          : await navigator.mediaDevices.getUserMedia(mediaConstraints)
        navigator.mediaDevices.getSupportedConstraints()

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


        this.producers.set(producer.id, producer)

        if (!audio) {
          const container = document.getElementById(`container-local-${socket.id}`);
          if (container) {
            const video = container.querySelector('video');
            const profilePic = container.querySelector('.profile-pic-placeholder');
            if (video) {
              video.srcObject = stream;
              video.play().catch(e => console.error('Error playing video:', e));
              // Show video and hide profile pic when video starts
              video.style.display = 'block';
              if (profilePic) {
                profilePic.style.display = 'none';
              }
            }
          }
        }

        producer.on('trackended', () => {
          this.closeProducer(type)
        })

        producer.on('transportclose', () => {
          if (!audio) {
            stream.getTracks().forEach(function (track) {
              track.stop()
            })
            // Show profile pic when video track ends
            const container = document.getElementById(`container-local-${socket.id}`);
            if (container) {
              const video = container.querySelector('video');
              const profilePic = container.querySelector('.profile-pic-placeholder');
              if (video) {
                video.style.display = 'none';
                if (profilePic) {
                  profilePic.style.display = 'flex';
                }
              }
            }
          }
          this.producers.delete(producer.id)
          this.updateCaptureButtonVisibility()
        })

        producer.on('close', () => {
          if (!audio) {
            stream.getTracks().forEach(function (track) {
              track.stop()
            })
            // Show profile pic when video producer closes
            const container = document.getElementById(`container-local-${socket.id}`);
            if (container) {
              const video = container.querySelector('video');
              const profilePic = container.querySelector('.profile-pic-placeholder');
              if (video) {
                video.style.display = 'none';
                if (profilePic) {
                  profilePic.style.display = 'flex';
                }
              }
            }
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
        throw err
      }
    } catch (err) {
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
        // Find the participant info based on the producer socket ID
        const participant = this.participants.find(p => p.socketId === appData.producerSocketId);
        const participantName = participant ? participant.name : 'Unknown';
        const isTrainer = participant ? participant.isTrainer : false;
        const participantProfilePic = participant ? participant.profile_pic : null;

        // Check if container already exists for this participant
        let container = this.participantContainers.get(appData.producerSocketId);

        if (!container) {
          // Create a new container for the video and its overlay
          container = document.createElement('div');
          container.className = 'video-container';
          container.id = `container-${consumer.id}`;
          container.dataset.socketId = appData.producerSocketId;
          container.style.position = 'relative';
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.justifyContent = 'center';
          container.style.backgroundColor = '#1B4332';

          // Store reference
          this.participantContainers.set(appData.producerSocketId, container);
        } else {
          // Update container ID to include consumer ID for tracking
          container.id = `container-${consumer.id}`;
        }

        // Create the video element
        elem = document.createElement('video');
        elem.srcObject = stream;
        elem.id = consumer.id;
        elem.playsinline = true;
        elem.autoplay = true;
        elem.className = 'vid';
        elem.style.width = '100%';
        elem.style.height = '100%';
        elem.style.objectFit = 'contain';
        elem.style.display = 'block'; // Show video initially
        elem.style.pointerEvents = 'none'; // Allow clicks to pass through to container

        // Get or create profile picture placeholder
        let profilePicPlaceholder = container.querySelector('.profile-pic-placeholder');
        if (!profilePicPlaceholder) {
          profilePicPlaceholder = document.createElement('div');
          profilePicPlaceholder.className = 'profile-pic-placeholder';
          profilePicPlaceholder.style.width = '100%';
          profilePicPlaceholder.style.height = '100%';
          profilePicPlaceholder.style.alignItems = 'center';
          profilePicPlaceholder.style.justifyContent = 'center';
          profilePicPlaceholder.style.position = 'absolute';
          profilePicPlaceholder.style.top = '0';
          profilePicPlaceholder.style.left = '0';
          profilePicPlaceholder.style.right = '0';
          profilePicPlaceholder.style.bottom = '0';
          profilePicPlaceholder.style.zIndex = '1';
          container.appendChild(profilePicPlaceholder);
        }
        profilePicPlaceholder.id = `profile-pic-${consumer.id}`;
        profilePicPlaceholder.style.display = 'none'; // Hidden initially when video is on

        // Set profile picture
        this.setProfilePicture(profilePicPlaceholder, participantProfilePic, participantName);

        // Get or create overlay for the name and trainer tag
        let overlay = container.querySelector('.video-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'video-overlay';
          overlay.style.zIndex = '2';
          container.appendChild(overlay);
        }

        // Set the overlay content
        const isPinned = this.pinnedVideos.get(appData.producerSocketId) || false;
        overlay.innerHTML = `
          <div class="video-info">
            <span class="video-name">${participantName}</span>
            ${isTrainer ? '<span class="video-trainer-badge">Trainer</span>' : ''}
          </div>
        `;

        // Add click event listener to container to pin/unpin
        // Remove any legacy onclick handler and rely on addEventListener + a guard flag
        container.onclick = null;

        if (!container.dataset.pinHandlerAttached) {
          container.dataset.pinHandlerAttached = 'true';
          container.style.cursor = 'pointer';
          container.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.togglePinVideo(appData.producerSocketId);
          });
        }

        // Update container pinned state
        if (isPinned) {
          container.classList.add('pinned');
        } else {
          container.classList.remove('pinned');
        }

        // Check if video element already exists in container
        let existingVideo = container.querySelector('video');
        if (existingVideo) {
          // Update existing video element
          existingVideo.id = consumer.id;
          existingVideo.srcObject = stream;
          existingVideo.style.pointerEvents = 'none'; // Allow clicks to pass through
          elem = existingVideo;
        } else {
          // Add video element to container
          container.appendChild(elem);
        }

        // Ensure container is in the DOM
        const remoteVideosContainer = document.getElementById('remoteVideos');
        if (container.parentElement !== remoteVideosContainer) {
          remoteVideosContainer.appendChild(container);
        }

        // Check if video track is actually active, if not show profile pic
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && videoTrack.readyState === 'live' && !videoTrack.muted && videoTrack.enabled) {
          elem.style.display = 'block';
          profilePicPlaceholder.style.display = 'none';
        } else {
          elem.style.display = 'none';
          profilePicPlaceholder.style.display = 'flex';
        }

        // Listen for track ended event to show profile pic
        if (videoTrack) {
          videoTrack.addEventListener('ended', () => {
            elem.style.display = 'none';
            profilePicPlaceholder.style.display = 'flex';
          });

          // Listen for track mute/unmute to toggle between video and profile pic
          videoTrack.addEventListener('mute', () => {
            elem.style.display = 'none';
            profilePicPlaceholder.style.display = 'flex';
          });

          videoTrack.addEventListener('unmute', () => {
            if (videoTrack.readyState === 'live' && videoTrack.enabled) {
              elem.style.display = 'block';
              profilePicPlaceholder.style.display = 'none';
            }
          });

          // Listen for track enabled/disabled
          videoTrack.addEventListener('disabled', () => {
            elem.style.display = 'none';
            profilePicPlaceholder.style.display = 'flex';
          });

          videoTrack.addEventListener('enabled', () => {
            if (videoTrack.readyState === 'live' && !videoTrack.muted) {
              elem.style.display = 'block';
              profilePicPlaceholder.style.display = 'none';
            }
          });
        }

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
          // Show profile pic when video track ends
          if (kind === 'video') {
            const container = document.getElementById(`container-${consumer.id}`);
            if (container) {
              const video = container.querySelector('video');
              const profilePic = container.querySelector('.profile-pic-placeholder');
              if (video) {
                video.style.display = 'none';
                if (profilePic) {
                  profilePic.style.display = 'flex';
                }
              }
            }
          }
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
      return
    }

    let producer_id = this.producerLabel.get(type)

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
          const profilePic = container.querySelector('.profile-pic-placeholder');
          if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(function (track) {
              track.stop()
            })
            video.srcObject = null;
            // Hide video and show profile pic when video stops
            video.style.display = 'none';
            if (profilePic) {
              profilePic.style.display = 'flex';
            }
          } else if (video) {
            // Even if no srcObject, ensure profile pic is shown
            video.style.display = 'none';
            if (profilePic) {
              profilePic.style.display = 'flex';
            }
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
      return
    }

    let producer_id = this.producerLabel.get(type)
    this.producers.get(producer_id).pause()
  }

  resumeProducer(type) {
    if (!this.producerLabel.has(type)) {
      return
    }

    let producer_id = this.producerLabel.get(type)
    this.producers.get(producer_id).resume()
  }

  removeConsumer(consumer_id) {
    try {
      const consumer = this.consumers.get(consumer_id);
      if (!consumer) return;

      // Get the producer socket ID
      const producerSocketId = consumer.appData ? consumer.appData.producerSocketId : null;

      // Find the container
      const container = document.getElementById(`container-${consumer_id}`);
      if (container) {
        // Remove video element but keep container (will show profile pic)
        const video = container.querySelector('video');
        if (video && video.id === consumer_id) {
          video.remove();

          // Show profile pic if container still exists
          const profilePic = container.querySelector('.profile-pic-placeholder');
          if (profilePic) {
            profilePic.style.display = 'flex';
          }
        }

        // Only remove container if no other video consumers exist for this participant
        if (producerSocketId) {
          const hasOtherVideoConsumers = Array.from(this.consumers.values()).some(c => {
            return c.appData &&
              c.appData.producerSocketId === producerSocketId &&
              c.id !== consumer_id &&
              c.kind === 'video';
          });

          if (!hasOtherVideoConsumers) {
            // No other video consumers, but keep container showing profile pic
            // Container will be removed when participant leaves
          }
        }
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

  async exit(offline = false) {
    try {
      // Track attendance - leave session (before reload)
      if (this.room_id && !offline) {
        try {
          await this.trackAttendance(this.room_id, 'leave');
        } catch (err) {
          console.error('Failed to track attendance (leave):', err);
          // Continue with exit even if attendance tracking fails
        }
      }

      window.location.reload();
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

      // Remove beforeunload handler
      if (this.beforeUnloadHandler) {
        window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      }

      // Reset any global variables or states
      this.participants = [];
      this.participantContainers.clear();
      this.capturedImages.clear();
      this.latestCapturedPose = null;
      this.poseDetectionActive = false;
      if (this.poseDetection) {
        this.stopPoseDetection();
      }

      // Refresh the window
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

    // Disabled: Click handler that triggers fullscreen removed
    // Videos will no longer go fullscreen on click
    // elementToFullscreen.addEventListener('click', (e) => {
    //   if (videoPlayer.controls) return;
    //   if (!this.isVideoOnFullScreen) {
    //     if (elementToFullscreen.requestFullscreen) {
    //       elementToFullscreen.requestFullscreen();
    //     } else if (elementToFullscreen.webkitRequestFullscreen) {
    //       elementToFullscreen.webkitRequestFullscreen();
    //     } else if (elementToFullscreen.msRequestFullscreen) {
    //       elementToFullscreen.msRequestFullscreen();
    //     }
    //     this.isVideoOnFullScreen = true;
    //     elementToFullscreen.style.pointerEvents = 'none';
    //   } else {
    //     if (document.exitFullscreen) {
    //       document.exitFullscreen();
    //     } else if (document.webkitCancelFullScreen) {
    //       document.webkitCancelFullScreen();
    //     } else if (document.msExitFullscreen) {
    //       document.msExitFullscreen();
    //     }
    //     this.isVideoOnFullScreen = false;
    //     elementToFullscreen.style.pointerEvents = 'auto';
    //   }
    // });
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

        // Get new ICE parameters from the server
        const { iceParameters } = await this.socket.request('restartIce', {
          transportId: transport.id
        });

        // Restart ICE
        await transport.restartIce({ iceParameters });
      }
    } catch (error) {
      console.error('Error restarting ICE:', error);
    }
  }

  async recreateProducerTransport() {

    // Increment retry count
    this.transportRetryCount = (this.transportRetryCount || 0) + 1;

    // Maximum retry attempts
    const maxRetries = 3;

    if (this.transportRetryCount <= maxRetries) {

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

    // Increment retry count
    this.transportRetryCount = (this.transportRetryCount || 0) + 1;

    // Maximum retry attempts
    const maxRetries = 3;

    if (this.transportRetryCount <= maxRetries) {

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
      console.error('No video element found for capture')
      return
    }

    // Get the video container
    const videoContainer = videoElement.closest('.video-container')
    if (!videoContainer) {
      console.error('No video container found for capture')
      return
    }

    // Get the capture button
    const captureButton = document.querySelector('.capture-button')
    if (!captureButton) {
      console.error('No capture button found')
      return
    }

    console.log('Starting image capture process...')

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

        console.log('Capturing image...')

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

        console.log('Broadcasting image to peers...', this.socket)

        // Broadcast the image to all peers
        this.socket.emit('captureAndBroadcastImage', {
          imageData,
          timestamp
        })

        // Display the image locally
        this.displayCapturedImage(imageData, timestamp, this.socket.id)

        console.log('Image capture and broadcast completed')

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
    console.log('Displaying captured image...');

    // Create image container if it doesn't exist
    let container = document.getElementById('capturedImagesContainer');
    if (!container) {
      console.log('Creating captured images container...');
      container = document.createElement('div');
      container.id = 'capturedImagesContainer';
      container.className = 'captured-images-container hidden';
      document.body.appendChild(container);

      // Create toggle button if it doesn't exist
      let toggleButton = document.getElementById('toggleCapturedImages');
      if (!toggleButton) {
        console.log('Creating toggle button for captured images...');
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

    console.log('Image elements created, adding to container...');

    // Add elements to wrapper
    wrapper.appendChild(timestampEl);
    wrapper.appendChild(img);

    // Add wrapper to container
    container.appendChild(wrapper);

    // Show container if it was hidden
    container.classList.remove('hidden');

    console.log('Image display completed');

    // Try to detect pose from the captured image if pose detection is available
    if (window.poseDetection) {
      console.log('Attempting pose detection on captured image...');
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
            try {
              console.log('Initializing pose detector...');
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
          console.log('Detecting pose from image...');
          const poses = await window.poseDetection.detector.estimatePoses(tempCanvas);
          if (poses && poses.length > 0) {
            const poseData = poses[0];

            // Ensure we have valid keypoints
            if (poseData.keypoints && poseData.keypoints.length > 0) {
              console.log('Pose detected successfully');
              // Store pose data with the image
              if (window.poseDetection.storePoseDataWithImage) {
                window.poseDetection.storePoseDataWithImage(img, poseData)
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
          console.error('Error detecting pose from captured image:', error);
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

  // Toggle pin state for a video (only one video can be pinned at a time)
  togglePinVideo(socketId) {
    const isPinned = this.pinnedVideos.get(socketId) || false;

    // If clicking on already pinned video, unpin it
    if (isPinned) {
      this.pinnedVideos.set(socketId, false);
      const containers = Array.from(document.querySelectorAll(`[data-socket-id="${socketId}"]`));
      containers.forEach(container => {
        container.classList.remove('pinned');
      });
    } else {
      // Unpin any currently pinned video (only one can be pinned)
      this.pinnedVideos.forEach((pinned, existingSocketId) => {
        if (pinned && existingSocketId !== socketId) {
          this.pinnedVideos.set(existingSocketId, false);
          const existingContainers = Array.from(document.querySelectorAll(`[data-socket-id="${existingSocketId}"]`));
          existingContainers.forEach(container => {
            container.classList.remove('pinned');
          });
        }
      });

      // Pin the new video
      this.pinnedVideos.set(socketId, true);
      const containers = Array.from(document.querySelectorAll(`[data-socket-id="${socketId}"]`));
      containers.forEach(container => {
        container.classList.add('pinned');
      });
    }

    // Update layout to show pinned video prominently
    updateLayout();
  }

  // Update pin button visual state (no longer needed, but kept for compatibility)
  updatePinButtonState(socketId) {
    // Pin state is now handled by CSS classes on the container
    // This method is kept for compatibility but does nothing
  }

  initPoseComparison() {
    const poseDetectionMode = document.getElementById('poseDetectionMode');
    if (poseDetectionMode) {
      poseDetectionMode.addEventListener('change', (e) => {
        this.poseComparisonMode = e.target.value;

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
