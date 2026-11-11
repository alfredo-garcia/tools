# Shortcuts para HTTP Shortcuts (Android)

HTTP Shortcuts importa un comando **cURL** por vez: menú ⋮ → *Importar/Exportar* → *Importar desde cURL* → pega
uno de estos comandos → ponle nombre al shortcut. Sustituye `TU_TOKEN` por el token de GitHub (fine-grained, solo
este repo, permiso *Actions: write*); no lo guardes en el repo.

Respuesta correcta: `204`. Todas actúan sobre el día siguiente. `dry_run` va a `"0"`: con `"1"` solo simula.

## Reservar 7:30

```
curl -X POST 'https://api.github.com/repos/alfredo-garcia/tools/actions/workflows/smart-english-class-booking.yml/dispatches' -H 'Authorization: Bearer TU_TOKEN' -H 'Accept: application/vnd.github+json' -H 'X-GitHub-Api-Version: 2022-11-28' -H 'Content-Type: application/json' -d '{"ref":"main","inputs":{"dry_run":"0","slots":"07:30"}}'
```

## Reservar 9:00

```
curl -X POST 'https://api.github.com/repos/alfredo-garcia/tools/actions/workflows/smart-english-class-booking.yml/dispatches' -H 'Authorization: Bearer TU_TOKEN' -H 'Accept: application/vnd.github+json' -H 'X-GitHub-Api-Version: 2022-11-28' -H 'Content-Type: application/json' -d '{"ref":"main","inputs":{"dry_run":"0","slots":"09:00"}}'
```

## Reservar 10:30

```
curl -X POST 'https://api.github.com/repos/alfredo-garcia/tools/actions/workflows/smart-english-class-booking.yml/dispatches' -H 'Authorization: Bearer TU_TOKEN' -H 'Accept: application/vnd.github+json' -H 'X-GitHub-Api-Version: 2022-11-28' -H 'Content-Type: application/json' -d '{"ref":"main","inputs":{"dry_run":"0","slots":"10:30"}}'
```

## Cancelar las clases del día siguiente

```
curl -X POST 'https://api.github.com/repos/alfredo-garcia/tools/actions/workflows/smart-english-class-booking.yml/dispatches' -H 'Authorization: Bearer TU_TOKEN' -H 'Accept: application/vnd.github+json' -H 'X-GitHub-Api-Version: 2022-11-28' -H 'Content-Type: application/json' -d '{"ref":"main","inputs":{"dry_run":"0","cancelar":"1"}}'
```
