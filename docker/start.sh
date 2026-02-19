#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/../n8n"
echo "Starting n8n only."
exec docker compose up "$@"
