# planner-mobile

Expo / React Native app for the planner. Uses **@tools/shared-planner** (domain models and hooks) and **planner-api** (GraphQL). UI is native (React Native components), not the web design system from @tools/shared.

## Structure

- `app/` — Expo Router screens: `index` (Planner), `tasks/`, `habits/`, `analytics/`
- `components/` — Native UI: `TaskCard.native.jsx`, `HabitList.native.jsx`
- `api/plannerApiClient.js` — GraphQL client to planner-api

## Run

1. Start **planner-api** and ensure it is reachable (e.g. same network or tunnel).
2. Set `EXPO_PUBLIC_PLANNER_API_URL` and `EXPO_PUBLIC_APP_ACCESS_CODE` (or use `.env` with expo-env).
3. `npm start` then press `i` for iOS or `a` for Android.

## Config

- `EXPO_PUBLIC_PLANNER_API_URL`: base URL of planner-api (e.g. `http://localhost:4000` or your deployed URL).
- `EXPO_PUBLIC_APP_ACCESS_CODE`: access code for planner-api auth.

## Reuse

- **@tools/shared-planner**: task status helpers, habit analytics, domain types. Use for filters and logic; render with native components.
- **planner-api**: all data via GraphQL (tasks, habits, objectives, key results, meals, recipes, shopping, plannerSummary).
