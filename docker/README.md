# docker – scripts unificados

Desde aquí puedes arrancar **solo n8n** o **n8n + ngrok** con un solo comando.

## Uso

```bash
# Solo n8n (desde esta carpeta)
./start.sh

# n8n + ngrok (webhooks por HTTPS)
./start.local.sh
```

Para `start.local.sh` edita `.env.local` en esta carpeta y define `NGROK_AUTHTOKEN` (descomenta la línea).

- n8n: http://localhost:5678  
- Inspección ngrok: http://localhost:4040  

Los datos de n8n se guardan en el volumen `n8n_data` (compartido con el proyecto [../n8n/](../n8n/)).
