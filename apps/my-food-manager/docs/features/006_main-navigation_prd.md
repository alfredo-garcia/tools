# PRD: Main Navigation

> Project: `my-food-manager`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-10-28)
> Source feature doc: `006_main-navigation.md`
> Master doc referenced: `docs/functional-spec.md` (domain `library`; §4 Navigation Structure)
> Status: Approved (2026-10-29)
> Branch: `my-food-manager/006-main-navigation`; commits start with `[my-food-manager/006]`

## 1. Summary
Adds persistent navigation to the app: a bottom bar on small windows and a collapsible left sidebar on medium and large ones, both with four destinations: Recetas (`/`), Plan (`/plan`), Despensa (`/ingredients`) and Perfil (`/profile`). Plan, Despensa and Perfil are placeholder screens that say "Próximamente". The goal is only to establish the navigation structure so later features (meal plan, pantry and shopping list, profile) plug into it. It is for Al and his household partner.

## 2. Background & Context
- Today the app has no persistent navigation. The recipe list is at `/` and the recipe detail at `/recipes/<id>`; the list is mounted in the `(library)` layout so it stays in place while the detail opens over or beside it (functional spec §4, SCR-library-list, SCR-recipe-detail). The three layouts are small (under 640 px), medium (640 to 1279 px) and large (1280 px and above).
- The functional spec §4 states "The bottom bar and the sidebar are still to come."
- `docs/context/ui_standards.md` §9 describes a navigation container of four destinations "Inicio, Recetas, Lista, Despensa" with the sidebar above 1024 px. That is superseded by this PRD (see §13).
- Trigger: the MVP is complete; the product vision is being extended (meal plan, shopping list and pantry as one connected system). This feature only lays the navigation structure for it.

## 3. Goals & Success Metrics
- G1: from any section, any other section is one tap away.
- G2: the user always knows which section they are in.
- G3: the existing recipe experience is unchanged.
- Metric (manual): on a phone-sized and on a desktop viewport, each of the four options reaches its address in one tap, the current option is highlighted, and the recipe list, filters, search and detail behave as before.

## 4. Non-Goals / Out of Scope
- Real content for Plan, Despensa and Perfil; the Despensa/Lista tabs; calendar plan; pantry; shopping list; profile content (user, favorites, ratings).
- "Who am I" picker, badges or counters on options, changes to the sync badge or offline status.
- Changing the existing addresses of the list and the detail.
- Keyboard shortcuts, gestures between sections, nested menus.
- Updating the product vision (separate step).

## 5. User Stories & Acceptance Criteria

**US-1 Bottom bar on small windows.** As Al, I want a bar at the bottom with my sections so I can switch with my thumb.
1. Given a window under 640 px on any section except an open recipe detail, then a bar fixed to the bottom shows four buttons in this order: Recetas, Plan, Despensa, Perfil, each with an icon and its text.
2. Given the bar, when I tap a button, then the app goes to that section's address and the button is highlighted.
3. Given I am in a section, then exactly one button is highlighted, and it is also marked as the current page for assistive technology.
4. Given content that scrolls, then it can scroll fully above the bar and is never hidden behind it.

**US-2 Sidebar on medium and large windows.** As Al, I want a left menu on bigger screens.
1. Given a window of 640 px or more, then a sidebar on the left shows the same four options in the same order and no bottom bar is shown.
2. Given the sidebar is expanded, then each option shows icon and text; given it is collapsed, only the icon, with the option name available as an accessible name and a tooltip-free layout (no hover-only information).
3. Given the sidebar, when I tap the collapse/expand control, then it switches state.
4. Given no saved choice, when the window is large, then the sidebar starts expanded; when it is medium, it starts collapsed.
5. Given I changed the state, when I reload the app or return to it on that device, then the sidebar is in the state I left it.
6. Given I choose a state, then it applies to both medium and large windows on that device.

**US-3 Placeholder sections.** As Al, I want the new sections to exist so I can see where things will go.
1. Given I go to `/plan`, `/ingredients` or `/profile`, then I see the section's name as the title and the message "Próximamente".
2. Given a placeholder section, then the navigation is present and the section is highlighted.
3. Given I load one of these addresses directly (typed, bookmarked or reloaded), then it opens that section.

**US-4 Recipes unchanged.** As Al, I want browsing recipes to work as before.
1. Given `/`, then the recipe list shows as today with the navigation around it, and Recetas is highlighted.
2. Given I open a recipe (`/recipes/<id>`), then Recetas is still the highlighted section.
3. Given a window under 640 px and an open recipe detail, then the bottom bar is hidden; when I close the detail, it shows again.
4. Given a window of 640 px or more and an open recipe detail, then the sidebar stays visible.

**US-5 Offline.** As Al, I want the navigation to work in the store.
1. Given no connection, when I tap any option, then the section opens with no error.

## 6. Functional Requirements
1. FR-1: Four destinations, fixed order and addresses: Recetas `/`, Plan `/plan`, Despensa `/ingredients`, Perfil `/profile`. Labels in Spanish: "Recetas", "Plan", "Despensa", "Perfil".
2. FR-2: A destination is the current one when the address equals its address or is a child of it (`/plan/...`, `/ingredients/...`, `/profile/...`). Recetas is current for `/` and for `/recipes/<id>`.
3. FR-3: Below 640 px the navigation is a fixed bottom bar; at 640 px and above it is a left sidebar. The thresholds are the existing layout breakpoints.
4. FR-4: The bottom bar is hidden while the recipe detail is open on a small window and shown otherwise.
5. FR-5: The sidebar has an expanded and a collapsed state, switched by a control in the sidebar.
6. FR-6: The sidebar state is stored on the device. Without a stored value, large starts expanded and medium collapsed. A stored value wins on both sizes.
7. FR-7: Plan, Despensa and Perfil render a placeholder with the section title and "Próximamente".
8. FR-8: The navigation is present on every section, including placeholders, and persists across navigation between sections (it is part of the page frame, not of each section).
9. FR-9: Navigating between sections is client-side (no full page reload).
10. FR-10: The navigation works offline: the sections' pages are available from the installed app and from the cache.
11. FR-11: Library sync (on open, periodic, manual, on reconnect) keeps running regardless of the section the user is in.
12. FR-12: An unknown address shows the app's standard not-found page; this feature adds no handling for it.

## 7. Data Model / Schema Changes
None. No Drive reads or writes. The sidebar state is a device-local preference (not part of the snapshot).

## 8. API / Interface Contracts
None; no endpoints. Interface: the four destinations (id, label, address, icon) are defined once in a single list consumed by both the bottom bar and the sidebar, so they cannot diverge. The current-destination rule (FR-2) is a pure function in `src/lib/domain` taking the address and returning the destination id.

## 9. UI/UX Requirements
- **New components (UI kit):** a bottom navigation bar, a collapsible sidebar and a placeholder screen ("coming soon"), to be defined by the ux-designer in the kit registry.
- **Icons (lucide-react, 24 px per ui_standards §5):** Recetas `ChefHat`, Plan `CalendarDays`, Despensa `Refrigerator`, Perfil `User`.
- **Active state:** highlighted with `color.primary.500` and a change of fill or weight, never color alone (ui_standards §8).
- **Touch targets:** at least 44 px; bottom bar buttons share the width equally.
- **Sidebar widths:** about 72 px collapsed and 224 px expanded, with a width transition of `duration.base`, instant with `prefers-reduced-motion`.
- **Sidebar collapse control:** at the bottom of the sidebar, with accessible name "Contraer menú" / "Expandir menú" and `aria-expanded`.
- **Placeholder screen:** the section title (heading-1), the section icon and the text "Próximamente", centered; no actions.
- **Page title (browser tab):** each section sets its name in the document title.
- **Layout interaction:** on large windows the order left to right is sidebar, list column (400 px), detail panel; on medium the sidebar sits beside the full-width list and the detail modal opens over everything; on small the bar is below the content and the detail is full screen without bar. The recipes page frame (title, sync badge, refresh) remains on Recetas only.
- **Accessibility:** navigation landmark with an accessible name; destinations are links; current one has `aria-current="page"`; visible focus ring (ui_standards §8); fully keyboard-operable.
- **Copy (Spanish):** "Recetas", "Plan", "Despensa", "Perfil", "Próximamente", "Contraer menú", "Expandir menú".
- **Safe area:** the bottom bar respects the device's bottom inset on installed PWAs.

## 10. Edge Cases & Error Handling
- Stored sidebar state unreadable or storage blocked: ignore it and use the size default; the app still works.
- Window resized across 640 px: the navigation switches between bar and sidebar immediately; the open recipe and section are unaffected.
- Window resized across 1280 px: the sidebar keeps its current state (no stored choice means the default of the new size applies only until the user chooses).
- Rotating a phone to a width of 640 px or more: sidebar appears, collapsed by default.
- First render before the width is known: the small layout is assumed, then corrected; no section content is lost.
- Opening a recipe address directly on a small window: bar hidden from the first frame of the detail.
- Browser back/forward between sections: the current destination follows the address.
- Navigating away from Recetas and back: the list returns to its default state (filters and search cleared, scroll at top), as when reloading.
- Sync running or failing while on a placeholder section: no UI beyond what exists today; the sync badge is only on Recetas.
- Offline and an address never visited: its page is available from the installed app (FR-10).

## 11. Non-Functional Requirements
- Performance: switching sections is immediate on the device (client-side navigation, no data fetch needed for placeholders).
- Offline: see FR-10 and US-5.
- Accessibility: WCAG AA, keyboard-operable, `prefers-reduced-motion` respected (ui_standards §7, §8).
- Themes: correct in light and dark with semantic tokens only.
- Security/privacy: not applicable (no data, no endpoints).

## 12. Dependencies & Existing System Touchpoints
- Page frame: CMP-app-shell (title, sync badge, refresh) is used by SCR-library-list only; navigation is added around all sections.
- SCR-library-list and SCR-recipe-detail (features 001 to 005): unchanged except for how they sit beside the sidebar and how the bar hides on the small detail.
- Layout logic from feature 004 (`layoutForWidth`, breakpoints) is reused.
- PWA / service worker (feature 001): the new addresses must be cached for offline.
- `docs/context/ui_standards.md` §9 and `docs/context/ui_kit_registry.md`: to be updated by ux-designer.
- Stack: nothing outside tech_standards §2.
- Blocks: future features for Plan, Despensa (pantry + shopping list tabs) and Perfil.

## 13. Assumptions & Open Questions
- Assumption: the product vision v2 (meal plan, shopping list and pantry as one system, profile with user, favorites and ratings) will be revised in a separate step; this feature does not depend on its details.
- Contradiction flagged: `ui_standards.md` §9 lists the destinations "Inicio, Recetas, Lista, Despensa" and a sidebar above 1024 px. This PRD (per the user's decision) uses Recetas, Plan, Despensa, Perfil, a sidebar from 640 px and no Inicio. The standard must be updated.
- Assumption: "Despensa" will later hold the Despensa and Lista tabs under `/ingredients`; their sub-addresses are decided in that feature.
- Open: none.

## 14. Rollout & Testing Considerations
- Unit tests (vitest) for the current-destination function: each address, child addresses, `/recipes/<id>`, unknown address.
- Unit tests for the sidebar default and stored-state resolution (size default, stored value wins, unreadable value).
- Manual: phone-sized and desktop viewports, small/medium/large transitions, direct load of every address, recipe detail with and without bar, offline, reduced motion, light and dark themes, installed PWA bottom inset.
- No feature flag needed. Lint, type-check and tests pass before merge.

## 15. Appendix
- Terms: bottom bar (small windows), sidebar (medium and large windows), destination (one of the four options).
- Master doc: §4 Navigation Structure, SCR-library-list, SCR-recipe-detail, CMP-app-shell.
