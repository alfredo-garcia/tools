#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_common.sh"

require_env GCP_PROJECT_ID
require_env GCP_REGION
require_env GCP_ARTIFACT_REPO
require_env IMAGE_TAG
require_env ENVIRONMENT

ensure_gcloud
ensure_docker

SERVICE_NAME="${SERVICE_NAME:-tools-n8n}"
IMAGE_NAME="${IMAGE_NAME:-n8n}"
DOCKERFILE_PATH="${DOCKERFILE_PATH:-n8n/Dockerfile}"
PORT="${PORT:-5678}"
ALLOW_UNAUTHENTICATED="${ALLOW_UNAUTHENTICATED:-true}"

IMAGE_REF="$(artifact_image_ref "${IMAGE_NAME}")"

echo "Building ${IMAGE_REF} from ${DOCKERFILE_PATH}"
docker build -f "${DOCKERFILE_PATH}" -t "${IMAGE_REF}" .

configure_docker_auth

echo "Pushing ${IMAGE_REF}"
docker push "${IMAGE_REF}"
push_latest_alias "${IMAGE_NAME}" "${IMAGE_REF}"

echo "Deploying ${SERVICE_NAME} to Cloud Run (${ENVIRONMENT})"
deploy_cloud_run "${SERVICE_NAME}" "${IMAGE_REF}" "${PORT}" "" "${ALLOW_UNAUTHENTICATED}"

echo "Done."
