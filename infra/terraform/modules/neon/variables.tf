variable "org_id" {
  type        = string
  description = "Neon organization id (Console → Organization settings). Required by the Neon API to create projects."
}

variable "history_retention_seconds" {
  type        = number
  description = "PITR backup history retention (seconds). Free tier max is often 21600 (6h); provider default 86400 can exceed plan limits."
  default     = 21600
}

variable "project_name" {
  type        = string
  description = "Neon project name (logical name in Neon console)."
}

variable "branch_name" {
  type        = string
  description = "Branch name inside the Neon project (e.g. development, main)."
}

variable "database_name" {
  type        = string
  description = "Postgres database name to create."
}

variable "role_name" {
  type        = string
  description = <<-EOT
    Name of the Neon role that owns the database (API DB user).
    Avoid reserved names; use something like n8n_app.
  EOT
}

variable "neon_region_id" {
  type        = string
  description = "Neon region id for the project and endpoint (e.g. aws-us-east-1). Project and endpoint must use the same region."
  default     = "aws-us-east-1"
}

variable "pooler_enabled" {
  type        = bool
  description = "Enable Neon connection pooler (recommended for serverless clients)."
  default     = true
}

variable "connection_query_params" {
  type        = string
  description = "Extra query string after sslmode (e.g. channel_binding=require). Leading & added automatically if non-empty."
  default     = ""
}
