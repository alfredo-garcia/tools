# @tools/planner-db

Data layer for planner apps: repository interfaces and implementations. Used by **planner-api**; backend is swappable (Airtable today, Postgres/Neon later).

## Repositories

| Repository | Interface | Airtable implementation |
|------------|-----------|--------------------------|
| Tasks | list, getById, create, update, delete | `AirtableTasksRepository` |
| Habits | list | `AirtableHabitsRepository` |
| HabitTracking | list, create, update, delete | `AirtableHabitTrackingRepository` |
| Objectives | list, getById, create, update, delete | `AirtableObjectivesRepository` |
| KeyResults | list, getById, create, update, delete | `AirtableKeyResultsRepository` |
| Meals | list, getById, create, update, delete | `AirtableMealsRepository` |
| Recipes | list, getById, create, update, delete | `AirtableRecipesRepository` |
| Ingredients | list, getById, create, update, delete | `AirtableIngredientsRepository` |
| Shopping | list, getById, create, update, delete | `AirtableShoppingRepository` |
| Discovery (ideas backlog) | list, getById, create, update, delete | `AirtableDiscoveryRepository` |

## Usage

```js
import { getRepositories, createAirtableTasksRepository } from '@tools/planner-db'

const repos = getRepositories()
const tasks = await repos.tasks.list()

// Or a single repo
const tasksRepo = createAirtableTasksRepository()
```

## Configuration

- `DATA_BACKEND`: `airtable` (default) or `postgres`.
- **Airtable**: `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`; optional `AIRTABLE_BASE_ID_SHOPPING`, `AIRTABLE_BASE_ID_RECIPES`, and table name env vars (e.g. `AIRTABLE_TABLE_TASKS`, `AIRTABLE_TABLE_HABITS`).
- **Postgres (Neon)**: `DATABASE_URL` (connection string). Run the schema once: `psql $DATABASE_URL -f src/postgres/schema.sql`.
