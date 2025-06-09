const os = require('os')
const ifaces = os.networkInterfaces()

const getLocalIp = () => {
  let localIp = '127.0.0.1'
  Object.keys(ifaces).forEach((ifname) => {
    for (const iface of ifaces[ifname]) {
      // Ignore IPv6 and 127.0.0.1
      if (iface.family !== 'IPv4' || iface.internal !== false) {
        continue
      }
      // Set the local ip to the first IPv4 address found and exit the loop
      localIp = iface.address
      return
    }
  })
  return localIp
}

// Get the external IP from environment variable or fetch it
const getExternalIp = () => {
  // If EXTERNAL_IP is set as an environment variable, use it
  if (process.env.EXTERNAL_IP) {
    return process.env.EXTERNAL_IP;
  }

  // Otherwise, try to get it from metadata server (for Google Cloud)
  const http = require('http');
  return new Promise((resolve, reject) => {
    const options = {
      host: 'metadata.google.internal',
      path: '/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip',
      headers: { 'Metadata-Flavor': 'Google' }
    };

    const req = http.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data.trim()));
    });

    req.on('error', (e) => {
      console.warn('Failed to get external IP from metadata server:', e.message);
      resolve(getLocalIp()); // Fallback to local IP
    });

    req.end();
  });
}

// Initialize with local IP, will be replaced with external IP when available
let externalIp = getLocalIp();

// Try to get the external IP
(async () => {
  try {
    externalIp = await getExternalIp();
    console.log('Using external IP:', externalIp);
  } catch (err) {
    console.warn('Could not determine external IP, using local IP:', externalIp);
  }
})();

module.exports = {
  listenIp: '0.0.0.0',
  listenPort: 3016,
  sslCrt: '../ssl/cert.pem',
  sslKey: '../ssl/key.pem',

  mediasoup: {
    // Worker settings
    numWorkers: Object.keys(os.cpus()).length,
    worker: {
      rtcMinPort: 10000,
      rtcMaxPort: 10100,
      logLevel: 'warn',
      logTags: [
        'info',
        'ice',
        'dtls',
        'rtp',
        'srtp',
        'rtcp'
      ]
    },
    // Router settings
    router: {
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000
          }
        }
      ]
    },
    // WebRtcTransport settings
    webRtcTransport: {
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: '35.200.140.215' // This will be the external IP
        }
      ],
      maxIncomingBitrate: 1500000,
      initialAvailableOutgoingBitrate: 1000000
    }
  }
}
