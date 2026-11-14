# UX Flow: Mis rutinas

> Project: `fitness-coach`
> Feature: `fitness-coach/002`
> Source PRD: `002_my-routines_prd.md`
> UI Standards referenced: `docs/context/ui_standards.md`
> UI Kit Registry referenced: `docs/context/ui_kit_registry.md`
> Prototype: lienzo de Claude Design "My Coach · 002 Mis rutinas" (https://claude.ai/artifact/Msc12FLdtpbvo7Gkfj2jEG), hecho a partir de `prototypes/002_my-routines_brief.md` con el design system "My Coach"; datos de ejemplo sintéticos
> Status: Approved by user on 2026-11-14

Instrucciones estrictas de orquestación de componentes para el agente de implementación. Sin imágenes ni descripciones visuales: el aspecto lo definen `ui_standards.md` y `ui_kit_registry.md`. Los nombres entre comillas invertidas al final de cada elemento interactivo (`day-filter`, `routine-card`…) son los nombres únicos del elemento en todo este documento; úsalos como identificadores de test.

## 1. Flow Summary

La pestaña Rutinas (sustituye a la provisional SCR-routines-list de `fitness-coach/001`) lista las rutinas de la copia de los datos en cards, con filtros por día y por tipo, y abre el detalle de cada una en un `DetailLayer` con el pie fijo "Iniciar rutina". Hasta `fitness-coach/003`, "Iniciar rutina" solo muestra un aviso.

- `RoutinesList` → (pulsa una `routine-card`) → `RoutineDetailScreen` → (pulsa `back-button`) → `RoutinesList` con los mismos filtros y el mismo scroll
- `RoutineDetailScreen` → (pulsa `start-routine-button`) → `Toast` "El modo guiado llega pronto" → se queda
- `RoutineDetailScreen` con la rutina eliminada por una actualización → estado "Esta rutina ya no está" → (pulsa `back-to-list-button`) → `RoutinesList`

## 2. Screens

### 2.1. RoutinesList (Rutinas)

- **Platform**: Web
- **Purpose**: encontrar cualquier rutina de un vistazo y filtrarla por día y tipo (FR-1, FR-2, FR-3).
- **Route / entry point**: `/routines`, desde `nav-routines` (`BottomNav` / `SideNav`).

**Data required**

| Field | Type | Source |
|---|---|---|
| `routines` | `Routine[]` (`status` `active` \| `paused`) | `snapshot.routines` |
| `routine.title`, `category`, `days`, `duration_min` | string, string, `Weekday[]`, number? | frontmatter de la rutina (snapshot) |
| `routine.exerciseCount` | number | suma de items de todos sus bloques |
| `categories` | `{ [id]: { label } }` | `snapshot.vocabularies.categories` |
| `dayFilter` | `"all" \| "mon" … "sun"` | estado de la sesión de la app (se conserva al ir al detalle y volver, FR-3) |
| `typeFilter` | `"all" \| <category id>` | estado de la sesión de la app |
| `scrollY` | number | se guarda al abrir el detalle y se restaura al volver (AC-15) |
| `syncStatus`, `lastSyncedAt` | ver `001_offline-kb-data_ux_flow.md` 2.3 | capa de sincronización |
| `viewport` | `"small" \| "medium" \| "large"` | breakpoints de ui_standards §4 |

**Component tree**

- `<AppFrame current="routines">` (kit: `components/layout/AppFrame`) con `BottomNav` (small) / `SideNav` (≥640 px) (kit: `components/navigation/Nav`); `nav-routines` con `aria-current="page"`
  - `<AppShell title="Rutinas" onRefresh={...}>` (kit: `components/layout/AppShell`)
    - `<SyncBadge status={syncStatus} syncedAt={lastSyncedAt} />` (kit: `components/feedback/SyncBadge`) — `sync-badge`
    - Grupo de filtros "Día": etiqueta `block-label` "Día" + `<FilterOptions>` (kit: `components/inputs/FilterOptions`), una fila con scroll horizontal de `<FilterChip>` (kit: `components/inputs/FilterChip`): "Todos", L, M, X, J, V, S, D, cada uno con su recuento — `day-filter-<all|mon|…|sun>`
    - Grupo de filtros "Tipo": etiqueta `block-label` "Tipo" + `<FilterOptions>` con "Todos" y una opción por categoría presente en `routines` (emoji + `label` del vocabulario), con recuento — `type-filter-<all|category id>`
    - Lista de activas: `<RoutineCard variant="link" routine={r} onOpen={...} />` (kit: `components/routines/RoutineCard`, sin descripción breve) por cada rutina activa que pasa los filtros — `routine-card`
    - `<SectionHeader title="Pausadas" />` (kit: `components/layout/SectionHeader`) — solo si hay pausadas que pasen los filtros
    - Lista de pausadas: `<RoutineCard variant="link" routine={r} status="paused" />` — `routine-card`

`RoutineCard` en esta feature, de arriba abajo, texto alineado arriba (la card crece hacia abajo si el texto ocupa más):

- Fila: `<Chip>` (kit: `components/inputs/Chip`) con el emoji de la categoría + su `label` (AC-2); en pausadas, `<StatusBadge status="paused" />` (variante nueva, ver §5) a su derecha
- Título en `heading-2`, una línea con elipsis (PRD §7)
- Metadatos en `caption` `color-text-muted`, `tabular-nums`: `Clock` + "~{duration_min} min" (solo si existe) y "{n} ejercicio(s)"
- `<DayChips days={routine.days} />` (kit: `components/routines/DayChips`) con `role="img"` y `aria-label` "Días: L · J" (AC-2); sin días: las 7 letras vacías + "Sin día fijo" en `caption` `color-text-muted` (AC-3)
- Contenedor: tinte de `cat.<category>`, `radius.md`, `elevation.1` y borde de 1 px en `color.border` (aprobado en el prototipo, ver §6)

Rejilla: 1 columna en small, 2 desde 640 px (ui_standards §4).

**Conditional rendering states**

- If `routines.length === 0`, render `<EmptyState icon={ListChecks} title="Todavía no hay rutinas" />` (kit: `components/feedback/EmptyState`) and do not render the filters (AC-4)
- If `routines.length > 0` and no routine passes `dayFilter` + `typeFilter`, render the filters + `<EmptyState icon={ListChecks} title="Ninguna rutina con estos filtros" action={<Button variant="secondary">Quitar filtros</Button>} />` — `clear-filters-button` (AC-8)
- If no paused routine passes the filters, do not render `SectionHeader "Pausadas"` nor its list (AC-6)
- Filtrado: `dayFilter === "all"` o `routine.days` incluye el día; `typeFilter === "all"` o `routine.category === typeFilter`; combinados con Y y aplicados a los dos grupos (FR-3, AC-6, AC-7)
- Orden dentro de cada grupo: por el primer día de `days` (lunes primero; sin días al final) y después por `title` con `localeCompare("es")` (FR-2)
- Recuento de cada `FilterChip`: rutinas (de los dos grupos) que quedarían con esa opción y el otro filtro tal como está
- If `duration_min` is missing, do not render the `Clock` item (AC-3)
- If `category` is not in `categories`, render the raw id as the chip text, without emoji (PRD §7)
- `syncStatus` sigue las reglas de `001_offline-kb-data_ux_flow.md` 2.3; sin conexión, la lista se pinta igual desde la copia (AC-5)

**Interactions / transitions**

- Pulsar una opción de `day-filter-*` → `dayFilter` = esa opción (una a la vez; `aria-pressed`) → la lista se recalcula → se queda
- Pulsar una opción de `type-filter-*` → `typeFilter` = esa opción → se queda
- Pulsar `clear-filters-button` → `dayFilter = "all"`, `typeFilter = "all"` → se queda
- Pulsar `routine-card` (toda la card es el enlace) → guarda `scrollY` → navega a `/routines/detail` con el id de la rutina en el estado de navegación, nunca en la URL (FR-8, AC-19)

### 2.2. RoutineDetailScreen (detalle de rutina)

- **Platform**: Web
- **Purpose**: ver todo lo que hay que hacer en una rutina antes de empezar (FR-4 a FR-7).
- **Route / entry point**: `/routines/detail` (ruta fija; el id de la rutina va en el estado de navegación, FR-8), desde `routine-card`. En small, pantalla completa; desde 640 px, modal de 720 px sobre la lista.

**Data required**

| Field | Type | Source |
|---|---|---|
| `routineId` | string | estado de navegación (`history.state`) |
| `routine` | `Routine \| undefined` | `snapshot.routines` por id |
| `routine.blocks[]` | `{ id, label?, note?, duration_min?, items[] }` | snapshot |
| `item` | `{ ex, sets?, reps?, time?, hold?, duration_min?, variant?, resistance?, rest?, note?, missing_exercise? }` | snapshot (PRD §5) |
| `exercise` | `{ title, variants, region, figure? }` | `snapshot.exercises` por `item.ex` |
| `routine.rest` | number? | frontmatter de la rutina (descanso por defecto) |
| `routine.sections.guidelines`, `routine.sections.progression` | string? (Markdown) | snapshot |
| `vocabularies.resistances`, `vocabularies.categories` | `{ [id]: { label } }` | snapshot |
| `isToastVisible` | boolean | estado local, 4 s |

**Component tree**

- `<DetailLayer onBack={...}>` (kit: `components/overlays/DetailLayer`; pantalla completa en small, modal de 720 px desde 640 px)
  - `<Button variant="ghost" icon={ChevronLeft}>Atrás</Button>` (kit) arriba a la izquierda — `back-button`
  - `<RoutineDetail routineId={routineId} />` (kit: `components/routines/RoutineDetail`; sin toque en los ejercicios en esta feature), con scroll:
    - Cabecera: `<Chip>` emoji + categoría; si `status === "paused"`, `<StatusBadge status="paused" />`; título en `heading-1` (completo, sin elipsis); `Clock` + "~{duration_min} min" y "{n} ejercicios" en `caption` `color-text-muted`; `<DayChips days={routine.days} />` con `aria-label` "Días: L · J"
    - Un `<CollapsibleSection defaultOpen>` (kit: `components/common/CollapsibleSection`) por bloque, en orden — `block-section-<block id>`:
      - Cabecera: `label` (o el id si no hay) en `block-label`; debajo, `duration_min` como "{n} min" en `caption` `color-text-muted` si existe
      - Cuerpo: `note` del bloque en `caption` `color-text-muted` si existe; después una fila de ejercicio por item, en orden, separadas 8 px (`space.sm`) — `exercise-row`
    - Fila de ejercicio (contenedor `color-surface-1`, borde 1 px `color-border`, `radius.sm`, padding 12 px; contenido alineado arriba, crece hacia abajo; no es interactiva):
      - `<ExerciseFigure figure={exercise.figure} pose="end" region={exercise.region} size="sm" />` (kit: `components/exercises/ExerciseFigure`); sin `figure`: tinte de región + `Dumbbell`
      - `exercise.title` en `label`
      - `<DoseLabel item={item} exercise={exercise} />` (kit: `components/exercises/DoseLabel`) en `label` `tabular-nums`: "3 × 12", "2 × 30 s", "aguantar 20 s", "10 min", con " · descanso {rest} s" si hay descanso (`item.rest`, si no `routine.rest`)
      - Variante y resistencia en `caption` `color-text-muted`: "{label de la variante} · {label de la resistencia}" (p. ej. "Rodillas · banda verde"); `item.note` en otra línea `caption` `color-text-muted`
    - `<CollapsibleSection title="Pautas">` plegada, al final, si existe `sections.guidelines` — `guidelines-section`
    - `<CollapsibleSection title="Progresión">` plegada, al final, si existe `sections.progression` — `progression-section`
    - Cabecera de las secciones plegables: 16 px (`space.md`) por encima, desde la línea separadora; títulos de Pautas y Progresión en `heading-2`; su texto en `caption` `color-text-muted` con interlineado 1.5 (aprobado en el prototipo, ver §6)
  - `<StickyFooter>` (kit: `components/layout/StickyFooter`) con `<Button variant="primary" icon={Play}>Iniciar rutina</Button>` a ancho completo — `start-routine-button`

**Conditional rendering states**

- If `routine === undefined` (una actualización la quitó de la copia), render `back-button` + `<EmptyState icon={ListChecks} title="Esta rutina ya no está" action={<Button variant="secondary">Volver a Rutinas</Button>} />` — `back-to-list-button` — y no render `StickyFooter` (AC-16)
- If `routine.status === "paused"`, render `<StatusBadge status="paused" />` en la cabecera; `StickyFooter` igual (FR-7)
- If `item.missing_exercise === true` (o `exercise` no existe), render the row with `<ExerciseFigure>` sin figura sobre `color-surface-2` + `Dumbbell`, `item.ex` (el id, p. ej. "plancha-lateral") como nombre, una línea `caption` `color-text-muted` con `TriangleAlert` (icono en `color-warning-500`) "Ejercicio no encontrado", y su `DoseLabel` (AC-13)
- If `exercise.figure` is missing, render `<ExerciseFigure>` con tinte de región + `Dumbbell`
- If `variant` or `resistance` is not in its vocabulary, render the raw id (AC-12)
- If `label`, `note`, `duration_min` or `rest` are missing, do not render them (PRD §7)
- If a block has no items, render its header and "0 ejercicios" in `caption` `color-text-muted` (PRD §7)
- If `sections.guidelines` / `sections.progression` are missing, do not render `guidelines-section` / `progression-section` (AC-14)
- If `isToastVisible === true`, render `<Toast message="El modo guiado llega pronto" />` (kit: `components/feedback/Toast`; solo mensaje, `role="status"`, por encima del `StickyFooter`) — `guided-mode-toast`
- `StickyFooter` siempre visible al hacer scroll (AC-17)

**Interactions / transitions**

- Pulsar `back-button`, el botón atrás del navegador o el gesto de atrás → navega a `RoutinesList` con `dayFilter`, `typeFilter` y `scrollY` como estaban (FR-3, AC-9, AC-15)
- Pulsar `back-to-list-button` → igual que `back-button`
- Pulsar la cabecera de un `block-section-*`, `guidelines-section` o `progression-section` → pliega / despliega → se queda
- Pulsar `start-routine-button` → `isToastVisible = true` durante 4 s; no cambia nada más (AC-18). Lo reemplaza `fitness-coach/003`
- Las `exercise-row` no son interactivas en esta feature (PRD §2)
- Si una actualización de los datos cambia la rutina abierta, el detalle se repinta con la versión nueva; si la quita, pasa al estado "Esta rutina ya no está"

## 3. Navigation Map

```
BottomNav / SideNav ──[nav-routines]──► RoutinesList (/routines)
   RoutinesList
    ├─ snapshot sin rutinas ──► EmptyState "Todavía no hay rutinas" (sin filtros)
    ├─ filtros sin resultado ──► EmptyState + [clear-filters-button] ──► RoutinesList (sin filtros)
    └─[routine-card]──► RoutineDetailScreen (/routines/detail, id en history.state)
          small: pantalla completa · ≥640 px: modal de 720 px sobre la lista
          ├─[start-routine-button]──► Toast "El modo guiado llega pronto" (4 s) ──► se queda
          ├─ la rutina desaparece de la copia ──► "Esta rutina ya no está" ──[back-to-list-button]──► RoutinesList
          └─[back-button / atrás del navegador]──► RoutinesList (mismos filtros y scroll)
```

## 4. Data Requirements Summary

| Field | Type | Source |
|---|---|---|
| `snapshot.routines` | `Routine[]` (`active`, `paused`) | copia de los datos (`fitness-coach/001`) |
| `snapshot.exercises` | `Exercise[]` (`title`, `variants`, `region`, `figure?`) | copia de los datos |
| `snapshot.vocabularies.categories` / `.resistances` | `{ [id]: { label } }` | copia de los datos |
| `dayFilter`, `typeFilter` | `"all" \| Weekday`, `"all" \| category id` | estado de la sesión de la app |
| `scrollY` | number | estado de la sesión de la app |
| `routineId` | string | `history.state` (nunca la URL) |
| `isToastVisible` | boolean | estado local del detalle |
| `syncStatus`, `lastSyncedAt` | ver `001_offline-kb-data_ux_flow.md` | capa de sincronización |

## 5. Component Legend

**Reused from `ui_kit_registry.md`**

| Component | Import path | Used on screens |
|---|---|---|
| `AppFrame` | `components/layout/AppFrame` | RoutinesList |
| `AppShell` | `components/layout/AppShell` | RoutinesList |
| `BottomNav` / `SideNav` | `components/navigation/Nav` | RoutinesList |
| `SyncBadge` | `components/feedback/SyncBadge` | RoutinesList |
| `FilterChip` / `FilterOptions` | `components/inputs/FilterChip`, `components/inputs/FilterOptions` | RoutinesList |
| `Chip` | `components/inputs/Chip` | RoutinesList, RoutineDetailScreen |
| `RoutineCard` | `components/routines/RoutineCard` | RoutinesList (`variant="link"`, sin descripción breve) |
| `SectionHeader` | `components/layout/SectionHeader` | RoutinesList |
| `DayChips` | `components/routines/DayChips` | RoutinesList, RoutineDetailScreen |
| `StatusBadge` | `components/common/StatusBadge` | RoutinesList, RoutineDetailScreen (variante nueva `paused`) |
| `EmptyState` | `components/feedback/EmptyState` | RoutinesList, RoutineDetailScreen |
| `Button` | `components/inputs/Button` | RoutinesList, RoutineDetailScreen |
| `DetailLayer` | `components/overlays/DetailLayer` | RoutineDetailScreen |
| `RoutineDetail` | `components/routines/RoutineDetail` | RoutineDetailScreen (sin toque en ejercicios) |
| `CollapsibleSection` | `components/common/CollapsibleSection` | RoutineDetailScreen |
| `ExerciseFigure` | `components/exercises/ExerciseFigure` | RoutineDetailScreen (`size="sm"`) |
| `DoseLabel` | `components/exercises/DoseLabel` | RoutineDetailScreen |
| `StickyFooter` | `components/layout/StickyFooter` | RoutineDetailScreen |
| `Toast` | `components/feedback/Toast` | RoutineDetailScreen |

**New — temporary (needs formalizing before/at ship time)**

| Component | Purpose | Used on screens | Notes |
|---|---|---|---|
| `StatusBadge` `status="paused"` | Variante nueva de un componente del kit: "Pausada", tinte neutro (`color.surface.2`, texto `color.text.muted`), sin icono | RoutinesList, RoutineDetailScreen | Anunciada el 2026-11-13; añadida a `ui_kit_registry.md` el 2026-11-14, ya no es temporal |

Ningún componente `Tmp` nuevo.

## 6. Deviations from PRD (Approved)

Ninguna sobre el comportamiento del PRD. Decisiones de la revisión del prototipo:

| PRD said | We shipped instead | Why / who approved |
|---|---|---|
| AC-2: la card muestra los días "L · J" y la etiqueta de la categoría | `DayChips` (ui_standards §11) con `aria-label` "Días: L · J", más un `Chip` con emoji + `label` de la categoría | El brief y ui_standards piden `DayChips` y emoji + tinte; así se cumplen las dos cosas. Al, 2026-11-13 |
| (sin especificar) estilo de la fila de ejercicio del detalle | Cada ejercicio es una fila-card (`color-surface-1`, borde `color-border`, `radius.sm`, 8 px entre filas), con el texto alineado arriba; `RoutineCard` lleva además un borde de 1 px `color-border` | Las cards no se distinguían y el texto se desbordaba. Al, comentario en el prototipo, 2026-11-14 |
| (sin especificar) texto de Pautas y Progresión | `caption` `color-text-muted`, interlineado 1.5, bajo títulos `heading-2` | El texto en `body` casi no se distinguía del título y ocupaba demasiado. Al, 2026-11-14 |
| (sin especificar) espacio de las cabeceras plegables | 16 px (`space.md`) entre la línea separadora y la cabecera, igual que entre la última fila y la línea | El título estaba pegado a la línea. Al, 2026-11-14 |

## 7. Open Items

1. **`RoutineDetail` del registro** menciona "momento del día" en la cabecera; el PRD no lo pide y el prototipo no lo muestra. Confirmar si existe en los datos antes de pintarlo.

Resueltos el 2026-11-14: `StatusBadge` `paused`, `RoutineCard` y `RoutineDetail` actualizados en `ui_kit_registry.md` (y en el design system "My Coach"); `ChevronLeft` y `ChevronDown` añadidos a ui_standards §5. `StatusBadge` `paused` ya no es una variante temporal.
