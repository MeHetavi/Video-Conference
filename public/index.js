urlParts = window.location.pathname.split('/');
isTrainer = urlParts[3] || '0';

// Initialize socket with query parameters
const socket = io('https://connect.ycp.life', {
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

const localMedia = document.getElementById('localMedia');
const remoteVideos = document.getElementById('remoteVideos');
const remoteAudios = document.getElementById('remoteAudios');

function joinRoom(name, room_id) {
  if (rc && rc.isOpen()) {
  } else {
    initEnumerateDevices();

    const urlParts = window.location.pathname.split('/');
    const isTrainer = urlParts[3] || '0';

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
}


function roomOpen() {
  hide(login)
  hide(loginContainer)
  reveal(callScreen)
  reveal(control)
  reveal(videoMedia)
  reveal(startAudioButton)
  hide(stopAudioButton)
  reveal(startVideoButton)
  hide(stopVideoButton)
  reveal(exitButton)
  reveal(devicesButton)
  reveal(participantsButton)
  reveal(toggleParticipantsBtn)
}

function hide(elem) {
  if (elem) elem.className = 'hidden'
}

function reveal(elem) {
  if (elem) elem.className = ''
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

  // Make sure these socket event handlers are properly set up
  socket.on('newPeer', (data) => {
    if (data.name) {
      showJoinNotification(data.name);
    }
  });

  socket.on('peerClosed', (data) => {
    if (data.name) {
      showLeaveNotification(data.name);
    }
  });
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

// Add this function to toggle the participants panel
function toggleParticipants() {
  const panel = document.getElementById('participantsPanel')
  if (panel.classList.contains('hidden')) {
    panel.classList.remove('hidden')
  } else {
    panel.classList.add('hidden')
  }
}

// Add these variables at the top of the file
const participantsPanel = document.getElementById('participantsPanel')
const toggleParticipantsBtn = document.getElementById('toggleParticipantsBtn')

// Update the showNotification function
function showNotification(message, type = 'info', duration = 5000) {
  const container = document.getElementById('notificationContainer');
  if (!container) {
    console.error('Notification container not found');
    return;
  }

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;

  // Add icon based on notification type
  let icon = '';
  if (type === 'join') {
    icon = '👋';
  } else if (type === 'leave') {
    icon = '👋';
  }

  notification.innerHTML = `
    <div class="notification-content">
      
      <span class="notification-message">${icon && icon}${message}</span>
    </div>
  `;


  // Add to container
  container.appendChild(notification);

  // Auto remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentNode === container) {
        notification.remove();
      }
    }, duration);
  }

  return notification;
}

// Add specific functions for join/leave notifications
function showJoinNotification(username) {
  showNotification(`${username} has joined the session.`, 'join', 8000);
}

function showLeaveNotification(username) {
  showNotification(`${username} has left the session.`, 'leave', 8000);
}

// Update the hide and reveal functions to handle these elements
function hide(elem) {
  if (elem) elem.className = 'hidden'
}

function reveal(elem) {
  if (elem) elem.className = ''


  // Add this function to toggle the participants panel
  function toggleParticipants() {
    const panel = document.getElementById('participantsPanel')
    if (panel.classList.contains('hidden')) {
      panel.classList.remove('hidden')
    } else {
      panel.classList.add('hidden')
    }
  }

}