variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "environment" {
  type    = string
  default = "development"
}

variable "artifact_registry_repository_id" {
  type        = string
  description = "Artifact Registry repository id (e.g. tools-n8n)."
}

variable "n8n_service_name" {
  type        = string
  description = "Cloud Run service name for n8n (must match GitHub Actions SERVICE_NAME)."
}

variable "n8n_runtime_sa_account_id" {
  type        = string
  description = "Runtime service account id (max 30 characters)."
}

variable "github_actions_deploy_sa_email" {
  type        = string
  description = "Service account used by GitHub Actions (JSON in GCP_SA_KEY). If set, Terraform grants roles/iam.serviceAccountUser on the n8n runtime SA so CI can gcloud run deploy with --service-account."
  default     = ""
}

variable "n8n_image" {
  type        = string
  description = "Container image: Artifact Registry ref, or docker.io/n8nio/n8n:tag for first bootstrap (Cloud Run only allows gcr.io, docker.pkg.dev, or docker.io—not docker.n8n.io)."
  default     = "docker.io/n8nio/n8n:latest"
}

variable "n8n_port" {
  type    = number
  default = 5678
}

variable "n8n_cpu" {
  type    = string
  default = "1"
}

variable "n8n_memory" {
  type    = string
  default = "1Gi"
}

variable "n8n_min_instances" {
  type    = number
  default = 0
}

variable "n8n_max_instances" {
  type    = number
  default = 2
}

variable "n8n_timeout_seconds" {
  type        = number
  description = "Cloud Run request timeout (workflows may need 900s or more)."
  default     = 900
}

variable "n8n_allow_unauthenticated" {
  type        = bool
  description = "If false, only authenticated callers can invoke Cloud Run (webhooks need IAM or a proxy)."
  default     = true
}

variable "n8n_generic_timezone" {
  type    = string
  default = "Europe/Madrid"
}

variable "n8n_public_url" {
  type        = string
  description = "Optional. After first apply, set to terraform output n8n_service_url (https://...) and apply again so WEBHOOK_URL/N8N_HOST are set for webhooks."
  default     = ""
}

variable "neon_api_key" {
  type        = string
  description = "Neon API key. If empty, use NEON_API_KEY in the environment running Terraform."
  sensitive   = true
  default     = ""
}

variable "neon_org_id" {
  type        = string
  description = "Neon organization id (Console → Organization settings)."
  default     = ""
}

variable "neon_history_retention_seconds" {
  type        = number
  description = "Neon PITR history (seconds). Free tier max is often 21600."
  default     = 21600
}

variable "neon_project_name" {
  type        = string
  description = "Logical Neon project name (e.g. tools-n8n-development)."
}

variable "neon_branch_name" {
  type    = string
  default = "development"
}

variable "neon_database_name" {
  type    = string
  default = "n8n"
}

variable "neon_role_name" {
  type        = string
  description = "DB role name (avoid reserved names)."
  default     = "n8n_app"
}

variable "neon_region_id" {
  type    = string
  default = "aws-eu-central-1"
}

variable "neon_pooler_enabled" {
  type    = bool
  default = true
}

variable "neon_connection_query_params" {
  type        = string
  description = "Extra URL params after sslmode."
  default     = ""
}

variable "neon_postgres_port" {
  type        = string
  description = "Postgres port for n8n env (Neon typically 5432)."
  default     = "5432"
}

variable "manage_neon" {
  type        = bool
  description = "Create Neon project/branch/DB and sync password to Secret Manager."
  default     = true
}

variable "external_postgres_host" {
  type        = string
  description = "When manage_neon is false: Postgres host."
  default     = ""
}

variable "external_postgres_port" {
  type    = string
  default = "5432"
}

variable "external_postgres_database" {
  type    = string
  default = ""
}

variable "external_postgres_user" {
  type    = string
  default = ""
}

variable "external_postgres_password" {
  type        = string
  description = "When manage_neon is false: Postgres password for Secret Manager."
  sensitive   = true
  default     = ""
}
