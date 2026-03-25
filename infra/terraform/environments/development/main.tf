locals {
  common_labels = {
    app         = "n8n"
    environment = var.environment
    managed_by  = "terraform"
    project     = "tools"
  }

  effective_postgres_host     = var.manage_neon ? module.neon[0].endpoint_host : var.external_postgres_host
  effective_postgres_port     = var.manage_neon ? var.neon_postgres_port : var.external_postgres_port
  effective_postgres_database = var.manage_neon ? module.neon[0].database_name : var.external_postgres_database
  effective_postgres_user     = var.manage_neon ? module.neon[0].role_name : var.external_postgres_user

  n8n_host_from_url = trimspace(var.n8n_public_url) != "" ? split("/", trimprefix(trimprefix(var.n8n_public_url, "https://"), "http://"))[0] : ""

  n8n_env_from_public_url = trimspace(var.n8n_public_url) != "" ? {
    WEBHOOK_URL = var.n8n_public_url
    N8N_HOST    = local.n8n_host_from_url
  } : {}
}

resource "google_project_service" "required_services" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "iam.googleapis.com",
  ])

  project = var.project_id
  service = each.value
}

module "neon" {
  count  = var.manage_neon ? 1 : 0
  source = "../../modules/neon"

  org_id                    = var.neon_org_id
  history_retention_seconds = var.neon_history_retention_seconds
  project_name              = var.neon_project_name
  branch_name               = var.neon_branch_name
  database_name             = var.neon_database_name
  role_name                 = var.neon_role_name
  neon_region_id            = var.neon_region_id
  pooler_enabled            = var.neon_pooler_enabled
  connection_query_params   = var.neon_connection_query_params
}

module "artifact_registry" {
  source = "../../modules/artifact_registry"

  project_id    = var.project_id
  location      = var.region
  repository_id = var.artifact_registry_repository_id
  description   = "n8n images for ${var.environment}"
  depends_on    = [google_project_service.required_services]
}

module "n8n_runtime_sa" {
  source = "../../modules/service_account"

  project_id   = var.project_id
  account_id   = var.n8n_runtime_sa_account_id
  display_name = "n8n runtime (${var.environment})"
  roles = [
    "roles/secretmanager.secretAccessor",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter"
  ]

  depends_on = [google_project_service.required_services]
}

resource "google_service_account_iam_member" "github_actions_deploy_act_as_n8n_runtime" {
  count = trimspace(var.github_actions_deploy_sa_email) != "" ? 1 : 0

  service_account_id = module.n8n_runtime_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${var.github_actions_deploy_sa_email}"
}

module "n8n_postgres_password_secret" {
  source = "../../modules/secret_manager"

  project_id = var.project_id
  secret_id  = "n8n-postgres-password-${var.environment}"
  labels     = local.common_labels

  depends_on = [google_project_service.required_services]
}

module "n8n_encryption_key_secret" {
  source = "../../modules/secret_manager"

  project_id = var.project_id
  secret_id  = "n8n-encryption-key-${var.environment}"
  labels     = local.common_labels

  depends_on = [google_project_service.required_services]
}

resource "random_password" "n8n_encryption_key" {
  length  = 32
  special = false
}

resource "google_secret_manager_secret_version" "n8n_postgres_password" {
  secret      = module.n8n_postgres_password_secret.secret_name
  secret_data = var.manage_neon ? module.neon[0].role_password : var.external_postgres_password

  depends_on = [module.n8n_postgres_password_secret]
}

resource "google_secret_manager_secret_version" "n8n_encryption_key" {
  secret      = module.n8n_encryption_key_secret.secret_name
  secret_data = random_password.n8n_encryption_key.result

  depends_on = [module.n8n_encryption_key_secret, random_password.n8n_encryption_key]
}

check "database_config" {
  assert {
    condition = var.manage_neon || (
      trimspace(var.external_postgres_host) != "" &&
      trimspace(var.external_postgres_database) != "" &&
      trimspace(var.external_postgres_user) != "" &&
      trimspace(var.external_postgres_password) != ""
    )
    error_message = "Set manage_neon = true (and neon_api_key) or set external_postgres_* for an existing database."
  }
}

check "neon_api_key_when_managed" {
  assert {
    condition     = !var.manage_neon || trimspace(var.neon_api_key) != ""
    error_message = "When manage_neon is true, set neon_api_key (Neon account → API keys)."
  }
}

check "neon_org_id_when_managed" {
  assert {
    condition     = !var.manage_neon || trimspace(var.neon_org_id) != ""
    error_message = "When manage_neon is true, set neon_org_id (Neon Console → Organization settings → Organization ID)."
  }
}

module "n8n" {
  source = "../../modules/cloud_run_service"

  project_id            = var.project_id
  location              = var.region
  name                  = var.n8n_service_name
  image                 = var.n8n_image
  service_account_email = module.n8n_runtime_sa.email
  container_port        = var.n8n_port
  cpu                   = var.n8n_cpu
  memory                = var.n8n_memory
  min_instance_count    = var.n8n_min_instances
  max_instance_count    = var.n8n_max_instances
  timeout_seconds       = var.n8n_timeout_seconds
  allow_unauthenticated = var.n8n_allow_unauthenticated

  env_vars = merge(
    {
      DB_TYPE                               = "postgresdb"
      DB_POSTGRESDB_HOST                    = local.effective_postgres_host
      DB_POSTGRESDB_PORT                    = local.effective_postgres_port
      DB_POSTGRESDB_DATABASE                = local.effective_postgres_database
      DB_POSTGRESDB_USER                    = local.effective_postgres_user
      DB_POSTGRESDB_SSL_ENABLED             = "true"
      N8N_PORT                              = tostring(var.n8n_port)
      GENERIC_TIMEZONE                      = var.n8n_generic_timezone
      TZ                                    = var.n8n_generic_timezone
      NODE_ENV                              = "production"
      N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS = "true"
      N8N_PROTOCOL                          = "https"
    },
    local.n8n_env_from_public_url
  )

  secret_env_vars = {
    DB_POSTGRESDB_PASSWORD = {
      secret  = module.n8n_postgres_password_secret.secret_id
      version = "latest"
    }
    N8N_ENCRYPTION_KEY = {
      secret  = module.n8n_encryption_key_secret.secret_id
      version = "latest"
    }
  }

  depends_on = [
    module.n8n_runtime_sa,
    module.n8n_postgres_password_secret,
    module.n8n_encryption_key_secret,
    module.artifact_registry,
    google_secret_manager_secret_version.n8n_postgres_password,
    google_secret_manager_secret_version.n8n_encryption_key,
  ]
}
