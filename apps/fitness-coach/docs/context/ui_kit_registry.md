# UI Kit Registry: Fitness Coach

> Project: `fitness-coach`
> Status: Approved (2026-11-12)
> Note: registro inicial, aún no hay código. Los componentes se implementarán en `src/components` (Tailwind CSS + lucide-react, tech_standards §1). Los que siguen el patrón de my-food-manager se reimplementan aquí con el mismo nombre y comportamiento (no se importan: no hay un paquete compartido). Todo empieza en `Beta`.

## 1. How to Read This Registry

- **Categorías:** Layout, Navigation, Inputs, Data Display, Workout (modo guiado), Feedback/Overlays.
- **Plataforma:** todos son Web (responsive).
- **Origen:** "patrón My Food" = mismo nombre, props y comportamiento que en my-food-manager, adaptados; "nuevo" = propio de esta app.
- Raíz de imports: `src/components`.

## 2. Component Index

| Componente | Categoría | Origen | Estado | Import |
|---|---|---|---|---|
| `AppFrame` | Layout | patrón My Food | Beta | `components/layout/AppFrame` |
| `AppShell` | Layout | patrón My Food | Beta | `components/layout/AppShell` |
| `BottomNav` / `SideNav` | Navigation | patrón My Food | Beta | `components/navigation/Nav` |
| `Button` | Inputs | patrón My Food | Beta | `components/inputs/Button` |
| `Chip` | Inputs | patrón My Food | Beta | `components/inputs/Chip` |
| `FilterChip` / `FilterOptions` | Inputs | patrón My Food | Beta | `components/inputs/FilterChip`, `components/inputs/FilterOptions` |
| `DetailLayer` | Feedback/Overlays | patrón My Food | Beta | `components/overlays/DetailLayer` |
| `Sheet` | Feedback/Overlays | patrón My Food | Beta | `components/overlays/Sheet` |
| `CollapsibleSection` | Data Display | patrón My Food | Beta | `components/common/CollapsibleSection` |
| `Toast` / `SyncBadge` / `EmptyState` | Feedback/Overlays | patrón My Food | Beta | `components/feedback/*` |
| `StickyFooter` | Layout | nuevo | Beta | `components/layout/StickyFooter` |
| `SectionHeader` | Layout | nuevo | Beta | `components/layout/SectionHeader` |
| `RoutineCard` | Data Display | nuevo | Beta | `components/routines/RoutineCard` |
| `RoutineDetail` | Data Display | nuevo | Beta | `components/routines/RoutineDetail` |
| `DayChips` | Data Display | nuevo | Beta | `components/routines/DayChips` |
| `StatusBadge` | Data Display | nuevo | Beta | `components/common/StatusBadge` |
| `ExerciseCard` | Data Display | nuevo | Beta | `components/exercises/ExerciseCard` |
| `ExerciseDetail` | Data Display | nuevo | Beta | `components/exercises/ExerciseDetail` |
| `ExerciseFigure` | Data Display | nuevo | Beta | `components/exercises/ExerciseFigure` |
| `DoseLabel` | Data Display | nuevo | Beta | `components/exercises/DoseLabel` |
| `GuidedLayer` | Workout | nuevo | Beta | `components/workout/GuidedLayer` |
| `SetProgress` | Workout | nuevo | Beta | `components/workout/SetProgress` |
| `RepCounter` | Workout | nuevo | Beta | `components/workout/RepCounter` |
| `SetTimer` | Workout | nuevo | Beta | `components/workout/SetTimer` |
| `ExerciseRating` | Workout | nuevo | Beta | `components/workout/ExerciseRating` |
| `NotSavedBadge` | Feedback/Overlays | nuevo | Beta | `components/feedback/NotSavedBadge` |
| `WorkoutSummary` | Workout | nuevo | Beta | `components/workout/WorkoutSummary` |

## 3. Component Entries

### AppFrame / AppShell / BottomNav / SideNav
- **Patrón My Food.** `AppFrame` monta la navegación alrededor de cada pantalla; `AppShell` es el marco de página (título, `SyncBadge`, contenido, pull-to-refresh = sincronizar por debajo de 640 px; desde 640 px, botón `ghost` de icono "Actualizar" (`RefreshCw`) en la cabecera, en lugar del gesto).
- **Destinos:** Inicio (`House`), Rutinas (`ListChecks`), Ejercicios (`Dumbbell`). Marca: icono de la PWA + "My Coach".
- **Regla:** `AppFrame` no pinta la navegación en el modo guiado ni en el resumen.

### Button / Chip / FilterChip / FilterOptions
- **Patrón My Food.** `Button`: `variant: "primary" | "secondary" | "ghost" | "danger"`, `size?: "md" | "xl"` (**nuevo**: `xl` = 72 px de alto y ancho completo, solo en el modo guiado), `loading?`, `disabled?`, `icon?`.
- `FilterChip` + `FilterOptions`: filtros de Rutinas (día, tipo) y de Ejercicios (grupo muscular, dificultad, equipamiento), con recuento por opción.

### DetailLayer / Sheet / CollapsibleSection / Toast / SyncBadge / EmptyState
- **Patrón My Food**, mismas props y modos, salvo `SyncBadge`. `DetailLayer` aloja el detalle de rutina y el de ejercicio (pantalla completa en small, modal en medium y large). `Sheet` aloja el selector "Iniciar rutina", las confirmaciones y la clave nueva.
- **Toast:** `message`; se anuncia con `role="status"`; la pantalla que lo muestra lo cierra a los 4 s. Sin icono ni botón de cerrar.
- **SyncBadge** (cambia respecto a My Food): `status: "synced" | "offline" | "syncing" | "error" | "invalid_key"`, `syncedAt?: string`, `onInvalidKey?`. `synced`: "Sincronizado · hace X" (`Check`, tinte `success`); `offline`: "Sin conexión · datos de hace X" (`CloudOff`, tinte `warning`); `syncing`: "Sincronizando…" (`RefreshCw` en `text.muted`, sin tinte); `error`: "No se pudo actualizar · datos de hace X" (`TriangleAlert`, tinte `warning`); `invalid_key`: "Clave no válida · toca para introducirla" (`KeyRound`, tinte `warning`; es un botón de ≥ 44 px que abre el `Sheet` de la clave). En claro, texto e icono de aviso en `color.text` (ui_standards §2).

### StickyFooter
- **Nuevo.** Barra fija al pie dentro de un `DetailLayer` o una pantalla, con `elevation.3` y el inset de la zona segura. **Props:** `children` (normalmente un `Button` primario). Uso: "Iniciar rutina" en el detalle de rutina.

### SectionHeader
- **Nuevo.** Título de sección `heading-2` con acción opcional a la derecha. **Props:** `title`, `action?: ReactNode`. Uso: secciones de la Home y grupos "Para hoy" / "Otras rutinas".

### RoutineCard
- **Nuevo.** Card (`radius.md`, `elevation.1`, borde 1 px `color.border`) con tinte de `cat.<category>`: `Chip` con emoji + `label` de la categoría, título (una línea con elipsis), descripción breve opcional, duración (`Clock`, "~N min", solo si existe), nº de ejercicios, `DayChips` (con `aria-label` "Días: L · J"; sin días, las 7 vacías + "Sin día fijo") y, si aplica, `StatusBadge`. Texto alineado arriba; la card crece hacia abajo.
- **Props:** `routine: RoutineSummary`, `status?: "pending" | "partial" | "paused"`, `variant: "link" | "start"` (`link`: toda la card abre el detalle; `start`: botón "Iniciar", o "Seguir" si es parcial), `onOpen?`, `onStart?`.

### RoutineDetail
- **Nuevo.** Contenido del detalle: cabecera (categoría, `StatusBadge` si está pausada, título completo, duración, días, momento del día), un `CollapsibleSection` abierto por bloque (nombre en `block-label`, duración y nota en `caption`) con sus ejercicios, y "Pautas" y "Progresión" como `CollapsibleSection` plegados al final (texto en `caption` `text.muted`, interlineado 1.5). Cada ejercicio es una fila-card (`surface.1`, borde `color.border`, `radius.sm`, padding 12 px, 8 px entre filas, contenido alineado arriba): `ExerciseFigure` pequeño + nombre + `DoseLabel`; ejercicio inexistente: su id + "Ejercicio no encontrado" (`TriangleAlert`). Cabeceras plegables con `space.md` sobre la línea separadora. **Props:** `routine` (de la copia de los datos), `exercises` (mapa id → ejercicio), `categories` y `resistances` (vocabularios), `emoji?` de la categoría, `onOpenExercise?` (sin él, las filas no son interactivas; llega con "Mis ejercicios").

### DayChips
- **Nuevo.** Fila de 7 letras (L M X J V S D); los días de la rutina rellenos, hoy con borde `color.accent.lime`. **Props:** `days: Weekday[]`, `today?: Weekday`.

### StatusBadge
- **Nuevo.** Badge píldora `caption`. **Props:** `status: "partial" | "done" | "pending-sync" | "paused"` → "Pausada" (tinte neutro: `surface.2`, texto `text.muted`, sin icono), "Parcial" (tinte `warning`; texto `color.text` en claro, ui_standards §2), "Hecha" (`success`), "Pendiente de sincronizar" (igual, icono `CloudOff`).

### ExerciseCard
- **Nuevo.** Card con `ExerciseFigure` (posición final) sobre el tinte `region.<id>`, título, nivel (`Flame` × 1-3), equipamiento en `caption`. Toda la card abre el detalle. **Props:** `exercise: ExerciseSummary`, `onOpen`.

### ExerciseDetail
- **Nuevo.** Monigote (inicio → fin), título, alias, chips de zonas y músculos, nivel, equipamiento, medida, variantes, y secciones Ejecución, Errores comunes, Progresión y Notas (`CollapsibleSection`). **Props:** `exerciseId`, `dose?` (si se abre desde una rutina, muestra su dosis con `DoseLabel`).

### ExerciseFigure
- **Nuevo.** SVG del monigote a partir de `figure` (viewBox 170×90): `base` en `figure.base`, `move` en `figure.move`, `band` discontinua en `figure.band`, cabeza como círculo. **Props:** `figure?: Figure`, `pose: "start" | "end" | "both"`, `region`, `size: "sm" | "md" | "lg"`. Sin `figure`: tinte de región + `Dumbbell`. `both` alterna inicio/fin cada 1,2 s (sin animación con `prefers-reduced-motion`: se muestran lado a lado).

### DoseLabel
- **Nuevo.** Texto compacto de la dosis: "3 × 12", "3 × 70 s por lado", "3 × 10 · aguanta 10 s", "12 min", con variante y banda en `caption`. **Props:** `item: RoutineItem`, `exercise: ExerciseSummary` (para `measure` y `laterality`).

### GuidedLayer
- **Nuevo.** Pantalla completa del modo guiado: cabecera (rutina, "Ejercicio N de M", punto de sin conexión, "Terminar rutina"), cuerpo con scroll (`ExerciseFigure` `both` `lg`, nombre `heading-1`, `DoseLabel`, `SetProgress`, ejecución y notas plegables) y zona de controles fija abajo (`RepCounter` o `SetTimer`, "Saltar serie", "Saltar ejercicio", `ExerciseRating`). **Props:** `children` por zonas (`header`, `body`, `controls`).

### SetProgress
- **Nuevo.** Segmentos de series: hecha (`success`, check), actual (`primary`, borde), pendiente (`surface.2`), saltada (rayado `text.muted`), más "Serie 2 de 3". **Props:** `total`, `current`, `states: ("done" | "skipped" | "pending")[]`.

### RepCounter
- **Nuevo.** Número `numeric` "7 / 12", botón `xl` "+1" y botón secundario "Completar todas". En la última repetición el `xl` pasa a "Continuar". **Props:** `target`, `count`, `onIncrement`, `onCompleteAll`, `onContinue`.

### SetTimer
- **Nuevo.** Tiempo `numeric` en cuenta atrás (mm:ss), anillo de progreso en `primary`; al llegar a 0 sigue contando en `warning` con "+0:12" ("tiempo extra"). Botón `xl` play / pausa; "Continuar" siempre visible una vez iniciado y también "Marcar como hecho" sin iniciar. **Props:** `targetSeconds`, `elapsedMs`, `running`, `onPlay`, `onPause`, `onContinue`, `onMarkDone`.

### ExerciseRating
- **Nuevo.** Tres opciones exclusivas "Bájale" (`ArrowDown`), "Mantenlo" (`Equal`, por defecto), "Súbele" (`ArrowUp`), como grupo de radio. En el MVP lleva `NotSavedBadge` y se pinta en `text.muted`. **Props:** `value`, `onChange`, `inactive: boolean`.

### NotSavedBadge
- **Nuevo.** Badge `caption` con `Info` y el texto "Aún no se guarda", con `aria-describedby` hacia el control que acompaña. **Props:** `text?` (por defecto "Aún no se guarda").

### WorkoutSummary
- **Nuevo.** Pantalla final: "Rutina completada" o "Rutina parcial", "8 de 11 ejercicios", lista simple de ejercicios con check / saltado, y `Button` primario "Volver a inicio". **Props:** `result: WorkoutResult`, `onHome`.

## 4. Temporary / Not-Yet-Formalized Components

Los que aparezcan en un prototipo llevan el prefijo `Tmp` y se anuncian antes de crearlos.

| Componente | Feature | Para qué | Estado |
|---|---|---|---|
| `TmpKeyField` | `fitness-coach/001` | Campo de la clave de acceso: etiqueta visible, tipo contraseña, mostrar/ocultar (`Eye`/`EyeOff`), error bajo el campo | Aprobado en el prototipo (2026-11-12); se propone pasarlo al registro tras implementarlo |
| `TmpSummaryCard` | `fitness-coach/001` | Card del resumen de la Home provisional: recuentos, aviso de ficheros no leídos, hora de la última sincronización | Ídem; puede desaparecer con la Home real (#2) |

## 5. Cross-Surface Parity Notes

n/a: una sola superficie (web).

## 6. Versioning

- **Última actualización:** 2026-11-14: `StatusBadge` `paused`, `RoutineCard` y `RoutineDetail` según el prototipo de fitness-coach/002.
- 2026-11-12: `SyncBadge` con cinco estados, `Toast` precisado, botón "Actualizar" de `AppShell` desde 640 px y `Tmp` de la feature 001.
