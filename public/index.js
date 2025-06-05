urlParts = window.location.pathname.split('/');
isTrainer = urlParts[3] || '0';

// Initialize socket with query parameters
const socket = io({
  query: {
    isTrainer: isTrainer
  }
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
    console.log('Already connected to a room');
  } else {
    initEnumerateDevices();

    const urlParts = window.location.pathname.split('/');
    const isTrainer = urlParts[3] || '0';
    console.log('Is trainer:', isTrainer);

    // Set room_id on socket
    if (window.socket) {
      window.socket.room_id = room_id;
      console.log('Set room_id on socket:', {
        socketId: window.socket.id,
        roomId: room_id
      });
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
  // reveal(startScreenButton)
  // hide(stopScreenButton)
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
    showNotification('join', data.name);
  });

  socket.on('peerClosed', (data) => {
    // We need to get the name of the peer who left
    if (rc && rc.participants) {
      const leftParticipant = rc.participants.find(p => p.socketId === data.peerId);
      if (leftParticipant) {
        showNotification('leave', leftParticipant.name);
      } else if (data.name) {
        showNotification('leave', data.name);
      }
    } else if (data.name) {
      showNotification('leave', data.name);
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
function showNotification(type, username) {

  // Only show notifications to trainer
  if (!rc || !rc.isTrainer) {
    console.log('Not showing notification - not trainer or rc not initialized');
    return;
  }

  const container = document.getElementById('notificationContainer');
  if (!container) {
    console.error('Notification container not found');
    return;
  }

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;

  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let icon, title, message;

  if (type === 'join') {
    icon = 'fa-user-plus';
    title = 'User Joined';
    message = `${username} has joined the meeting`;
  } else if (type === 'leave') {
    icon = 'fa-user-minus';
    title = 'User Left';
    message = `${username} has left the meeting`;
  }

  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas ${icon}"></i>
    </div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
      <div class="notification-time">${timeString}</div>
    </div>
  `;

  container.appendChild(notification);

  // Remove notification after animation completes (5 seconds)
  setTimeout(() => {
    notification.remove();
  }, 5000);
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