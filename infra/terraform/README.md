# Terraform (GCP + Neon + n8n)

Terraform aprovisiona, por entorno (por ahora `development`):

- **Google Cloud**: Artifact Registry, Cloud Run (n8n), IAM, Secret Manager.
- **Neon** (provider `kislerdm/neon`): Postgres serverless; usuario y contraseña se sincronizan a Secret Manager; n8n recibe `DB_POSTGRESDB_*` y secretos por referencia.

Patrón alineado con el repo mosco: módulos `neon`, `artifact_registry`, `cloud_run_service`, `secret_manager`, `service_account`.

## Estructura

- `modules/` — módulos reutilizables
- `environments/<env>/` — raíz por entorno y state remoto (GCS + `prefix`)

## State remoto

1. Copiar [`environments/development/backend.hcl.example`](environments/development/backend.hcl.example) → `backend.hcl`
2. Ajustar `bucket` y `prefix`
3. `terraform init -backend-config=backend.hcl`

## Uso típico

```bash
cd infra/terraform/environments/development
cp backend.hcl.example backend.hcl
cp terraform.tfvars.example terraform.tfvars
terraform init -backend-config=backend.hcl
terraform plan
terraform apply
```

No commitear `terraform.tfvars` ni `backend.hcl` con datos reales.

## Variables sensibles (Neon / GCP)

- **`neon_api_key`**: Neon → Account settings → API keys.
- **`neon_org_id`**: Neon → Organization settings → Organization ID (obligatorio para crear proyectos vía API).
- Terraform puede usar la variable `neon_api_key` o la variable de entorno `NEON_API_KEY` al ejecutar `terraform` (el provider lo admite).

## Primer despliegue de la imagen

Cloud Run solo admite imágenes desde `docker.io`, `*.docker.pkg.dev` o `gcr.io` (no `docker.n8n.io`). Para el primer `apply` usa `n8n_image = "docker.io/n8nio/n8n:latest"` (equivalente a la imagen oficial). Después de que GitHub Actions suba la imagen a Artifact Registry, actualiza `n8n_image` a:

`REGION-docker.pkg.dev/PROJECT_ID/REPO_ID/n8n:latest`

y vuelve a aplicar.

## URL pública y webhooks

Tras el primer `apply`, copia el output `n8n_service_url` a `n8n_public_url` en `terraform.tfvars` y aplica de nuevo para fijar `WEBHOOK_URL` y `N8N_HOST` en Cloud Run.

## GitHub Actions — secretos del repositorio

| Secret | Descripción |
|--------|-------------|
| `GCP_PROJECT_ID` | ID del proyecto GCP |
| `GCP_REGION` | Región (ej. `europe-west1`) |
| `GCP_ARTIFACT_REPO` | ID del repositorio Artifact Registry (mismo que `artifact_registry_repository_id` en tfvars) |
| `GCP_SA_KEY` | JSON de cuenta de servicio con permisos para `artifactregistry`, `run.admin`, etc. |
| `N8N_SERVICE_URL` | (Opcional) URL base HTTPS del servicio n8n, para el job opcional de importación de workflows |
| `N8N_API_KEY` | (Opcional) API key de n8n si habilitas la API y el job de importación |

Terraform debe otorgar `roles/iam.serviceAccountUser` al **email** de la cuenta de deploy de GitHub sobre el runtime SA (`github_actions_deploy_sa_email` en tfvars).

## Credenciales de integraciones vs workflows en Git

- **Postgres (Neon)** y **`N8N_ENCRYPTION_KEY`**: gestionados por Terraform y Secret Manager.
- **Workflows JSON en Git**: puedes versionar en `n8n/workflows/`; importar en la UI o usar el job opcional en [`.github/workflows/deploy-n8n-cloudrun.yml`](../../.github/workflows/deploy-n8n-cloudrun.yml) (manual `workflow_dispatch` con `import_workflows=true`; la forma exacta del API puede variar según la versión de n8n).
- **Credenciales OAuth / APIs de terceros**: n8n las guarda cifradas en la base con `N8N_ENCRYPTION_KEY`; no se generan desde Terraform. Opciones: export/import cifrado con la misma clave, o configuración manual en la UI.

## Cloud Run: imagen no aceptada (`docker.n8n.io`)

Si ves un 400 pidiendo `gcr.io`, `docker.pkg.dev` o `docker.io`, cambia `n8n_image` a `docker.io/n8nio/n8n:latest` o a tu imagen en Artifact Registry (no uses `docker.n8n.io/...` salvo [repositorio remoto en Artifact Registry](https://cloud.google.com/artifact-registry/docs/repositories/remote-repo)).

## Neon: errores frecuentes

- **`trying to create an endpoint in a different region than the region associated with the project`**: El proyecto y el endpoint deben usar la misma `neon_region_id`. El módulo fija `region_id` en `neon_project` y en `neon_endpoint` con la misma variable. Si antes el proyecto se creó sin región explícita (p. ej. Neon eligió `aws-us-east-1`) y en tfvars tenías otra región en el endpoint, alinea `neon_region_id` con la región real del proyecto en la consola de Neon, o borra el proyecto en Neon y vuelve a aplicar con la región deseada.
- **`role with that name already exists`**: El nombre `neon_role_name` debe ser único en la rama. Evita `neondb_owner` si Neon ya creó ese rol por defecto; usa otro nombre (p. ej. `n8n_tools_app`). Tras un apply a medias, revisa `terraform state list` y, si hace falta, elimina el rol huérfano en la consola de Neon o importa el recurso al state.
