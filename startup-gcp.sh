#!/bin/bash

# Get the external IP address
EXTERNAL_IP=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)

# Export it as an environment variable
export EXTERNAL_IP=$EXTERNAL_IP
echo "External IP: $EXTERNAL_IP"

# Navigate to the application directory
cd Video-Conference

# Install dependencies if needed
npm install

# Start the application with the external IP
t_IP=$EXTERNAL_IP node src/app.js