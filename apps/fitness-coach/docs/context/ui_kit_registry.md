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
- **Patrón My Food.** `AppFrame` monta la navegación alrededor de cada pantalla; `AppShell` es el marco de página (título, `SyncBadge`, contenido, pull-to-refresh = sincronizar).
- **Destinos:** Inicio (`House`), Rutinas (`ListChecks`), Ejercicios (`Dumbbell`). Marca: icono de la PWA + "My Coach".
- **Regla:** `AppFrame` no pinta la navegación en el modo guiado ni en el resumen.

### Button / Chip / FilterChip / FilterOptions
- **Patrón My Food.** `Button`: `variant: "primary" | "secondary" | "ghost" | "danger"`, `size?: "md" | "xl"` (**nuevo**: `xl` = 72 px de alto y ancho completo, solo en el modo guiado), `loading?`, `disabled?`, `icon?`.
- `FilterChip` + `FilterOptions`: filtros de Rutinas (día, tipo) y de Ejercicios (grupo muscular, dificultad, equipamiento), con recuento por opción.

### DetailLayer / Sheet / CollapsibleSection / Toast / SyncBadge / EmptyState
- **Patrón My Food**, mismas props y modos. `DetailLayer` aloja el detalle de rutina y el de ejercicio (pantalla completa en small, modal en medium y large). `Sheet` aloja el selector "Iniciar rutina" y las confirmaciones.

### StickyFooter
- **Nuevo.** Barra fija al pie dentro de un `DetailLayer` o una pantalla, con `elevation.3` y el inset de la zona segura. **Props:** `children` (normalmente un `Button` primario). Uso: "Iniciar rutina" en el detalle de rutina.

### SectionHeader
- **Nuevo.** Título de sección `heading-2` con acción opcional a la derecha. **Props:** `title`, `action?: ReactNode`. Uso: secciones de la Home y grupos "Para hoy" / "Otras rutinas".

### RoutineCard
- **Nuevo.** Card (`radius.md`, `elevation.1`) con tinte de `cat.<category>`: emoji, título, descripción breve, duración (`Clock`), nº de ejercicios, `DayChips` y, si aplica, `StatusBadge`.
- **Props:** `routine: RoutineSummary`, `status?: "pending" | "partial"`, `variant: "link" | "start"` (`link`: toda la card abre el detalle; `start`: botón "Iniciar", o "Seguir" si es parcial), `onOpen?`, `onStart?`.

### RoutineDetail
- **Nuevo.** Contenido del detalle: cabecera (categoría, título, duración, días, momento del día), pautas, y un `CollapsibleSection` por bloque con sus ejercicios (`ExerciseFigure` pequeño + nombre + `DoseLabel`, toque = detalle del ejercicio). **Props:** `routineId`.

### DayChips
- **Nuevo.** Fila de 7 letras (L M X J V S D); los días de la rutina rellenos, hoy con borde `color.accent.lime`. **Props:** `days: Weekday[]`, `today?: Weekday`.

### StatusBadge
- **Nuevo.** Badge píldora `caption`. **Props:** `status: "partial" | "done" | "pending-sync"` → "Parcial" (tinte `warning`; texto `color.text` en claro, ui_standards §2), "Hecha" (`success`), "Pendiente de sincronizar" (igual, icono `CloudOff`).

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

Ninguno todavía. Los que aparezcan en un prototipo llevan el prefijo `Tmp` y se anuncian antes de crearlos.

## 5. Cross-Surface Parity Notes

n/a: una sola superficie (web).

## 6. Versioning

- **Última actualización:** 2026-11-12 (versión inicial).
