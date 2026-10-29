# Product Vision: My Food Manager

> Project: `my-food-manager`
> Status: Approved (2026-10-28)
> Last material change: 2026-10-28

## 1. Problem
Two pains, both daily:
- **Deciding what to cook.** Al has a growing library of normalized recipes (4 today, 100+ expected) but no pleasant way to browse it. Choosing the next meal means remembering what exists or asking Claude.
- **Shopping without missing things.** To know what is needed for the dishes he wants to cook, and to avoid forgetting an item at the store, Al uses manual lists or memory.

Current alternative: nothing in particular: memory, manual lists, and asking Claude/Telegram for recipes. Recipe capture is already solved (food-manager skill); consumption is not.

## 2. Vision Statement
A visual, fast, pocket-sized companion that makes "what do we cook next?" an inspiring two-minute decision and turns that decision into a complete shopping list, so nothing is forgotten at the store.

## 3. Target Users & Personas
- **Al, the planner-cook (primary).** Captures and curates recipes, decides what to cook, does the shopping. Uses it on phone daily, at home and in the store (poor signal).
- **Household partner (secondary).** Browses, rates and favorites recipes, checks the list. Separate reviews and favorites; no logins, chosen with a "who am I" picker.

## 4. Value Proposition
Compared with memory and manual lists: browse by photo with quick filters instead of recalling; get ideas from what is at home and from past favorites; pick recipes and get the exact missing ingredients; works offline in the store. Compared with asking Claude: instant, visual, no typing.

## 5. MVP Definition
- **Hypothesis:** if browsing recipes is visual and quick, and the shopping list builds itself from picked recipes minus the pantry, Al will plan every next meal and shop from the app instead of memory and manual lists.
- **In scope:**
  - Browse recipes in a visual grid with quick filters (category, tags, time, difficulty, favorites) and simple search.
  - Inspiration: surface ideas (e.g. "can cook now" from the pantry, favorites, surprise me).
  - Recipe detail with a cook-friendly view (ingredients, steps).
  - Pick recipes to cook ("my next cooks").
  - Auto-generated shopping list from the picked recipes minus the pantry, grouped for the store, with tick-off; bought items update the pantry.
  - Pantry management (have / to buy), without quantities.
  - Per-person stars, comments and favorites, and the "curated" flag, written back to Google Drive.
  - Read data from the Google Drive folder, cache it locally, and work offline (read, and list/pantry changes synced when back online).
  - Household picker between two people, no login.
- **Explicitly out of scope for the MVP:**
  - Meal-plan calendar (days/meals): will come later as a new data structure editable via Claude or the app.
  - In-app recipe import/editing: capture stays in Claude/Telegram via food-manager.
  - Pantry quantities and expiry: the schema is have/missing only.
  - Nutrition, prices, store integrations: not needed to test the hypothesis.
- **MVP done when:** Al can, on his phone, find and pick a recipe from the full library, get a complete shopping list for the picks, tick it off offline in a store, and have pantry and reviews saved back to Drive.

## 6. Success Metrics
- Behavioral (qualitative): Al opens the app every day to decide the next cook. Target: used on most days over a month.
- Behavioral (qualitative): the app is used on every store trip instead of memory or manual lists. Target: every trip over a month.
- Quality bar: a recipe is found or picked in under 2 minutes; the list loads offline.

## 7. Initial Feature Backlog

| # | Candidate feature | Persona | MVP? | Priority | Notes |
|---|---|---|---|---|---|
| 1 | Drive data sync & offline cache | Al, partner | yes | Must | Foundation: read Drive folder, cache, sync writes |
| 2 | Recipe browse, filters & search | Al, partner | yes | Must | Visual grid, quick filter chips |
| 3 | Recipe detail / cook view | Al, partner | yes | Must | Ingredients, steps, time |
| 4 | Inspiration ("what to cook") | Al | yes | Must | Can-cook-now, favorites, surprise me |
| 5 | Pick recipes ("my next cooks") | Al | yes | Must | Feeds the shopping list |
| 6 | Pantry | Al | yes | Must | have / to_buy |
| 7 | Shopping list from picks minus pantry | Al | yes | Must | Grouped by ingredient family, tick-off |
| 8 | Ratings, comments, favorites, curated | Al, partner | yes | Should | Per-person reviews file |
| 9 | Household picker | Al, partner | yes | Should | No login |
| 10 | Meal-plan calendar | Al | no | Could | New data domain; later |
| 11 | In-app recipe editing/import | Al | no | Could | Stays in Claude/Telegram |

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
- Hard limits: data contract is `food/_system/schema.md` (recipes schema 3, ingredients, pantry, reviews). Writes follow the optimistic rule (`updated` timestamp) and must coexist with the food-manager skill writing the same folder. Deployable on Vercel or equivalent free hosting.

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

## 12. Open Questions
- How should the shopping list treat pantry-less picks and unit-less ingredients (`to-taste`)? Owner: product-manager, at the shopping-list feature definition.
- What is the offline write-sync and conflict policy? Owner: tech-lead, in the architecture.
- Which Drive credential type fits best (service account vs token)? Owner: tech-lead.
- Can the "can cook now" ingredient match tolerate missing quantities (pantry has no quantities)? Owner: product-manager, at the inspiration feature.
