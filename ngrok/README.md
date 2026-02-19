# ngrok (Docker)

Túnel ngrok en Docker. Por defecto expone `host.docker.internal:5678` (n8n en el host).

## Uso

Copia `.env.example` a `.env` y define `NGROK_AUTHTOKEN`. Luego:

```bash
docker compose up
```

La URL pública aparece en la salida; la API de inspección en http://localhost:4040.

Para unificar n8n + ngrok en un solo comando, usa los scripts en la carpeta [../docker/](../docker/).
