#!/bin/bash

# Simple script to monitor media flow logs

LOG_FILE="app.log"
GREP_PATTERN="MEDIA FLOW"

# Check if log file exists
if [ ! -f "$LOG_FILE" ]; then
  echo "Log file $LOG_FILE not found. Starting application..."
  node src/app.js > $LOG_FILE 2>&1 &
  sleep 2
fi

# Test log entry to verify logging is working
echo "[MEDIA FLOW] Log monitoring started at $(date)" >> $LOG_FILE

# Function to display colored logs
display_logs() {
  tail -f $LOG_FILE | grep --color=always -E "$GREP_PATTERN|$"
}

# Display header
echo "=============================================="
echo "  Media Flow Monitor"
echo "=============================================="
echo "Monitoring $LOG_FILE for media flow events..."
echo "Press Ctrl+C to exit"
echo "=============================================="

# Start monitoring
display_logs
