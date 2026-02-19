#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
fi
echo "Starting n8n with ngrok (local)."
exec docker compose -f docker-compose.local.yml up "$@"
