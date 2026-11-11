# smart-english-class-booking

Reserva automática de clases del portal Smart / Schoolpack (GeneXus,
`https://schoolpack.smart.edu.co/idiomas/alumnos.aspx`) con Playwright, ejecutada por GitHub Actions.

Los lunes (para el martes) y miércoles (para el jueves) reserva los slots **07:30, 09:00 y 10:30**.
Se intenta 4 veces al día, hora Bogotá: **05:40** (espera hasta las 06:00), **07:00**, **11:00** y **14:00**,
porque GitHub puede retrasar o saltarse un cron. Si la siguiente clase pendiente es un **QUIZ**, no reserva nada.
El resultado llega por Telegram (en los runs programados solo si hubo algo que reservar o un problema).

- Script: [booker.py](booker.py) · dependencias: [requirements.txt](requirements.txt)
- Workflow: [.github/workflows/smart-english-class-booking.yml](../../.github/workflows/smart-english-class-booking.yml)
  (en la raíz del repo, con `working-directory: apps/smart-english-class-booking`)
- Puesta en marcha (secrets, dry-run, diagnóstico): **[COWORK.md](COWORK.md)** — instrucciones listas para pasar a Cowork.

> El repo `tools` debe ser **privado**: los logs de Actions muestran el nombre de la alumna.

## Reglas v1

1. Día objetivo = mañana (zona `America/Bogota`), o `TARGET_DATE` si se fuerza.
2. Slots deseados: 07:30, 09:00, 10:30. Si uno no está disponible se reservan los demás.
3. Siempre se toma la siguiente clase *Pendiente*. Si es un QUIZ **no se reserva nada** (los quizzes se agendan a mano; sede 70).
4. Idempotente: un slot ya programado ese día no se repite; si ya hay un quiz ese día no se reserva nada. Por eso son seguros los reintentos del cron.
5. Cada reserva se verifica contra el estado real (la clase aparece en *Programadas*); no se fía solo de que el popup se cierre.

## Detalles del portal

- Login: `#vUSUCOD`, `#vPASS`, `#BUTTON1` → popup informativo `#gxp0_ifrm` (msje.aspx, cerrar con su BUTTON1) → `wv0480.aspx` → menú (imagen `PROGRAMACION.png`) "Programación" → `wv0527.aspx`
  (fila del plan en `#W0030Grid1ContainerTbl`, botón `#W0030BUTTON1` Iniciar).
- Popup `#gxp0_ifrm` (wv0613): filtro `#vTPEAPROBO` (2 = Pendientes, 3 = Programadas), grilla `#Grid1ContainerTbl`
  (col 5 descripción, 10 estado, 11 fecha `dd/mm/yy HH:MM`), botones BUTTON1 Asignar / BUTTON2 Cancelar / BUTTON3 Regresar.
- Popup `#gxp1_ifrm` (wv0614a): sede `#vREGCONREG` (59 = MANIZALES clases, 70 = quizzes), día `#vDIA`
  (solo hoy y mañana), grilla de slots (col 2 = hora inicial), BUTTON1 Confirmar / BUTTON3 Regresar.
- Al confirmar un quiz no aparece ningún mensaje: la clase pasa a "Programada".

## Robustez (respecto al borrador inicial)

- Las filas se identifican por su índice real de `<tr>` (no por su posición tras filtrar), y se ignoran filas vacías.
- En vez de esperas fijas tras cada cambio AJAX, se espera a que la grilla deje de cambiar (`settle`).
- Los popups se esperan con un selector interno listo y se comprueba que se cierren (`detached`).
- Horas normalizadas (`7:30`, `07:30 AM` → `07:30`); slot lleno detectado con una heurística (`FULL_HINT`) y
  se loguea la grilla de slots completa (`slot-grid:`) para afinarla: **aún no se ha visto un slot lleno**.
- Si un slot falla con excepción se reinicia la sesión y se comprueba qué quedó programado antes de seguir.
- En `DRY_RUN` se simulan las 3 clases pendientes distintas (no la misma tres veces).
- Detección explícita de bloqueo de Cloudflare al cargar el login.
- Capturas (`error.png`, `final.png`) se suben siempre como artifact `screenshots`.

## Local

Requiere Python 3.12 (con 3.13 `greenlet==3.0.3` no compila). Copia `.env.example` a `.env` (ignorado por git) y rellénalo:

```bash
uv venv -p 3.12 .venv && uv pip install -r requirements.txt -p .venv/bin/python && .venv/bin/python -m playwright install chromium
set -a && . ./.env && set +a && DRY_RUN=1 SHOTS_DIR=shots .venv/bin/python booker.py
```

`TELEGRAM_CHAT_ID` es el id de **tu** usuario (no el del bot); si no, Telegram responde 403.

## Pendiente: v2 (NO implementada)

Reintentar cada 2 h, **solo si ese día no hay los 3 slots (07:30, 09:00, 10:30) reservados**:

- Si hay 2, 1 o 0 reservados: comprobar primero que **los 3 slots están libres** (o ya son nuestros);
  solo entonces cancelar las reservas de ese día y reservar los 3 seguidos
  (el portal no permite clases no consecutivas).
- Excepción: si ese día hay un quiz, no reintentar.
- Pasos técnicos previstos: leer slots libres de la sede 59 sin confirmar, cancelar con BUTTON2 (Cancelar) en el
  filtro *Programadas*, y añadir un `cron` cada 2 h (o un job que se re-agenda) al workflow.

## Mensajes de Telegram

Siempre con un semáforo y la lista de clases (`build_report` en `booker.py`):

- 🟢 Reservadas tus próximas N clases (hora · clase).
- 🟡 Reserva parcial de N clases, con el motivo: no había más horarios, o te toca un Quiz.
- 🟡 No pude reservar porque tu próxima clase (o ese día) es un Quiz.
- 🔴 No se pudieron reservar clases (sin horarios, sin clases pendientes o error).
- 🔴 No reservé porque ya había clases reservadas previamente.

Si entre las 3 clases hay un Quiz, se reservan las anteriores y se para en él. En los runs programados
no se envía mensaje cuando no había nada que hacer (ya reservado o quiz pendiente).

## Disparo externo (cron-job.org)

Los cron de GitHub llegan con horas de retraso o se pierden, así que el disparo fiable es externo: un
cron con zona `America/Bogota` que llama a la API (lunes y miércoles, 05:40, 07:00, 11:00 y 14:00):

```
POST https://api.github.com/repos/alfredo-garcia/tools/actions/workflows/smart-english-class-booking.yml/dispatches
Authorization: Bearer <token fine-grained, solo este repo, permiso Actions: write>
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2022-11-28
Content-Type: application/json

{"ref":"main","inputs":{"dry_run":"0","wait_until":"06:00","quiet":"1"}}
```

- `dry_run` **debe ir a `"0"`**: por defecto un disparo manual es un simulacro.
- `wait_until: "06:00"` solo espera en el run de las 05:40; en los demás ya es más tarde y no espera.
- Respuesta correcta: `204 No Content`. Los cron de GitHub se mantienen como respaldo (el script es idempotente).

## Errores legibles

Los errores técnicos (timeouts de Playwright, volcados del popup) no van a Telegram: se traducen con `explain()`
a frases como "el portal no respondió a tiempo mientras intentaba abrir Programación". Si el portal no confirma
una reserva se cita solo su mensaje real (sin la lista de sedes) o "sin ningún mensaje"; el volcado completo y
una captura (`no-confirmo-HHMM.png`) quedan en el log y el artifact. El login se reintenta hasta 3 veces ante timeouts.
Los ids de sede se nombran en `SEDES`.

## Acciones a demanda (HTTP Shortcuts u otra app)

Mismo endpoint y cabeceras que el disparo externo; solo cambia el cuerpo. Todas actúan sobre el **día siguiente**
(o `target_date`), y `dry_run` debe ir a `"0"` para que sea real (con `"1"` solo simula y lo cuenta por Telegram).

| Acción | Cuerpo |
|---|---|
| Reservar las 3 (07:30, 09:00 y 10:30) | `{"ref":"main","inputs":{"dry_run":"0"}}` |
| Reservar 7:30 | `{"ref":"main","inputs":{"dry_run":"0","slots":"07:30"}}` |
| Reservar 9:00 | `{"ref":"main","inputs":{"dry_run":"0","slots":"09:00"}}` |
| Reservar 10:30 | `{"ref":"main","inputs":{"dry_run":"0","slots":"10:30"}}` |
| Cancelar las clases del día siguiente | `{"ref":"main","inputs":{"dry_run":"0","cancelar":"1"}}` |

- `slots` admite varios (`"07:30,09:00"`); un valor no válido no reserva nada y avisa por Telegram.
- Cancelar **no toca los quizzes** (se avisa en el mensaje). Pruébalo antes con `"dry_run":"1"`: solo lista lo que cancelaría.
- Cancelar aún no se ha probado contra el portal real (BUTTON2 *Cancelar* de la grilla *Programadas*).
- Si un slot suelto rompe la regla de clases consecutivas, el portal lo rechaza y el mensaje lo cuenta.
- En HTTP Shortcuts: método POST, cabeceras `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`,
  cuerpo JSON como arriba; la respuesta correcta es `204`. Un shortcut por acción.
