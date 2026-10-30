# UX Flow: Pantry and Shopping List Switches

> Project: `my-food-manager`
> Source PRD: `007_pantry-shopping-list-switches_prd.md`
> UI Standards referenced: `docs/context/ui_standards.md`
> UI Kit Registry referenced: `docs/context/ui_kit_registry.md`
> Prototype: `prototypes/007_pantry-shopping-list-switches/index.html` (clickable; views: automatic, phone 390 px, medium 820 px, large 1280 px; light and dark themes; toolbar to simulate connection, stored key and a rejected change)
> Status: Approved by user on 2026-10-30

This document is strict component-orchestration instructions for an implementation agent (Claude Code, Cursor). No images. No subjective visual description. Every line resolves to a concrete rendering or data instruction. Visual values come from `ui_standards.md` tokens and are not repeated here. The app frame and navigation stay as specified in the `006` UX Flow; the recipe screens are unchanged.

## 1. Flow Summary

The "Despensa" section (`/ingredients`) shows one screen with two tabs. Every ingredient has two independent switches, "Tengo" and "Comprar". A switch applies at once on screen and is saved to Drive through the outbox; the screen shows pending changes, asks once per device for the write key, and reports rejected changes.

- `SCR-ingredients` (tab "Despensa") → (tap tab "Lista de compra") → `SCR-ingredients` (tab "Lista de compra") → (tap "Ir a Despensa" in the empty state, or tab "Despensa") → back
- Any tab → (flip a switch with no stored key) → `KeyDialog` → (save a valid key) → switch applied and pending changes sent
- Any tab → (flip a switch) → pending indicator → (saved) → indicator disappears
- Any tab → (server rejects a change) → switch returns to the saved value, `Toast` "No se pudo guardar <ingrediente>"

## 2. Screens

### 2.1. Despensa screen (`SCR-ingredients`, shared structure of both tabs)

- **Platform**: Web. **Divergence by layout**: content column is centered, max width 720 px, in all layouts; `KeyDialog` is a bottom sheet on `small` and a centered modal on `medium` and `large`. Navigation is the frame of `006`.
- **Purpose**: see and change what is at home and what must be bought.
- **Route / entry point**: `/ingredients` (Despensa in the main navigation). Opens on tab `despensa`. Leaving the section or reloading empties tab, search and filters.

**Data required**

| Field | Type | Source |
|---|---|---|
| `library` | `Library` (ingredients catalog, `vocab.families`, `pantry`) | `useLibrary()` (stored snapshot, offline-first) |
| `status`, `syncedAt` | sync state | `useLibrary()`, shown with `<SyncBadge>` |
| `pending` | `{ id: string; kind: "pantry.setHave" \| "pantry.setBuy"; ingredient: string; value: boolean }[]` | outbox (`lib/offline`), persisted on the device |
| `keyStored` | boolean | device preference for the write key |
| `isOnline` | boolean | `navigator.onLine` events |
| `tab` | `"despensa" \| "lista"` | local state, default `"despensa"` |
| `stateFilter` | `"tengo" \| "notengo" \| "todos"` | local state, default `"tengo"`; only used when `tab === "despensa"` |
| `family` | family id or `null` | local state |
| `typed` | string | local state of the search bar |
| `appliedText` | string | `typed` trimmed after 1000 ms, Enter applies at once; `""` when fewer than 3 characters |
| `keepVisible` | `Set<ingredientId>` | local; ids whose "Tengo" changed while shown (Despensa tab); emptied when tab, `stateFilter`, `family` or `appliedText` changes |
| `struck` | `Set<ingredientId>` | local; ids turned off while shown (Lista tab); emptied when the tab changes |
| `shown` | `{ have: Set<id>; buy: Set<id> }` | `pantryWithPending(library.pantry, pending)` (pure, domain: stored pantry with the outbox applied in order) |

**Component tree**

- `<IngredientsScreen>` (new, `components/pantry/IngredientsScreen`, rendered by `src/app/ingredients/page.tsx` in place of `<TmpComingSoon>`)
  - Title row: `<h1>` "Despensa" and `<SyncBadge status={syncStatus} pendingCount={pending.length} />` (kit: `components/feedback/SyncBadge`)
  - `<TmpSegmentedControl role="tablist" ariaLabel="Despensa o lista de compra" items={tabs} value={tab} onChange={setTab} />` (**NEW — temporary**; items: "Despensa" and "Lista de compra" with " · N" appended when `buyCount > 0`)
  - `<SearchInput value={typed} placeholder="Buscar ingrediente" label="Buscar ingrediente" onChange onClear onSubmit />` (kit: `components/inputs/SearchInput`)
  - `<FilterChip label="Familia" value={familyLabel} open={familyOpen} onToggle onClear />` (kit: `components/inputs/FilterChip`)
  - If `familyOpen` and `family === null`: `<FilterOptions label="Familia" options={familyOptions} selected={family} onSelect />` (kit: `components/inputs/FilterOptions`)
  - If `tab === "despensa"`: `<TmpSegmentedControl role="radiogroup" ariaLabel="Estado" items={[Tengo, No tengo, Todos]} value={stateFilter} onChange={setStateFilter} />` (**NEW — temporary**)
  - If `pending.length > 0`: `<TmpPendingChanges count={pending.length} keyNeeded={!keyStored} onEnterKey={openKeyDialog} />` (**NEW — temporary**)
  - List or empty state (see 2.2 and 2.3)
  - If `keyDialogOpen`: `<KeyDialog />` (see 2.4)
  - If `toast !== null`: `<Toast message={toast} tone="error" />` (kit: `components/overlays/Toast`, auto-dismiss after 4 s)

**Conditional rendering states**

- If the library is loading, there is no stored library and offline, or the load failed, render the same `<EmptyState>` and "Reintentar" action as the recipe list (no tabs, search or filters).
- If `isOnline === false`, `<SyncBadge status="offline" />`; everything else behaves the same.
- If `pending.length > 0` and `isOnline` and `keyStored`, `<TmpPendingChanges>` shows "N cambios pendientes" (singular "1 cambio pendiente") with no button.
- If `pending.length > 0` and `!keyStored`, `<TmpPendingChanges>` also shows the button "Introducir clave".
- If `appliedText` is `""` (fewer than 3 trimmed characters), nothing is filtered by text and no message is shown.
- If the device cannot store data, switches work in memory and the existing storage notice of the app is shown.
- If `prefers-reduced-motion` is set, `<Switch>` knob and list changes have no transition.

**Family options (`familyOptions`)**

- Options are the families present in `baseList` (the list of the current tab before the family filter), in `vocab.families` order, families missing from the vocabulary last alphabetically; label from the vocabulary or the id capitalized; ingredients with no family count under "Otros".
- `count` is the number of ingredients of that family in `baseList`; if `count === 0` the option is `disabled`; the chosen option is never disabled.

**Interactions / transitions**

- Tap a tab → `tab` changes, `keepVisible` and `struck` are emptied, `familyOpen = false`; search text and family are kept while the screen stays open.
- Type in the search bar → `typed` updates; 1000 ms after the last keystroke (or on Enter) `appliedText` is set if `typed.trim().length >= 3`, else `""`.
- Tap "x" in the bar, or Esc with text → `typed = ""`, `appliedText = ""` at once, focus returns to the bar.
- Tap "Familia" → toggles `familyOpen`; choose an option → `family` set, `familyOpen = false`; tap the "x" of the chip → `family = null`; Esc or a tap outside closes the options.
- Flip a switch → see 2.2 and 2.3.
- Tap "Introducir clave" → opens `<KeyDialog>`.
- A sync that updates the library keeps `tab`, text, filters and scroll, and re-computes lists from `library` plus `pending`.

### 2.2. Tab "Despensa"

- **Platform**: Web.
- **Purpose**: see which ingredients are at home and mark what must be bought.
- **Route / entry point**: `/ingredients`, tab `despensa`.

**Data required**: as 2.1. `baseList(shown)` = catalog ingredients where: if `appliedText !== ""` the ingredient matches the text (name or any synonym; with several words all must be found in the same name or synonym; case and accents ignored, "ñ" distinct) and `stateFilter` is ignored; otherwise `stateFilter === "todos"`, or `"tengo"` and `tengoOn(i)`, or `"notengo"` and `!tengoOn(i)`, or `keepVisible.has(i.id)`. `tengoOn(i)` = `i.staple || shown.have.has(i.id)`. `rows` = `baseList` filtered by `family` and sorted by name (Spanish collation).

**Component tree**

- `<ul>` of rows, each `<IngredientRow>` (new, `components/pantry/IngredientRow`, min height 64 px) with:
  - name (`label` weight) and, for a staple, a second line "Básico, siempre disponible" (`caption`, `color.text.muted`)
  - `<TmpSwitch label="Tengo" checked={tengoOn(i)} disabled={i.staple} tone="success" ariaLabel={"Tengo " + i.name} onChange={() => flip(i.id, "pantry.setHave")} />` (**NEW — temporary**)
  - `<TmpSwitch label="Comprar" checked={shown.buy.has(i.id)} disabled={i.staple} tone="primary" ariaLabel={"Comprar " + i.name} onChange={() => flip(i.id, "pantry.setBuy")} />` (**NEW — temporary**)

`<TmpSwitch>` renders a `<button role="switch" aria-checked>` with a 44×26 px track, a knob that moves to the right and shows a check mark when on, and its label under the track in `caption`; the whole control is at least 72×56 px. State is conveyed by knob position, check mark and label weight, not by color alone. If `disabled`, it has `aria-disabled="true"`, reduced opacity, and ignores taps.

**Conditional rendering states**

- If `rows.length > 0`, render the list.
- If `rows.length === 0` and (`appliedText !== ""` or `family !== null`), render `<EmptyState emoji="🔎" title="Ningún ingrediente coincide" hint="Prueba con otra búsqueda o quita filtros." />` with the buttons "Borrar búsqueda" (when `appliedText !== ""`) and "Quitar filtros" (when `family !== null`).
- If `rows.length === 0` and no search or family is active, render `<EmptyState emoji="🔎" title="Ningún ingrediente coincide" hint="Prueba con otra búsqueda o quita filtros." />` without buttons (for example "No tengo" with every ingredient at home).
- If a switch was just flipped, the row stays rendered until `tab`, `stateFilter`, `family` or `appliedText` changes (even if it no longer matches `stateFilter`).

**Interactions / transitions**

- Tap `<TmpSwitch>` "Tengo" (not a staple) → `flip(id, "pantry.setHave")`: the opposite value is enqueued, the row is added to `keepVisible`, the switch changes at once.
- Tap `<TmpSwitch>` "Comprar" → `flip(id, "pantry.setBuy")`; "Tengo" is never changed by it, and vice versa; `tabLabel` count updates at once.
- `flip` = (1) remove any unsent operation with the same `ingredient` and `kind`; (2) if the new value differs from the stored pantry, append the operation; (3) announce "<Tengo|Comprar> <ingrediente>: activado|desactivado" in a polite live region; (4) if `!keyStored` and the key dialog was not dismissed since the screen opened, open `<KeyDialog>`; (5) try to send the outbox.
- Tap a staple's "Tengo" or "Comprar" → nothing.

### 2.3. Tab "Lista de compra"

- **Platform**: Web.
- **Purpose**: carry the shopping list; turning "Comprar" off takes an item out of it.
- **Route / entry point**: `/ingredients`, tab `lista`.

**Data required**: as 2.1. `baseList(shown)` = catalog ingredients where `shown.buy.has(i.id)` or `struck.has(i.id)`, and, if `appliedText !== ""`, matching the text as in 2.2. `rows` = `baseList` filtered by `family`, sorted by name. There is no state filter.

**Component tree**

- `<ul>` of rows, each `<IngredientRow>` with the name and `<TmpSwitch label="Comprar" checked={shown.buy.has(i.id)} tone="primary" ariaLabel={"Comprar " + i.name} onChange={() => flip(i.id, "pantry.setBuy")} />`.

**Conditional rendering states**

- If `rows.length > 0`, render the list; a row with `!shown.buy.has(i.id)` (turned off, kept in `struck`) has the name struck through and `color.text.muted`, with the switch off.
- If `rows.length === 0`, `appliedText === ""`, `family === null` and `struck.size === 0`, render `<EmptyState emoji="🛒" title="Tu lista está vacía" hint="Activa Comprar en un ingrediente de Despensa." action={{ label: "Ir a Despensa", onClick: () => setTab("despensa") }} />`.
- If `rows.length === 0` and (`appliedText !== ""` or `family !== null`), render `<EmptyState emoji="🔎" title="Ningún ingrediente coincide" ... />` as in 2.2.

**Interactions / transitions**

- Tap "Comprar" off → the operation is enqueued, the row is added to `struck` and stays struck through; tap it again → the row returns to normal and leaves `struck`.
- Leave the tab or reload → struck rows disappear from the list.

### 2.4. Write key dialog (`KeyDialog`)

- **Platform**: Web. **Divergence by layout**: bottom sheet on `small`, centered modal (max width 480 px) on `medium` and `large`.
- **Purpose**: enter the household write key once per device.
- **Route / entry point**: opened by the first change with no stored key, or by "Introducir clave" in `<TmpPendingChanges>`; not part of the address.

**Data required**

| Field | Type | Source |
|---|---|---|
| `keyDraft` | string | local state of the dialog |
| `keyError` | string \| null | local state; "La clave no es correcta" when the server answered 401, "Escribe la clave" when empty |

**Component tree**

- `<Sheet open title="Clave de escritura" onClose={dismissKeyDialog}>` (kit: `components/overlays/Sheet`, `role="dialog"`, traps focus, Esc and backdrop close)
  - helper text "La necesitas una vez por dispositivo para guardar cambios."
  - password input, `aria-label="Clave de escritura"`, focused on open, Enter saves
  - If `keyError !== null`: error text with `role="alert"`
  - `<Button variant="secondary">` "Ahora no" and `<Button variant="primary">` "Guardar clave"

**Conditional rendering states**

- If `keyError !== null`, the error shows under the input and the dialog stays open.
- If the key was saved and the server accepts it, the dialog closes and the outbox is sent.
- If the server answers 401 after sending, the dialog reopens with `keyError = "La clave no es correcta"` and the changes stay pending.

**Interactions / transitions**

- "Guardar clave" or Enter with text → the key is stored on the device and the outbox is sent; with an empty field → `keyError = "Escribe la clave"`.
- "Ahora no", Esc or backdrop → the dialog closes, changes stay pending, `<TmpPendingChanges>` shows "Introducir clave", and flipping further switches does not reopen the dialog until the screen is reopened.
- Focus returns to the control that opened the dialog.

### 2.5. Saving and failures (behavior across the screen)

- **Platform**: Web.
- **Purpose**: how changes reach Drive and how the screen reports it.

**Conditional rendering states**

- If the outbox has operations and `isOnline` and `keyStored`, send them in order (right after a change, on app open, on `online`, and with the waits 2 s, 5 s, 15 s, 60 s then every 60 s after a failure while the app is visible); when all are saved, `pending` empties, `<TmpPendingChanges>` disappears and the library is refreshed.
- If an operation comes back `rejected` (`INVALID_OP`), remove it from the outbox, show `<Toast message="No se pudo guardar <ingrediente>" tone="error" />`, and the switch shows the saved value again.
- If the response is `401 UNAUTHORIZED`, keep every operation pending and reopen `<KeyDialog>` with the error.
- If the response is `409 CONFLICT`, `502 DRIVE_UNAVAILABLE`, `403 DRIVE_FORBIDDEN`, `404 PANTRY_MISSING` or `500 CONFIG_MISSING`, or there is no network, keep operations pending and retry with the waits above; `<TmpPendingChanges>` stays visible.

## 3. Navigation Map

- `/ingredients` (tab `despensa`) ⇄ (tabs) ⇄ `/ingredients` (tab `lista`)
- `/ingredients` (tab `lista`, empty) → ("Ir a Despensa") → `/ingredients` (tab `despensa`)
- Any tab → (change with no key, or "Introducir clave") → `KeyDialog` → (save, dismiss, Esc) → same tab
- Any tab → (empty search or filter result) → `EmptyState` → ("Borrar búsqueda" / "Quitar filtros") → same tab with the list
- Any section of the main navigation → `/ingredients` → opens on tab `despensa` with empty search and filters

## 4. Data Requirements Summary

| Field | Type | Source |
|---|---|---|
| `library.ingredients` | `Record<id, { name, synonyms, family, staple }>` | snapshot (`GET /api/snapshot`), stored on the device |
| `library.vocab.families` | `Record<id, { label }>` | snapshot |
| `library.pantry` | `{ updated, have: string[], to_buy: string[] }` | snapshot |
| `pending` | `{ id, kind, ingredient, value }[]` | outbox in IndexedDB (`lib/offline`) |
| `keyStored` / key value | boolean / string | device preference (browser local storage) |
| `POST /api/ops` | request `{ ops: { id, kind, ingredient, value }[] }`, header `x-app-key`; response `{ results: { id, status, error? }[], pantry }` | PRD §8 |
| `tab`, `stateFilter`, `family`, `typed`, `appliedText`, `keepVisible`, `struck`, `keyDraft`, `keyError`, `toast` | local screen state | not persisted |

## 5. Component Legend

**Reused from `ui_kit_registry.md`**

| Component | Import path | Used on screens |
|---|---|---|
| `SearchInput` | `components/inputs/SearchInput` | 2.1 |
| `FilterChip` | `components/inputs/FilterChip` | 2.1 |
| `FilterOptions` | `components/inputs/FilterOptions` | 2.1 |
| `Button` | `components/inputs/Button` | 2.4 |
| `EmptyState` | `components/feedback/EmptyState` | 2.2, 2.3 |
| `SyncBadge` | `components/feedback/SyncBadge` | 2.1 |
| `Toast` | `components/overlays/Toast` | 2.1, 2.5 |
| `Sheet` | `components/overlays/Sheet` | 2.4 |
| `AppFrame`, `BottomNav` / `SideNav` | `components/layout/AppFrame`, `components/navigation/Nav` | frame of all screens |

**New — temporary (needs formalizing before/at ship time)**

| Component | Purpose | Used on screens | Notes |
|---|---|---|---|
| `TmpSwitch` | labeled on/off switch (`role="switch"`) with a tone | 2.2, 2.3 | candidate to formalize as kit `Switch`; reused by later features |
| `TmpSegmentedControl` | exclusive choice among 2 to 4 options, as tablist or radiogroup | 2.1 | candidate to formalize as kit `SegmentedControl` |
| `TmpPendingChanges` | "N cambios pendientes" bar with an optional "Introducir clave" button | 2.1 | may be absorbed by `SyncBadge` (`status: "pending"`) when formalized |
| `IngredientsScreen`, `IngredientRow` | screen and row of this feature | 2.1 to 2.3 | feature components under `components/pantry/`, not kit components |

## 6. Deviations from PRD (Approved)

| PRD said (2026-10-30, first approval) | We ship instead | Why / who approved |
|---|---|---|
| A staple's "Comprar" switch works as any other | A staple's "Comprar" switch is off and locked, like its "Tengo" switch is on and locked | `food/_system/schema.md` pantry schema 2 never lists staples, so nothing can be saved for them; the PRD was corrected on 2026-10-30 (implementation review) |

Other details the prototype fixes that the PRD leaves open (not contradictions): the active family filter reads "Familia: <nombre>" with an "x"; a rejected change shows a 4-second error toast; after "Ahora no" the key dialog is not reopened by later switches until the screen is reopened.

## 7. Open Items

- Formalize `Switch`, `SegmentedControl` and the pending indicator in `ui_kit_registry.md` when implemented (document-manager, after merge); decide whether the pending indicator is absorbed by `SyncBadge`.
- Confirm in the real app whether `Sheet` supports the centered-modal mode on `medium` and `large` described for `KeyDialog`; if not, report back instead of inventing a new overlay.
- `tech_foundations` is "review needed" (waived for this feature): tech-lead should reflect the key prompt at first change (instead of first launch) in `tech_standards` §9.
