#!/bin/sh
set -e
if [ "$USE_NGROK" = "1" ]; then
  NGROK_HOST="${NGROK_API_HOST:-ngrok}"
  NGROK_PORT="${NGROK_API_PORT:-4040}"
  echo "Waiting for ngrok API at ${NGROK_HOST}:${NGROK_PORT}..."
  until curl -s "http://${NGROK_HOST}:${NGROK_PORT}/api/tunnels" > /dev/null 2>&1; do
    sleep 1
  done
  WEBHOOK_URL=$(curl -s "http://${NGROK_HOST}:${NGROK_PORT}/api/tunnels" | jq -r '(.tunnels[]? | select(.proto=="https") | .public_url) // .tunnels[0].public_url // empty')
  if [ -z "$WEBHOOK_URL" ]; then
    echo "Could not get ngrok public URL"
    exit 1
  fi
  export WEBHOOK_URL
  echo "Using WEBHOOK_URL=$WEBHOOK_URL"
fi
exec "$@"
