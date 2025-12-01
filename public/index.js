urlParts = window.location.pathname.split('/');
isTrainer = urlParts[3] || '0';

// Initialize socket with query parameters
const socket = io({
  query: { isTrainer: isTrainer },
  transports: ['websocket']
});
let producer = null

// nameInput.value = 'user_' + Math.round(Math.random() * 1000)

socket.request = function request(type, data = {}) {
  return new Promise((resolve, reject) => {
    socket.emit(type, data, (data) => {
      if (data.error) {
        reject(data.error)
      } else {
        resolve(data)
      }
    })
  })
}

let rc = null

// Local video is now rendered in remoteVideos grid, so localMedia is no longer needed
const localMedia = null;
const remoteVideos = document.getElementById('remoteVideos');
const remoteAudios = document.getElementById('remoteAudios');
const participantsPanel = document.getElementById('participantsPanel');
const participantsButton = document.getElementById('participantsButton');
const toggleParticipantsBtn = document.getElementById('toggleParticipantsBtn');
const participantsBadge = document.getElementById('participantsBadge');

async function joinRoom(name, room_id) {
  if (rc && rc.isOpen()) {
    return;
  }

  // Get trainer/owner status from API when token is available.
  // If no token, allow joining as a normal participant without blocking.
  let isTrainer = '0';
  let ownershipData = null;

  const token = localStorage.getItem('access_token') || getTokenFromURL();

  if (token) {
    try {
      // Get user_id from user profile
      let user_id = null;
      if (window.userProfile && window.userProfile.user_id) {
        user_id = window.userProfile.user_id;
      } else {
        // Try to get from profile API if not available
        const API_BASE_URL = window.API_BASE_URL || 'https://prana.ycp.life/api/v1';
        try {
          const profileResponse = await fetch(`${API_BASE_URL}/me/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const profile = profileData.data?.user || profileData.data || profileData.user || profileData;
            if (profile.user_id) {
              user_id = profile.user_id;
              window.userProfile = profile;
            }
          }
        } catch (e) {
          console.error('Error fetching user profile:', e);
        }
      }

      if (user_id) {
        const API_BASE_URL = window.API_BASE_URL || 'https://prana.ycp.life/api/v1';

        // Check ownership to determine if user is trainer/owner
        const ownershipResponse = await fetch(`${API_BASE_URL}/sessions/${room_id}/${user_id}/check-ownership`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (ownershipResponse.ok) {
          const ownershipResult = await ownershipResponse.json();
          ownershipData = ownershipResult.data || ownershipResult;

          console.log('Ownership check response:', ownershipData.is_owner, ownershipData.is_trainer_owner, ownershipData.is_institute_owner);

          // Determine trainer status from ownership data only
          if (ownershipData.is_owner || ownershipData.is_trainer_owner || ownershipData.is_institute_owner) {
            isTrainer = '1';
          }
        } else {
          console.warn('Unable to verify session ownership, continuing as participant.');
        }
      } else {
        console.warn('Unable to get user information, continuing as participant.');
      }
    } catch (error) {
      console.error('Error checking ownership, continuing as participant:', error);
    }

    // If not a trainer and we have a token, optionally check if session is ongoing (best-effort).
    if (isTrainer === '0' || isTrainer === false) {
      try {
        const API_BASE_URL = window.API_BASE_URL || 'https://prana.ycp.life/api/v1';
        const response = await fetch(`${API_BASE_URL}/session-occurrences/session/${room_id}/ongoing`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Session ongoing check response:', data);

          const isOngoing = data?.data?.ongoing === true || data?.ongoing === true;
          if (!isOngoing || !data || (typeof data === 'object' && Object.keys(data).length === 0) || data.success === false) {
            console.warn('Session not reported as ongoing, but allowing join as requested.');
          }
        } else {
          console.warn('Unable to verify session status, allowing join.');
        }
      } catch (error) {
        console.error('Error checking session status, allowing join:', error);
      }
    }

    // Store ownership data globally for use in RoomClient
    if (ownershipData) {
      window.sessionOwnership = ownershipData;
    }

    // Update room config with ownership data
    if (window.roomConfig) {
      window.roomConfig.isTrainer = isTrainer === '1';
      window.roomConfig.ownership = ownershipData;
    }
  } else {
    console.warn('No token found; joining room as unauthenticated participant. Calling ongoing API without auth.');

    try {
      const API_BASE_URL = window.API_BASE_URL || 'https://prana.ycp.life/api/v1';
      const response = await fetch(`${API_BASE_URL}/session-occurrences/session/${room_id}/ongoing`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        console.log('Unauthenticated session ongoing check response:', data);
      } else {
        console.warn('Unauthenticated ongoing check failed with status:', response.status);
      }
    } catch (error) {
      console.error('Error calling unauthenticated ongoing API:', error);
    }
  }

  // Proceed with joining the room
  initEnumerateDevices();

  // Set room_id on socket
  if (window.socket) {
    window.socket.room_id = room_id;
  }

  rc = new RoomClient(
    localMedia,
    remoteVideos,
    remoteAudios,
    window.mediasoupClient,
    socket,
    room_id,
    name,
    roomOpen,
    isTrainer
  );

  addListeners();
}

// Helper function to get token from URL (if available)
function getTokenFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token') || null;
}


async function roomOpen() {
  hide(login)
  hide(loginContainer)
  reveal(callScreen)
  reveal(control)
  reveal(videoMedia)
  reveal(exitButton)
  reveal(devicesButton)
  reveal(participantsButton)
  reveal(toggleParticipantsBtn)

  // Apply lobby settings to video conference
  const lobbySettings = window.lobbySettings || {};
  const audioSelect = document.getElementById('audioSelect');
  const videoSelect = document.getElementById('videoSelect');

  // Set device selections if available
  if (lobbySettings.audioDeviceId && audioSelect) {
    // Wait for options to be populated
    const setAudioDevice = () => {
      if (audioSelect.options.length > 0) {
        audioSelect.value = lobbySettings.audioDeviceId;
      } else {
        setTimeout(setAudioDevice, 100);
      }
    };
    setAudioDevice();
  }
  if (lobbySettings.videoDeviceId && videoSelect) {
    // Wait for options to be populated
    const setVideoDevice = () => {
      if (videoSelect.options.length > 0) {
        videoSelect.value = lobbySettings.videoDeviceId;
      } else {
        setTimeout(setVideoDevice, 100);
      }
    };
    setVideoDevice();
  }

  // Start audio/video based on lobby settings
  // Wait for transports to be ready and device selects to be populated
  const applyLobbySettings = async () => {
    try {
      // Check if RoomClient and transports are ready
      if (!rc || !rc.producerTransport) {
        setTimeout(applyLobbySettings, 200);
        return;
      }

      if (lobbySettings.micEnabled) {
        const deviceId = lobbySettings.audioDeviceId || (audioSelect && audioSelect.value ? audioSelect.value : null);
        try {
          await rc.produce(RoomClient.mediaType.audio, deviceId);
          hide(startAudioButton);
          reveal(stopAudioButton);
        } catch (error) {
          console.warn('Failed to start audio with lobby settings:', error);
          reveal(startAudioButton);
          hide(stopAudioButton);
        }
      } else {
        reveal(startAudioButton);
        hide(stopAudioButton);
      }

      if (lobbySettings.camEnabled) {
        const deviceId = lobbySettings.videoDeviceId || (videoSelect && videoSelect.value ? videoSelect.value : null);
        try {
          await rc.produce(RoomClient.mediaType.video, deviceId);
          hide(startVideoButton);
          reveal(stopVideoButton);
        } catch (error) {
          console.warn('Failed to start video with lobby settings:', error);
          reveal(startVideoButton);
          hide(stopVideoButton);
        }
      } else {
        reveal(startVideoButton);
        hide(stopVideoButton);
      }
    } catch (error) {
      console.error('Error applying lobby settings:', error);
      // Fallback to default state if there's an error
      reveal(startAudioButton);
      hide(stopAudioButton);
      reveal(startVideoButton);
      hide(stopVideoButton);
    }
  };

  // Start trying to apply settings after a short delay
  setTimeout(applyLobbySettings, 300);
}

function hide(elem) {
  if (!elem) return;
  elem.classList.add('hidden');
}

function reveal(elem) {
  if (!elem) return;
  elem.classList.remove('hidden');
}

function addListeners() {
  rc.on(RoomClient.EVENTS.startScreen, () => {
    hide(startScreenButton)
    reveal(stopScreenButton)
  })

  rc.on(RoomClient.EVENTS.stopScreen, () => {
    hide(stopScreenButton)
    reveal(startScreenButton)
  })

  rc.on(RoomClient.EVENTS.stopAudio, () => {
    hide(stopAudioButton)
    reveal(startAudioButton)
  })
  rc.on(RoomClient.EVENTS.startAudio, () => {
    hide(startAudioButton)
    reveal(stopAudioButton)
  })

  rc.on(RoomClient.EVENTS.startVideo, () => {
    hide(startVideoButton)
    reveal(stopVideoButton)
  })
  rc.on(RoomClient.EVENTS.stopVideo, () => {
    hide(stopVideoButton)
    reveal(startVideoButton)
  })
  rc.on(RoomClient.EVENTS.exitRoom, () => {
    hide(control)
    hide(devicesList)
    hide(videoMedia)
    hide(callScreen)
    hide(devicesButton)
    hide(participantsButton)
    hide(toggleParticipantsBtn)
    hide(participantsPanel)
    reveal(login)
    reveal(loginContainer)
  })

  // Note: Socket event handlers for 'newPeer' and 'peerClosed' are handled in RoomClient.js
  // to avoid duplicate notifications
}

let isEnumerateDevices = false

function initEnumerateDevices() {
  // Many browsers, without the consent of getUserMedia, cannot enumerate the devices.
  if (isEnumerateDevices) return

  const constraints = {
    audio: true,
    video: true
  }

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      enumerateDevices()
      stream.getTracks().forEach(function (track) {
        track.stop()
      })
    })
    .catch((err) => {
      console.error('Access denied for audio/video: ', err)
    })
}

function enumerateDevices() {
  // Load mediaDevice options
  navigator.mediaDevices.enumerateDevices().then((devices) =>
    devices.forEach((device) => {
      let el = null
      if ('audioinput' === device.kind) {
        el = audioSelect
      } else if ('videoinput' === device.kind) {
        el = videoSelect
      }
      if (!el) return

      let option = document.createElement('option')
      option.value = device.deviceId
      option.innerText = device.label
      el.appendChild(option)
      isEnumerateDevices = true
    })
  )
}

function positionParticipantsPanel() {
  if (!participantsPanel || !participantsButton) return;
  if (participantsPanel.classList.contains('hidden')) return;

  const buttonRect = participantsButton.getBoundingClientRect();
  const panelWidth = 320; // Default width, will be adjusted by CSS
  const buttonCenterX = buttonRect.left + buttonRect.width / 2;

  // Position above the button, centered horizontally
  participantsPanel.style.bottom = `${window.innerHeight - buttonRect.top + 12}px`;
  participantsPanel.style.left = `${buttonCenterX}px`;
  participantsPanel.style.right = 'auto';
  participantsPanel.style.transform = 'translateX(-50%)';

  // Ensure panel doesn't go off screen
  const leftEdge = buttonCenterX - panelWidth / 2;
  const rightEdge = buttonCenterX + panelWidth / 2;

  if (leftEdge < 16) {
    participantsPanel.style.left = '16px';
    participantsPanel.style.transform = 'none';
  } else if (rightEdge > window.innerWidth - 16) {
    participantsPanel.style.left = 'auto';
    participantsPanel.style.right = '16px';
    participantsPanel.style.transform = 'none';
  }
}

function toggleParticipants(forceState) {
  if (!participantsPanel) return;
  const shouldShow = typeof forceState === 'boolean'
    ? forceState
    : participantsPanel.classList.contains('hidden');

  participantsPanel.classList.toggle('hidden', !shouldShow);
  participantsPanel.setAttribute('aria-hidden', String(!shouldShow));

  // Position panel above the button when showing
  if (shouldShow) {
    // Use requestAnimationFrame to ensure panel is visible before measuring
    requestAnimationFrame(() => {
      positionParticipantsPanel();
    });
  }

  [participantsButton, toggleParticipantsBtn].forEach((btn) => {
    if (!btn) return;
    btn.classList.toggle('active', shouldShow);
    btn.setAttribute('aria-pressed', String(shouldShow));
  });

  if (shouldShow && typeof participantsPanel.focus === 'function') {
    participantsPanel.focus();
  }
}

// Reposition panel on window resize
if (typeof window !== 'undefined') {
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      positionParticipantsPanel();
    }, 100);
  });
}

// Placeholder functions for new control buttons
function toggleHandRaise() {
  const button = document.getElementById('handRaiseButton')
  if (button) {
    button.classList.toggle('bg-green-500/80')
    // Add hand raise functionality here
    console.log('Hand raise toggled')
  }
}

function toggleRecording() {
  const button = document.getElementById('recordingButton')
  if (button) {
    button.classList.toggle('bg-red-500/80')
    // Add recording functionality here
    console.log('Recording toggled')
  }
}

function toggleMoreOptions() {
  // Add more options menu functionality here
  console.log('More options clicked')
}

// Toast Notification System
function initToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type = 'info', title = null, duration = 5000) {
  const container = initToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  // Icons for different types
  let icon = '';
  let defaultTitle = '';
  switch (type) {
    case 'success':
      icon = '<i class="fas fa-check-circle"></i>';
      defaultTitle = 'Success';
      break;
    case 'error':
      icon = '<i class="fas fa-exclamation-circle"></i>';
      defaultTitle = 'Error';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      defaultTitle = 'Warning';
      break;
    case 'info':
    default:
      icon = '<i class="fas fa-info-circle"></i>';
      defaultTitle = 'Info';
      break;
  }

  const displayTitle = title || defaultTitle;

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      ${title ? `<div class="toast-title">${displayTitle}</div>` : ''}
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  container.appendChild(toast);
  console.log('Toast notification shown:', { message, type, title });

  // Auto remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentNode === container) {
        toast.classList.add('fade-out');
        setTimeout(() => {
          if (toast.parentNode === container) {
            toast.remove();
          }
        }, 300);
      }
    }, duration);
  }

  return toast;
}

// Enhanced notification function (kept for backward compatibility, now uses toast)
function showNotification(message, type = 'info', title = null, duration = 5000) {
  // Use toast notifications instead
  return showToast(message, type, title, duration);
}

// Add specific functions for join/leave notifications
function showJoinNotification(username, isTrainer = false) {
  const trainerBadge = isTrainer ? ' <span style="color: #52B788; font-weight: 600;">(Trainer)</span>' : '';
  showToast(
    `${username}${trainerBadge} has joined the session.`,
    'success',
    'User Joined',
    6000
  );
}

function showLeaveNotification(username) {
  showToast(
    `${username} has left the session.`,
    'info',
    'User Left',
    6000
  );
}

// Additional notification functions
function showInfoNotification(message, title = 'Info') {
  showNotification(message, 'info', title, 5000);
}

function showWarningNotification(message, title = 'Warning') {
  showNotification(message, 'warning', title, 7000);
}

function showErrorNotification(message, title = 'Error') {
  console.log('showErrorNotification called:', { message, title });
  return showToast(message, 'error', title, 8000);
}

function showSuccessNotification(message, title = 'Success') {
  return showToast(message, 'success', title, 5000);
}

function showWarningNotification(message, title = 'Warning') {
  return showToast(message, 'warning', title, 7000);
}

function showInfoNotification(message, title = 'Info') {
  return showToast(message, 'info', title, 5000);
}

// Confirmation Modal Functions
let confirmModalCallback = null;

function showConfirmModal(title, message, onConfirm) {
  const modal = document.getElementById('confirmModal');
  const modalTitle = document.getElementById('confirmModalTitle');
  const modalMessage = document.getElementById('confirmModalMessage');
  const confirmBtn = document.getElementById('confirmModalConfirmBtn');

  if (!modal || !modalTitle || !modalMessage || !confirmBtn) {
    // Fallback to alert if modal elements not found
    if (confirm(message)) {
      onConfirm();
    }
    return;
  }

  modalTitle.textContent = title;
  modalMessage.textContent = message;
  confirmModalCallback = onConfirm;

  // Remove existing event listeners by cloning the button
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  // Add new event listener
  newConfirmBtn.addEventListener('click', () => {
    if (confirmModalCallback) {
      confirmModalCallback();
    }
  });

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
    confirmModalCallback = null;
  }
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('confirmModal');
    if (modal && !modal.classList.contains('hidden')) {
      closeConfirmModal();
    }
  }
});
