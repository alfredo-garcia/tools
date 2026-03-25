resource "neon_project" "this" {
  name   = var.project_name
  org_id = var.org_id

  # Must match neon_endpoint.region_id or Neon returns 400 (project vs endpoint region mismatch).
  region_id = var.neon_region_id

  # Free tier max is often 21600s (6h); provider default 86400s can fail on create.
  history_retention_seconds = var.history_retention_seconds
}

resource "neon_branch" "this" {
  project_id = neon_project.this.id
  name       = var.branch_name
}

resource "neon_endpoint" "this" {
  project_id       = neon_project.this.id
  branch_id        = neon_branch.this.id
  type             = "read_write"
  pooler_enabled   = var.pooler_enabled
  region_id        = var.neon_region_id
}

resource "neon_role" "this" {
  project_id = neon_project.this.id
  branch_id  = neon_branch.this.id
  name       = var.role_name
}

resource "neon_database" "this" {
  project_id = neon_project.this.id
  branch_id  = neon_branch.this.id
  name       = var.database_name
  owner_name = neon_role.this.name
}

locals {
  base_url = format(
    "postgresql://%s:%s@%s/%s?sslmode=require%s",
    neon_role.this.name,
    urlencode(neon_role.this.password),
    neon_endpoint.this.host,
    neon_database.this.name,
    var.connection_query_params != "" ? "&${var.connection_query_params}" : ""
  )
}
