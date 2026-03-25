output "artifact_registry_repository_url" {
  value = module.artifact_registry.repository_url
}

output "n8n_service_name" {
  value = module.n8n.service_name
}

output "n8n_service_url" {
  value       = module.n8n.uri
  description = "Public HTTPS URL. Set n8n_public_url in tfvars to this value and re-apply so WEBHOOK_URL is configured."
}

output "n8n_runtime_sa_email" {
  value = module.n8n_runtime_sa.email
}

output "n8n_postgres_password_secret_id" {
  value       = module.n8n_postgres_password_secret.secret_id
  description = "Secret Manager id for DB password (used by CLOUD_RUN_SET_SECRETS in CI if needed)."
}

output "n8n_encryption_key_secret_id" {
  value       = module.n8n_encryption_key_secret.secret_id
  description = "Secret Manager id for N8N_ENCRYPTION_KEY."
}

output "neon_project_id" {
  description = "Neon project id when manage_neon is true."
  value       = var.manage_neon ? module.neon[0].project_id : null
}

output "neon_branch_id" {
  value = var.manage_neon ? module.neon[0].branch_id : null
}

output "neon_database_url" {
  description = "Full Postgres URI when manage_neon is true (sensitive)."
  value       = var.manage_neon ? module.neon[0].database_url : null
  sensitive   = true
}
