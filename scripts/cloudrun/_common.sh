#!/usr/bin/env bash

set -euo pipefail

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required env var: ${name}" >&2
    exit 1
  fi
}

artifact_image_ref() {
  local image_name="$1"
  echo "${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_ARTIFACT_REPO}/${image_name}:${IMAGE_TAG}"
}

ensure_gcloud() {
  command -v gcloud >/dev/null 2>&1 || {
    echo "gcloud is required (install Google Cloud SDK)" >&2
    exit 1
  }
}

ensure_docker() {
  command -v docker >/dev/null 2>&1 || {
    echo "docker is required" >&2
    exit 1
  }
}

configure_docker_auth() {
  gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet
}

# Tags and pushes the same digest as :latest so Terraform / tfvars that reference .../name:latest work.
# CI uses IMAGE_TAG=git sha; Artifact Registry then has both :<sha> and :latest.
push_latest_alias() {
  local image_name="$1"
  local tagged_ref="$2"
  local latest_ref
  latest_ref="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_ARTIFACT_REPO}/${image_name}:latest"
  echo "Tagging and pushing ${latest_ref} (alias of ${tagged_ref})"
  docker tag "${tagged_ref}" "${latest_ref}"
  docker push "${latest_ref}"
}

deploy_cloud_run() {
  local service_name="$1"
  local image_ref="$2"
  local port="$3"
  local env_vars_csv="${4:-}"
  local allow_unauthenticated="${5:-true}"

  local cmd=(
    gcloud run deploy "${service_name}"
    --project "${GCP_PROJECT_ID}"
    --region "${GCP_REGION}"
    --platform managed
    --image "${image_ref}"
    --port "${port}"
    --quiet
  )

  if [[ -n "${CLOUD_RUN_SERVICE_ACCOUNT:-}" ]]; then
    cmd+=(--service-account "${CLOUD_RUN_SERVICE_ACCOUNT}")
  fi

  if [[ "${allow_unauthenticated}" == "true" ]]; then
    cmd+=(--allow-unauthenticated)
  else
    cmd+=(--no-allow-unauthenticated)
  fi

  if [[ -n "${env_vars_csv}" ]]; then
    cmd+=(--set-env-vars "${env_vars_csv}")
  fi

  if [[ -n "${CLOUD_RUN_SET_SECRETS:-}" ]]; then
    cmd+=(--set-secrets "${CLOUD_RUN_SET_SECRETS}")
  fi

  "${cmd[@]}"
}
