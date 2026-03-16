# planner-web

React SPA for the planner. Uses **@tools/shared**, **@tools/shared-planner**, and **planner-api** (GraphQL).

## Run

1. Start **planner-api** (with `APP_ACCESS_CODE` and optional Airtable env).
2. In planner-web: `npm run dev`. Vite proxies `/graphql` to `http://localhost:4000` by default.
3. Log in with the same access code you set in planner-api.

## Config

- `VITE_PLANNER_API_URL`: base URL of planner-api (e.g. `http://localhost:4000`). If unset, the dev server proxy is used for `/graphql`.

## Routes

- `/` — Planner (week view, tasks/habits)
- `/search` — Search across objectives, key results, tasks, recipes, ingredients, habits
- `/discovery` — Placeholder (Discovery not in planner-api yet)
- `/tasks`, `/tasks/:id`
- `/objectives`, `/objectives/:id`
- `/key-results`, `/key-results/:id`
- `/meals` — Meals planner (week grid)
- `/shopping` — Shopping list (toggle status Need/Have)
- `/recipes`, `/recipes/:id`
- `/habits`, `/habits/:id`
- `/analytics` — Summary KPIs + links to analysis
- `/analysis/okr`, `/analysis/tasks`, `/analysis/habits` — Analysis pages
- `/settings`
