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
- **Postgres (Neon)**: `DATABASE_URL` (connection string).
  - One-time schema init (includes `pgcrypto` extension):

```bash
psql "$DATABASE_URL" -f apps/planner-db/src/postgres/schema.sql
```

## Airtable → Neon migration (seed export/import)

This package includes two scripts to migrate Airtable content into Neon Postgres using **deterministic UUIDv5 ids** derived from Airtable `record.id` values (so linked-record relationships remain intact).

### 1) Export Airtable to seed JSON

Required env:
- `AIRTABLE_PAT`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_BASE_ID_RECIPES`
- Optional: `AIRTABLE_BASE_ID_SHOPPING` (defaults to `AIRTABLE_BASE_ID`)
- Optional: `AIRTABLE_TABLE_*` overrides (see `apps/planner-api/.env.example`)

Run:

```bash
node apps/planner-db/scripts/airtable-export-seed.mjs
# or choose output dir:
node apps/planner-db/scripts/airtable-export-seed.mjs --outDir ./apps/planner-db/seeds/my-export
```

Output:
- A timestamped folder under `apps/planner-db/seeds/`
- `meta.json` with counts per table

### 2) Import seed JSON into Neon

Required env:
- `DATABASE_URL` (Neon connection string)

Run:

```bash
node apps/planner-db/scripts/neon-import-seed.mjs --seedDir ./apps/planner-db/seeds/<your-export>
```

Options:
- `--truncate`: wipes tables (with CASCADE) before importing
- `--dry-run`: prints what it would do (no DB writes)
