# Personal Planner

App de planificación personal: OKRs, Key Results, Tareas (TODOs) y seguimiento de hábitos. Los datos se leen desde Airtable.

## Tablas de Airtable

Configura una base con estas tablas (los nombres de campos pueden variar; la app usa variantes comunes):

- **Objectives**: Objective Name, Description, Category, Status, Target Date, Start Date, Priority
- **Key Results**: Key Result Name, Description, Metric, Target Value, Current Value, Unit, Status, Deadline, Progress (%), Objective Link (link a Objectives)
- **Tasks**: Task Name, Description, Category, Priority, Status, Assignee, Due Date, Objectives, Key Result (links opcionales)
- **Habits**: Habit Name, Habit Description, Category, Frequency, Priority
- **Habit Tracking**: Habit (link a Habits), Was Successful?, Execution Date-Time

## Variables de entorno

Copia `.env.example` a `.env` y rellena:

- `APP_ACCESS_CODE`: código de acceso a la app
- `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`: acceso a la base
- `AIRTABLE_TABLE_OBJECTIVES`, `AIRTABLE_TABLE_KEY_RESULTS`, `AIRTABLE_TABLE_TASKS`, `AIRTABLE_TABLE_HABITS`, `AIRTABLE_TABLE_HABIT_TRACKING`: nombres exactos de cada tabla en tu base

## Desarrollo

1. Crea `.env` desde `.env.example` y rellena al menos `APP_ACCESS_CODE` (el servidor API carga `.env` al arrancar).
2. **Terminal 1** (API): `npm run dev:api` (por defecto puerto 3000). Si usas otro puerto: `PORT=3009 npm run dev:api`.
3. **Terminal 2** (front): `npm run dev`. Si la API está en otro puerto, usa el mismo: `API_PORT=3009 npm run dev` para que el proxy de Vite apunte a la API correcta.

Abre http://localhost:5173 e introduce el mismo valor que pusiste en `APP_ACCESS_CODE`.

**Si el login dice "Not found"**: la petición no está llegando al servidor API. Comprueba que la API está en marcha y que el puerto del proxy coincide (si la API va en 3009, arranca Vite con `API_PORT=3009 npm run dev`).

## Build y producción

```bash
npm run build
# Con Docker
docker compose up --build
```

## Rutas

- `/` — Dashboard (KPIs y gráficos)
- `/objectives`, `/objectives/:id` — Objetivos
- `/key-results`, `/key-results/:id` — Key Results
- `/tasks`, `/tasks/:id` — Tareas
- `/habits`, `/habits/:id` — Hábitos
- `/analysis/okr` — Análisis OKR
- `/analysis/tasks` — Análisis tareas
- `/analysis/habits` — Análisis hábitos
