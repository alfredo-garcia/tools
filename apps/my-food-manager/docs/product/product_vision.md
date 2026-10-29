# Product Vision: My Food Manager

> Project: `my-food-manager`
> Status: Approved (2026-10-28); v2 updated 2026-10-29 at the user's request (MVP completed, new stage)
> Last material change: 2026-10-29
> User-facing name: "My Food" (project and workspace name stay My Food Manager)

## 1. Problem
Three pains, all daily:
- **Deciding what to cook.** Al has a growing library of normalized recipes (4 today, 100+ expected) but no pleasant way to browse it. Choosing the next meal means remembering what exists or asking Claude.
- **Shopping without missing things.** To know what is needed for the dishes he wants to cook, and to avoid forgetting an item at the store, Al uses manual lists or memory.

- **Planning ahead and keeping everything in sync (v2).** With the MVP done, the next pain is planning what to eat each day, knowing what to buy for that plan, and knowing what is already at home. Today these three live apart: decisions in Al's head, lists by hand, the pantry in memory.

Current alternative: nothing in particular: memory, manual lists, and asking Claude/Telegram for recipes. Recipe capture is already solved (food-manager skill); consumption is not.

## 2. Vision Statement
A visual, fast, pocket-sized companion that makes "what do we cook next?" an inspiring two-minute decision and turns that decision into a complete shopping list, so nothing is forgotten at the store. From v2: a connected day-to-day system where the recipes, a calendar of what will be eaten each day, the pantry and the shopping list all feed each other, so the list is always current with the plan and with what is at home.

## 3. Target Users & Personas
- **Al, the planner-cook (primary).** Captures and curates recipes, decides what to cook, does the shopping. Uses it on phone daily, at home and in the store (poor signal).
- **Household partner (secondary).** Browses, rates and favorites recipes, checks the list. Separate reviews and favorites; no logins, chosen with a "who am I" picker.

## 4. Value Proposition
Compared with memory and manual lists: browse by photo with quick filters instead of recalling; get ideas from what is at home and from past favorites; pick recipes and get the exact missing ingredients; works offline in the store. Compared with asking Claude: instant, visual, no typing.

## 5. MVP Definition
### MVP (completed)
- **Hypothesis:** if browsing recipes is visual and quick, and the shopping list builds itself from picked recipes minus the pantry, Al will plan every next meal and shop from the app instead of memory and manual lists.
- **Delivered:** Drive sync with offline cache, visual recipe list with filters and search, recipe detail, responsive layouts, and the main navigation (Recetas, Plan, Despensa, Perfil). The MVP is considered complete by the user as of 2026-10-29.
- **Out of scope for the MVP and still out:** in-app recipe import/editing (capture stays in Claude/Telegram via food-manager); nutrition, prices and store integrations.

### Stage 2: connected day-to-day (current)
- **Hypothesis:** if Al can plan what to eat each day on a calendar, get a shopping list that follows that plan, and keep the pantry counted, he will run his daily food routine from the app.
- **Direction (each item becomes its own feature, defined with product-manager):**
  - **Plan:** a calendar of what will be eaten each day (new data structure, replacing the old "meal-plan calendar" exclusion).
  - **Despensa:** one section, tabs for the pantry and the shopping list. The pantry is accounted for (what is at home); the shopping list is generated from the plan minus the pantry, grouped for the store, with tick-off; bought items update the pantry. Whether the pantry tracks quantities is an open question (§12).
  - **Perfil:** the person (household picker), favorites, ratings, comments and the "curated" flag, per person and written back to Drive.
  - Inspiration (can cook now, favorites, surprise me) and picking recipes feed the plan.
- **Everything is related:** the recipe library feeds the plan, the plan feeds the shopping list, the pantry reduces it, and purchases refill the pantry.
- **Done when (to be refined per feature):** Al can plan a week, see exactly what is missing, shop it offline in the store, and have plan, pantry and reviews saved back to Drive.

## 6. Success Metrics
- Behavioral (qualitative): Al opens the app every day to decide the next cook. Target: used on most days over a month.
- Behavioral (qualitative): the app is used on every store trip instead of memory or manual lists. Target: every trip over a month.
- Behavioral (qualitative, stage 2): the week is planned in the app and the shopping list comes from that plan, with no manual list. Target: most weeks over a month.
- Quality bar: a recipe is found or picked in under 2 minutes; the list loads offline.

## 7. Feature Backlog

| # | Candidate feature | Persona | Stage | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | Drive data sync & offline cache | Al, partner | MVP | Must | Done (001) | Foundation |
| 2 | Recipe browse, filters & search | Al, partner | MVP | Must | Done (003, 004, 005) | Visual grid, chips, search, responsive layout |
| 3 | Recipe detail / cook view | Al, partner | MVP | Must | Done (002) | |
| 4 | Main navigation | Al, partner | 2 | Must | Done (006) | Bottom bar and sidebar; Plan, Despensa, Perfil are placeholders |
| 5 | Inspiration ("what to cook") | Al | 2 | Should | Pending | Can-cook-now, favorites, surprise me |
| 6 | Meal-plan calendar (Plan) | Al | 2 | Must | Pending | New data domain in Drive |
| 7 | Pantry (Despensa) | Al | 2 | Must | Pending | Counted pantry; have/to_buy today in the schema |
| 8 | Shopping list from plan minus pantry (Despensa) | Al | 2 | Must | Pending | Grouped by ingredient family, tick-off, bought updates pantry |
| 9 | Profile: person, favorites, ratings, comments, curated (Perfil) | Al, partner | 2 | Should | Pending | Per-person reviews file; includes the household picker |
| 10 | In-app recipe editing/import | Al | later | Could | Pending | Stays in Claude/Telegram |

## 8. Product Principles
1. Visual first: photo and icon before text; every screen answerable in a glance.
2. Fast beats complete: quick filters and good defaults over configuration.
3. Drive is the source of truth: never invent a second data store; follow the food schema.
4. Works in the store: offline is a core behavior, not an extra.
5. Opinions stay personal: reviews and favorites are per person and never altered in recipes.

## 9. Constraints
- Team: Al with Claude Code; a few hours until it works; stack to be chosen by tech-lead (no preference stated).
- Budget: $0 or almost $0; free tiers only, no paid services.
- Timeline: none; "a few hours until it works".
- Platforms: responsive web PWA, mobile-first, usable on desktop (matches `SDLC.md`).
- Regulatory: none; personal food data. No logins; one server-side Google credential is acceptable.
- Hard limits: data contract is `food/_system/schema.md` (recipes schema 3, ingredients, pantry, reviews). Writes follow the optimistic rule (`updated` timestamp) and must coexist with the food-manager skill writing the same folder. Deployable on Vercel or equivalent free hosting. The plan and any pantry quantities need the Drive schema (`food/_system/schema.md`) to be extended with the food-manager skill, which owns it.

## 10. Scale & Quality Expectations
- Users: 2 at launch and after 12 months.
- Usage: daily, short sessions; supermarket use with poor connectivity.
- Data: 100+ recipes with photos in 12 months; low sensitivity (personal food data); retained indefinitely in Drive.
- Availability: an hour of downtime is merely annoying; offline cache covers the store.
- Offline: required for reading recipes and the shopping list and for list/pantry changes; multi-device (two phones, a desktop) via Drive, eventually consistent. Real-time sync: not needed.

## 11. Risks & Assumptions
- Assumes Drive API access with a server-side credential works within free limits for 2 users.
- Risk: concurrent writes with the food-manager skill or between the two users; mitigated by optimistic writes, but conflict handling needs design.
- Risk: offline writes made on two devices may conflict on pantry/reviews files.
- Assumption: ingredient catalog and families are rich enough to build a sensible grouped list; the catalog has only a few entries today.
- Risk: library is tiny (4 recipes), so filters and inspiration are untested at scale.
- Assumption: Spanish-only content and UI copy.

- Risk (v2): the plan, the pantry and the shopping list depend on each other; defining them one at a time can force rework. Mitigation: agree the shared data model (plan, pantry, list) before building the first of them.
- Note: the backlog statuses above come from the feature docs; items 5 to 9 had not been built when this version was written.

## 12. Open Questions
- How should the shopping list treat pantry-less picks and unit-less ingredients (`to-taste`)? Owner: product-manager, at the shopping-list feature definition.
- What is the offline write-sync and conflict policy? Owner: tech-lead, in the architecture.
- Which Drive credential type fits best (service account vs token)? Owner: tech-lead.
- Can the "can cook now" ingredient match tolerate missing quantities (pantry has no quantities)? Owner: product-manager, at the inspiration feature.
- Does the pantry track quantities ("contabilizar") or stay have/missing? Quantities would change the schema and the can-cook-now and shopping-list rules. Owner: product-manager, at the pantry feature definition.
- What is the unit of the plan (day with several meals, or one meal per day) and who can edit it? Owner: product-manager, at the plan feature definition.
- Where do the recipes picked for the plan ("my next cooks") live: the plan itself or a separate list? Owner: product-manager.
- Which schema changes (plan file, pantry quantities) and what write rules do they need? Owner: tech-lead with the food-manager skill.
