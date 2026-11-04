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
