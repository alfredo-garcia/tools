# planner-api

GraphQL BFF for planner apps. Uses **@tools/planner-db** for data (Airtable by default).

## Run

```bash
# Required for auth (all GraphQL requests must send this)
export APP_ACCESS_CODE=your-secret-code

# Optional: Airtable (required for real data)
export AIRTABLE_PAT=...
export AIRTABLE_BASE_ID=...

# Calendar (Google Calendar) — required to list calendar events
# Tokens are read from Airtable "Settings" table (Key/Value) using CAL_1_*, CAL_2_*, CAL_3_* keys.
export AIRTABLE_BASE_ID_SETTINGS=...   # optional, defaults to AIRTABLE_BASE_ID
export GOOGLE_CLIENT_ID=...
export GOOGLE_CLIENT_SECRET=...
export GOOGLE_CALENDAR_REDIRECT_URI=... # optional; used only if you later implement OAuth flows

npm start
# or: npm run dev
```

- **GraphQL**: `POST /graphql` with `Authorization: <APP_ACCESS_CODE>` (or `Bearer <APP_ACCESS_CODE>`).
- **Health**: `GET /health` (no auth).

## Deploy (Google Cloud Run)

El contexto de build debe incluir la dependencia local `planner-db`. Desde la raíz del repo:

```bash
docker build -f apps/planner-api/Dockerfile -t planner-api ./apps
```

Configura las variables de entorno en Cloud Run (o Secret Manager): `APP_ACCESS_CODE`, `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`, etc. El servicio usa `PORT` que Cloud Run inyecta automáticamente.

## Schema

Queries: `tasks`, `task(id)`, `habits`, `habit(id)`, `habitTracking`, `calendarEvents(timeMin,timeMax)`, `objectives`, `objective(id)`, `keyResults`, `keyResult(id)`, `meals`, `meal(id)`, `recipes`, `recipe(id)`, `ingredients`, `ingredient(id)`, `shopping`, `shoppingItem(id)`, `discovery`, `discoveryIdea(id)`, `plannerSummary(week)`.

Mutations: `createTask`, `updateTask`, `deleteTask`, `toggleHabit`, `updateHabitTracking`, `deleteHabitTracking`, and equivalent create/update/delete for objectives, keyResults, meals, recipes, shopping, discovery ideas.

See `src/schema.graphql` for full types and inputs.
