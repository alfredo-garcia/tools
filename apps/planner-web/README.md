# planner-web

React SPA for the planner. Uses **@tools/shared**, **@tools/shared-planner**, and **planner-api** (GraphQL).

## Run

1. Start **planner-api** (with `APP_ACCESS_CODE` and optional Airtable env).
2. In planner-web: `npm run dev`. Vite proxies `/graphql` to `http://localhost:4000` by default.
3. Log in with the same access code you set in planner-api.

## Config

- `VITE_PLANNER_API_URL`: base URL of planner-api (e.g. `http://localhost:4000`). If unset, the dev server proxy is used for `/graphql`.
- Para usar la API desplegada en Cloud Run: crea `.env.dev` con `VITE_PLANNER_API_URL=https://...run.app` y ejecuta `npm run dev:cloud` (carga modo `dev` y apunta a esa URL).

## Routes and features

- `/` — **Planner**: week view with tasks per day (progress bar, status buttons, drag-and-drop between days), habits with today toggle, FAB to add task or event (events placeholder). Switches: show completed tasks, show full day.
- `/search` — Search across objectives, key results, tasks, recipes, ingredients, habits
- `/tasks` — Tasks list: search, date filters (Today/Week/Month/Unplanned/All), grouping by status, progress bar, FAB to create. Click task opens modal (Save to persist).
- `/tasks/:id` — Task detail (link from list).
- `/objectives` — OKRs list: progress bar, objective cards with KR progress, FAB to create objective.
- `/objectives/:id` — Objective detail: editable card, state buttons, delete, Key Results list with progress, FAB to create KR.
- `/key-results`, `/key-results/:id` — Key results list and detail (state buttons, delete, linked tasks, FAB to add task).
- `/meals` — Meals planner: week grid by slot (Breakfast/Lunch/Dinner), “+” per cell to add meal (modal), click meal to edit or delete.
- `/shopping` — Shopping list: search, filters (Status, Store, Category), category icons, Need/Have checkbox, FAB to add item.
- `/recipes` — Recipes: search, meal type and complexity filters, icon by meal type. `/recipes/:id` — Recipe detail with edit mode (Save to persist). (Recipe-ingredients API available: `recipeIngredients` query.)
- `/habits` — Habits list with KPIs (last 3 days, week, month success %) and overall bar; habit cards. `/habits/:id` — Habit detail with period KPIs and recent history.
- `/analytics` — Summary KPIs + links to analysis
- `/analysis/okr`, `/analysis/tasks`, `/analysis/habits` — Analysis pages
- `/settings`
- `/discovery` — Placeholder (Discovery not in planner-api yet)
