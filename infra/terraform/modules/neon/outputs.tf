output "project_id" {
  value = neon_project.this.id
}

output "branch_id" {
  value = neon_branch.this.id
}

output "endpoint_host" {
  value = neon_endpoint.this.host
}

output "database_name" {
  value = neon_database.this.name
}

output "role_name" {
  value = neon_role.this.name
}

output "role_password" {
  description = "Neon role password (sensitive)."
  value       = neon_role.this.password
  sensitive   = true
}

output "database_url" {
  description = "Postgres connection URI (sensitive)."
  value       = local.base_url
  sensitive   = true
}
