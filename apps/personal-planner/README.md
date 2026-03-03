# Personal Planner

App de planificación personal: OKRs, Key Results, Tareas (TODOs) y seguimiento de hábitos. Los datos se leen desde Airtable.

## Tablas de Airtable

Configura una base con estas tablas (los nombres de campos pueden variar; la app usa variantes comunes):

- **Objectives**: Objective Name, Description, Category, Status, Target Date, Start Date, Priority
- **Key Results**: Key Result Name, Description, Metric, Target Value, Current Value, Unit, Status, Deadline, Progress (%), Objective Link (link a Objectives)
- **Key Result Tracking**: Key Result (link a Key Results), Date, Current Value, Progress (%) (opcionales). Se crea un registro al actualizar "Current value" o "Progress (%)" en un Key Result, con snapshot de valor y progreso.
- **Tasks**: Task Name, Description, Category, Priority, Status, Assignee, Due Date, Objectives, Key Result (links opcionales)
- **Habits**: Habit Name, Habit Description, Category, Frequency, Priority, Habit type (opcional: "Good" o "Bad" para separar en Planner en Good Habits / Bad Habits)
- **Habit Tracking**: Habit (link a Habits), Was Successful?, Execution Date-Time
- **Shopping List**: Name, Category, Description, Image (Web), Name ES, Notes, Priority, Quantity, Status (Need / Have), Store, Unit (puede estar en otra base; usa `AIRTABLE_BASE_ID_SHOPPING`)

## Variables de entorno

Copia `.env.example` a `.env` y rellena:

- `APP_ACCESS_CODE`: código de acceso a la app
- `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`: acceso a la base principal
- `AIRTABLE_BASE_ID_SHOPPING` (opcional): si la tabla Shopping List está en **otra base**, define aquí el Base ID de esa base; el mismo PAT debe tener acceso a ambas bases
- `AIRTABLE_TABLE_OBJECTIVES`, `AIRTABLE_TABLE_KEY_RESULTS`, `AIRTABLE_TABLE_TASKS`, `AIRTABLE_TABLE_HABITS`, `AIRTABLE_TABLE_HABIT_TRACKING`, `AIRTABLE_TABLE_KEY_RESULT_TRACKING`, `AIRTABLE_TABLE_SHOPPING`: nombres exactos de cada tabla en tu base
- `ENABLE_KEY_RESULT_TRACKING`: si no usas la tabla Key Result Tracking o el PAT no tiene permiso de escritura, pon `false` para desactivar el registro de tracking al actualizar "Current value".

## Desarrollo

1. Crea `.env` desde `.env.example` y rellena al menos `APP_ACCESS_CODE` (el servidor API carga `.env` al arrancar).
2. **Terminal 1** (API): `npm run dev:api` (por defecto puerto 3000). Si usas otro puerto: `PORT=3009 npm run dev:api`.
3. **Terminal 2** (front): `npm run dev`. Si la API está en otro puerto, usa el mismo: `API_PORT=3009 npm run dev` para que el proxy de Vite apunte a la API correcta.

Abre http://localhost:5173 e introduce el mismo valor que pusiste en `APP_ACCESS_CODE`.

**Si el login dice "Not found"**: la petición no está llegando al servidor API. Comprueba que la API está en marcha y que el puerto del proxy coincide (si la API va en 3009, arranca Vite con `API_PORT=3009 npm run dev`).

## API (backend)

Todas las rutas `/api/*` (validate, tasks, objectives, habits, etc.) se sirven mediante **una sola** Serverless Function en Vercel (`api/index.js`), que enruta por path a los handlers en `server/handlers/`. Así se respeta el límite de 12 funciones del plan Hobby. En desarrollo local, `server.js` usa el mismo `api/index.js`.

## Build y producción

```bash
npm run build
# Con Docker
docker compose up --build
```

## Vista Planner

En la ruta `/` (Planner), las secciones **Tasks**, **Good Habits** y **Bad Habits** son colapsables. Al colapsar cualquiera de ellas se mantiene visible la primera fila: barra de progreso (Tasks) o iconos contadores 1–5 (Good/Bad Habits). Los títulos "Good Habits" y "Bad Habits" muestran solo el texto, sin icono en el encabezado (los iconos quedan en la fila de contadores).

En la cabecera de cada día se muestra el nombre del día y la fecha en formato **Monday March 2nd** (mes y día con ordinal). Indicadores en la cabecera:
- **Estrella**: todas las tareas del día completadas.
- **Fuego**: 5 o más Good Habits completados ese día.
- **Caca** (icono de mierda): 2 o más Bad Habits completados ese día.

## Rutas

- `/` — Planner (tareas por día y hábitos)
- `/objectives`, `/objectives/:id` — Objetivos
- `/key-results`, `/key-results/:id` — Key Results
- `/tasks`, `/tasks/:id` — Tareas
- `/habits`, `/habits/:id` — Hábitos
- `/analysis/okr` — Análisis OKR
- `/analysis/tasks` — Análisis tareas
- `/analysis/habits` — Análisis hábitos
- `/shopping` — Lista de la compra (filtros por Status, Priority, Store, Category; búsqueda; checkbox Need/Have; edición en modal)

## PWA

La app es instalable como PWA. En el manifest se definen **shortcuts** que permiten abrir directamente: Discovery (`/discovery`), OKRs (`/objectives`), Tasks (`/tasks`) y Shopping (`/shopping`). Tras instalar la PWA, los shortcuts suelen mostrarse al mantener pulsado el icono de la app (Android) o en el menú contextual del icono (escritorio).
