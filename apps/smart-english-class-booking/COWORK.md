# Instrucciones para Cowork — puesta en marcha de smart-english-class-booking

Pásale este fichero a Cowork. Objetivo: dejar el workflow
`.github/workflows/smart-english-class-booking.yml` funcionando y probado en **dry-run**.

**Reglas:** no hagas ninguna reserva real (siempre `dry_run=1`); no pegues secretos en el chat ni en commits;
si algo exige una decisión mía, pregúntame.

Repo: `alfredo-garcia/tools` (debe ser privado). Los workflows `workflow_dispatch` y `schedule` solo existen
para GitHub cuando el fichero está en la rama por defecto (`main`): **el PR debe estar mergeado antes del paso 4**.

## 1. Comprobar que el repo es privado

```bash
gh repo view alfredo-garcia/tools --json visibility
```

Si es `PUBLIC`, avísame antes de seguir (los logs mostrarían el nombre de la alumna).

## 2. Crear los 4 secrets

Web: Repo → Settings → Secrets and variables → Actions → *New repository secret*. O con `gh`
(te pedirá el valor por stdin; no lo pases como argumento):

```bash
gh secret set SMART_USER --repo alfredo-garcia/tools
gh secret set SMART_PASS --repo alfredo-garcia/tools
gh secret set TELEGRAM_BOT_TOKEN --repo alfredo-garcia/tools
gh secret set TELEGRAM_CHAT_ID --repo alfredo-garcia/tools
```

- `SMART_USER` / `SMART_PASS`: credenciales del portal Schoolpack (pídemelas a mí; no las inventes).
- `TELEGRAM_BOT_TOKEN`: el token de **@AlClawMainBot** (@BotFather → `/mybots` → AlClawMainBot → *API Token*).
- `TELEGRAM_CHAT_ID`: ID de mi chat con el bot. Cómo obtenerlo:
  1. Envía cualquier mensaje a @AlClawMainBot desde mi Telegram (ej. `hola`).
  2. Abre `https://api.telegram.org/bot<TOKEN>/getUpdates` y busca `"chat":{"id": 123456789, ...}`
     (usa `curl` en local; no dejes el token en el historial compartido).
     Si devuelve `result: []`, vuelve a escribirle al bot; si el bot tiene un webhook activo, `getUpdates` no
     devuelve nada hasta hacer `deleteWebhook` (pregúntame antes).
  3. Prueba el envío:
     ```bash
     curl -s "https://api.telegram.org/bot<TOKEN>/sendMessage" -d chat_id=<CHAT_ID> -d text="prueba"
     ```

Verifica: `gh secret list --repo alfredo-garcia/tools` debe mostrar los 4.

## 3. Mergear el PR

Confirma con `gh pr view` que el PR de la rama `smart-english-class-booking/001-initial-app` está listo y
pídeme el OK para mergear a `main`.

## 4. Lanzar el dry-run

```bash
gh workflow run "Smart English class booking" --repo alfredo-garcia/tools -f dry_run=1
sleep 10
gh run list --workflow "Smart English class booking" --repo alfredo-garcia/tools --limit 1
gh run watch <RUN_ID> --repo alfredo-garcia/tools
gh run view <RUN_ID> --repo alfredo-garcia/tools --log
```

(`target_date` vacío = mañana. Para forzar un día: `-f target_date=dd/mm/yy`; el portal solo permite hoy y mañana.)

## 5. Qué revisar

- **Log del run:** debe verse `Login OK`, las líneas `slot-grid: [...]` y, por slot, `✅ <clase> — DRY_RUN (no confirmado)`.
  Las tres clases deberían ser distintas (las 3 siguientes pendientes).
- **Telegram:** debe llegar `Smart · reservas dd/mm/yy [OK|PARCIAL] DRY RUN` con los slots y las "Programadas ese día".
- **Artifact `screenshots`:** `gh run download <RUN_ID> -n screenshots` → `final.png` (o `error.png` si falló).

## 6. Diagnóstico si falla

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| `Cloudflare bloquea la IP del runner` / timeout en `#vUSUCOD` | Cloudflare bloquea IPs de GitHub | Mira `error.png`. Opciones: self-hosted runner en casa, o ejecutar el script en una máquina propia con cron. Avísame. |
| Timeout esperando `wv0480.aspx` | Credenciales mal / captcha | Revisa `error.png`; verifica los secrets. No pruebes contraseñas a ciegas (bloqueo de cuenta). |
| Timeout en un selector (`#gxp0_ifrm`, `#vDIA`…) | El portal cambió o fue lento | Mira `error.png` y el log; abre un issue / PR con el selector corregido en `booker.py`. |
| `slot no ofertado` en todos | El día aún no está habilitado, o cambió la columna de hora | Revisa las líneas `slot-grid:` del log. |
| Nunca aparece un slot "lleno" | Aún no sabemos cómo se ve | Si en algún run ves una fila rara en `slot-grid:`, pásamela para ajustar `FULL_HINT`. |
| El cron no dispara | El workflow no está en `main`, o el repo estuvo 60 días inactivo | Comprueba pestaña Actions; reactiva el workflow. |

Cuando el dry-run salga bien, **pregúntame** antes de dar por bueno el modo real: el cron (lun/mié 05:40 Bogotá)
ya hace reservas reales a partir del siguiente lunes/miércoles tras el merge.
