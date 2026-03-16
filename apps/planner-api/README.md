# planner-api

GraphQL BFF for planner apps. Uses **@tools/planner-db** for data (Airtable by default).

## Run

```bash
# Required for auth (all GraphQL requests must send this)
export APP_ACCESS_CODE=your-secret-code

# Optional: Airtable (required for real data)
export AIRTABLE_PAT=...
export AIRTABLE_BASE_ID=...

npm start
# or: npm run dev
```

- **GraphQL**: `POST /graphql` with `Authorization: <APP_ACCESS_CODE>` (or `Bearer <APP_ACCESS_CODE>`).
- **Health**: `GET /health` (no auth).

## Schema

Queries: `tasks`, `task(id)`, `habits`, `habit(id)`, `habitTracking`, `objectives`, `objective(id)`, `keyResults`, `keyResult(id)`, `meals`, `meal(id)`, `recipes`, `recipe(id)`, `ingredients`, `ingredient(id)`, `shopping`, `shoppingItem(id)`, `discovery`, `discoveryIdea(id)`, `plannerSummary(week)`.

Mutations: `createTask`, `updateTask`, `deleteTask`, `toggleHabit`, `updateHabitTracking`, `deleteHabitTracking`, and equivalent create/update/delete for objectives, keyResults, meals, recipes, shopping, discovery ideas.

See `src/schema.graphql` for full types and inputs.
