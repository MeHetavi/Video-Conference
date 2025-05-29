#!/bin/bash

# Make the log script executable
chmod +x log-media-flow.sh

# Create a symbolic link to make it available in PATH
ln -sf "$(pwd)/log-media-flow.sh" /usr/local/bin/log-media-flow

echo "Log script is now executable. Run it with ./log-media-flow.sh"