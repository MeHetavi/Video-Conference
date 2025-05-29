#!/bin/bash

# Update and install Node.js, Git, etc.
apt-get update
apt-get install -y curl git

# Install Node.js (v18)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Clone your repository (or use GCS bucket copy or other deploy strategy)
git clone https://github.com/MeHetavi/Video_Conference.git 
cd /Video_Conference

# Install dependencies
npm install

# Set environment variables if needed
# export NODE_ENV=production

# Start the app in background
nohup npm run start > app.log 2>&1 &
