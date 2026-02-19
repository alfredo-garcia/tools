# n8n (local con Docker)

Servidor n8n en local con Docker. Un solo contenedor, datos persistentes en el volumen `n8n_data`.

## Requisitos

- Docker y Docker Compose instalados.

## Uso

**Desde la carpeta [../docker/](../docker/)** (recomendado):

```bash
# Solo n8n
./start.sh

# n8n + ngrok (webhooks por HTTPS)
./start.local.sh
```

Desde aquí (solo n8n):

```bash
docker compose up -d
```

Abre **http://localhost:5678**.

Los datos (cuenta, workflows, credenciales) se guardan en el volumen `n8n_data`. Si usas también `docker/start.local.sh`, se reutiliza el mismo volumen.

## Primera vez

La **primera** vez que entres en http://localhost:5678 verás el asistente de configuración (crear usuario propietario, etc.). Cuando lo completes, esa información se guarda en el volumen.

## Configuración opcional

Copia `.env.example` a `.env` y cambia `GENERIC_TIMEZONE` y `TZ` (valores IANA, ej. `Europe/Madrid`). Sin `.env` se usa por defecto `Europe/Madrid`.

## Workflows

Los workflows en JSON están en [workflows/](workflows/). Importa desde n8n: menú ⋮ → Import from File.
