# n8n (local con Docker)

Servidor n8n en local con Docker. Un solo contenedor, datos persistentes en un volumen.

## Requisitos

- Docker y Docker Compose instalados.

## Uso

```bash
# Desde esta carpeta
docker compose up -d
```

Abre **http://localhost:5678**.

Para parar:

```bash
docker compose down
```

Los datos (cuenta, workflows, credenciales) se guardan en el volumen `n8n_data`. Al volver a hacer `docker compose up -d` todo sigue igual; no se repite el asistente inicial.

## Primera vez

La **primera** vez que entres en http://localhost:5678 verás el asistente de configuración (crear usuario propietario, etc.). Cuando lo completes, esa información se guarda en el volumen. En los siguientes arranques n8n cargará esos datos y entrarás directamente sin volver a pasar por el asistente.

## Configuración opcional

- Si quieres otra zona horaria, copia `.env.example` a `.env` y cambia `GENERIC_TIMEZONE` y `TZ` (valores IANA, ej. `Europe/Madrid`).
- Sin `.env` se usa por defecto `Europe/Madrid`.

## Workflows

Los workflows en JSON están en [workflows/](workflows/). Importa desde n8n: menú ⋮ → Import from File.
