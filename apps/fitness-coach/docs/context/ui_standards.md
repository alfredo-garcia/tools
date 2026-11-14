# UI Standards: Fitness Coach

> Project: `fitness-coach`
> Status: Approved (2026-11-12)
> Base: lenguaje de diseño de my-food-manager (referencia de solo lectura, ver `SDLC.md`); los tokens de abajo son los de este proyecto y mandan aquí.
> Design system de trabajo: "My Coach" en Claude Design (`claude_design_system` en `SDLC.md`); este fichero es la fuente de verdad.

## 1. Brand Voice & Tone

- **Nombre:** "My Coach" en todo lo que ve el usuario (barra, títulos, PWA). "Fitness Coach" es solo el nombre del proyecto.
- **Personalidad:** entrenador cercano, tranquilo y directo. Anima sin gritar; nunca culpa.
- **Voz:** español de España, tuteo, frases cortas. Bien: "Serie 2 de 3", "Te queda 1 ejercicio". Mal: "¡¡Vamos campeón!!", "Se ha producido un error en la operación".
- **Evitar:** exclamaciones en cadena, jerga de gimnasio en inglés, mensajes que juzguen ("No completaste…"). Los errores dicen qué pasó y qué hacer ("Sin conexión. Se guardará al volver").

## 2. Color Tokens

Igual que my-food-manager (mismo naranja, misma familia visual). Oscuro por defecto; claro según `prefers-color-scheme`, con cambio manual. Los componentes usan solo tokens semánticos.

| Token | Dark | Light | Uso |
|---|---|---|---|
| `color.bg` | `#15130F` | `#FBF7F1` | Fondo de página |
| `color.surface.1` | `#1F1C17` | `#FFFFFF` | Cards, navegación, sheets |
| `color.surface.2` | `#2A2620` | `#F3EDE3` | Chips, inputs, botones secundarios |
| `color.border` | `#38332B` | `#E4DACB` | Separadores, contornos |
| `color.text` | `#F6EFE4` | `#1E1A14` | Texto |
| `color.text.muted` | `#A99F90` | `#6B6254` | Texto secundario, metadatos |
| `color.primary.500` | `#FF7A45` | `#C2410C` | Acción principal, estado activo, progreso |
| `color.primary.contrast` | `#15130F` | `#FFFFFF` | Texto e iconos sobre primario |
| `color.accent.lime` | `#B7E04A` | `#4D7C0F` | "Hoy te toca", acentos positivos |
| `color.success.500` | `#7BD88F` | `#2E7D32` | Completado, sincronizado, serie hecha |
| `color.warning.500` | `#F2C14E` | `#B7791F` | Sin conexión, pendiente, **Parcial**, tiempo extra |
| `color.danger.500` | `#FF6B6B` | `#B42318` | Errores, acciones destructivas |
| `cat.<id>` | ver abajo | igual | Tinte de cards y chips por categoría de rutina |
| `region.<id>` | ver abajo | igual | Tinte del fondo del monigote por región |
| `figure.base` / `figure.move` / `figure.band` | `color.text.muted` / `color.primary.500` / `color.success.500` | igual | Monigote: cuerpo, movimiento, banda (discontinua) |
| `color.focus` | `#FF7A45` al 55 % | `#C2410C` al 55 % | Anillo de foco (§8) |

Categorías de rutina: `cat.swim-day #6FC3E8` 🏊, `cat.strength #E4572E` 💪, `cat.mobility #7BD88F` 🧘, `cat.express #F2C14E` ⚡, `cat.cardio #F58FB5` 🚶. Regiones: `region.core #E0A458`, `region.lower-body #F28B6B`, `region.upper-body #6FC3E8`, `region.full-body #B7E04A`. Solo para tintes de fondo y chips (12–20 % de opacidad), nunca para texto.


- **Contraste:** WCAG AA (4,5:1 texto, 3:1 texto grande y UI). Excepciones medidas en el tema claro:
  - `color.warning.500` da 3,4:1 sobre `color.bg` y 3,6:1 sobre `color.surface.1`: **nunca como color de texto pequeño en claro**. Los badges de aviso ("Parcial", "Pendiente de sincronizar") llevan el texto en `color.text` sobre el tinte de aviso, y el color de aviso solo en el icono o el relleno. Vale como texto a partir de 24 px.
  - Sobre `color.surface.2` en claro, `color.primary.500` (4,45:1), `color.accent.lime` (4,3:1) y `color.success.500` (4,4:1) solo valen para texto ≥ 24 px o como marcas de UI.
  - `color.border` no llega a 3:1 en ningún tema: un control nunca se distingue solo por su borde (los controles llevan relleno `color.surface.2`).

## 3. Typography

- **Fuente:** Inter, con `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

| Estilo | Tamaño / peso / interlineado | Uso |
|---|---|---|
| `display` | 32 / 800 / 1.15 | Saludo de la Home |
| `heading-1` | 24 / 800 / 1.15 | Títulos de pantalla, nombre del ejercicio en el modo guiado |
| `heading-2` | 18 / 700 / 1.25 | Cabeceras de sección y de bloque |
| `body` | 16 / 400 / 1.5 | Texto, ejecución, notas |
| `label` | 14 / 600 / 1.3 | Chips, botones, etiquetas |
| `caption` | 12 / 500 / 1.35 | Metadatos, badges |
| `numeric` | 64 / 800 / 1.0, `tabular-nums` | Contador de repeticiones y temporizador del modo guiado (nuevo respecto a My Food: hay que leerlo a un metro) |
| `block-label` | 12 / 800 / 1.35, +0.06em, mayúsculas | Cabeceras de bloque (Calentamiento, Core…) |

## 4. Spacing & Layout Scale

- **Unidad base:** 4 px. `space.xs 4`, `sm 8`, `md 16`, `lg 24`, `xl 32`.
- **Breakpoints:** `small <640`, `medium 640-1279` (`bp.medium` 640px), `large >=1280` (`bp.large` 1280px).
- **Medidas fijas:** `size.touch-min` 44px, `size.button-height` 52px, `size.button-xl-height` 72px, `size.content-max` 720px, `size.dialog-max` 520px, `size.sidenav-collapsed` 72px, `size.sidenav-expanded` 224px.
- **Rejilla:** cards de rutina en 1 columna en small, 2 en medium y large; cards de ejercicio en 2 / 3 / 4 columnas; margen de página `space.md`. Ancho máximo de contenido 720 px centrado (es una app de móvil; el escritorio solo se adapta).

## 5. Iconography

- **Set:** solo `lucide-react`. Tamaños `icon.sm` 14 (chips, badges, metadatos), `icon.md` 20 (botones, cards), `icon.nav` 24 (navegación) e `icon.guided` 28 (controles del modo guiado).
- **Estilo:** contorno, trazo 2 px, extremos redondeados.
- Iconos de referencia: `House` (Inicio), `ListChecks` (Rutinas), `Dumbbell` (Ejercicios), `Play` / `Pause`, `SkipForward`, `ChevronsRight` (saltar ejercicio), `Timer`, `Repeat`, `Check`, `CalendarDays`, `Clock`, `Flame` (nivel), `ArrowDown` / `Equal` / `ArrowUp` (valoración), `Info` ("Aún no se guarda"), `CloudOff` (sin conexión / pendiente de sincronizar), `RefreshCw` (sincronizando), `TriangleAlert` (no se pudo actualizar), `KeyRound` (clave no válida), `Eye` / `EyeOff` (mostrar / ocultar clave), `X` (cerrar sheets y modales), `ChevronLeft` (Atrás), `ChevronDown` (plegar / desplegar secciones).
- Aún no hay logo: hasta que exista el icono de la PWA, la marca es "My Coach" en texto.
- Los emoji de categoría son glifos de texto en cards y chips; nunca sustituyen a iconos funcionales.

## 6. Elevation, Shadow & Radius

| Token | Valor | Uso |
|---|---|---|
| `radius.sm` | 10px | Controles pequeños |
| `radius.md` | 18px | Cards |
| `radius.lg` | 28px | Sheets (esquinas superiores) |
| `radius.full` | 999px | Botones, chips, badges |
| `elevation.1` | `0 1px 2px` negro 40 % (dark) / cálido 12 % (light) | Cards en reposo |
| `elevation.3` | `0 18px 40px` negro 55 % (dark) / cálido 20 % (light) | Sheets, toasts, pie fijo |

## 7. Motion & Animation Principles

- **Duraciones:** `duration.fast 120ms` (pulsar), `duration.base 200ms` (sheets, cambio de ejercicio).
- **Easing:** ease-out al entrar, ease-in al salir.
- **Reglas:** el cambio de ejercicio en el modo guiado se desliza en horizontal; el contador de repeticiones hace un "pop" breve al sumar. Nada decorativo en bucle. Con `prefers-reduced-motion`, sin transiciones.

## 8. Accessibility Standards

- **Contraste:** WCAG AA.
- **Zonas táctiles:** mínimo 44×44 px; botones principales 52 px de alto; **en el modo guiado, el botón principal (sumar repetición / play / Continuar) mide al menos 72 px de alto y ocupa el ancho** (se usa con las manos ocupadas o sudadas).
- **Foco:** anillo visible de 3 px en `color.primary.500` al 55 %; el estado nunca se indica solo con color (serie hecha = check + relleno; Parcial = texto + color).
- **Lectores de pantalla:** `aria-label` en botones de solo icono; `aria-pressed` en toggles; el temporizador se anuncia en una región `polite` solo al empezar, al llegar a 0 y al pausar (no cada segundo).

## 9. Platform Conventions

Solo web (PWA mobile-first).
- **Interacción:** táctil primero; nada que dependa del hover.
- **Navegación** : tres destinos, en este orden: Inicio (`/`), Rutinas (`/routines`), Ejercicios (`/exercises`). Small (<640px): barra inferior fija con icono y texto. Medium y large: barra lateral como en My Food (72 px plegada / 224 px desplegada, con el icono de la PWA y "My Coach"). El destino actual lleva `aria-current="page"`, `color.primary.500` y trazo más grueso. **La navegación se oculta en el modo guiado y en el resumen** (pantalla completa, como la vista de cocinar de My Food).
- **Detalles:** el detalle de rutina y el de ejercicio son pantalla completa en small, con "Atrás", y modal de 720 px en medium y large. El detalle de rutina lleva el pie fijo "Iniciar rutina".
- **Overlays:** el selector "Iniciar rutina", el de añadir ejercicio (futuro) y las confirmaciones son bottom sheets en small y modales centrados (máx. 520 px) desde 640 px.
- **Modo guiado:** pantalla completa, sin navegación; arriba, la rutina, el progreso ("Ejercicio 3 de 11") y "Terminar rutina"; en el centro, el monigote, el nombre, la dosis y la descripción; abajo, al alcance del pulgar, los controles. Pantalla siempre encendida (tech_standards §11).
- **Sin conexión:** badge de sin conexión arriba en cada pantalla (excepto el modo guiado, donde basta un punto en la cabecera); nunca se bloquean las lecturas.

## 10. Design Token Naming Convention

- **Patrón:** `category.variant.step` (`color.primary.500`, `space.md`, `cat.swim-day`, `figure.move`).
- **CSS:** los puntos pasan a guiones con prefijo `--`: `color.primary.500` → `--color-primary-500`. El tema de Tailwind extiende estas variables; claro y oscuro cambian con `:root[data-theme]` y `prefers-color-scheme`.

## 11. Do's and Don'ts

- Cada card de rutina muestra categoría (emoji + tinte), título, duración (reloj), nº de ejercicios y días (chips L M X J V S D).
- Cada card de ejercicio muestra el monigote (posición final) sobre el tinte de su región; si no tiene `figure`, el tinte de la región + un icono `Dumbbell`, nunca una caja gris vacía.
- Las series siempre son visibles en el modo guiado: una fila de puntos o segmentos (hecha / actual / pendiente / saltada) y el texto "Serie 2 de 3".
- **Funciones sin efecto todavía**: se muestran con su aspecto normal pero en `color.text.muted`, con un badge `caption` "Aún no se guarda" y un icono `Info`; nunca se ocultan ni parecen rotas. (La valoración por ejercicio del MVP.)
- **Parcial:** badge de aviso (tinte `color.warning.500`, texto `color.text` en claro; §2) con el texto "Parcial" y "Seguir" como acción principal de la card.
- Botones principales en píldora `color.primary.500`, uno por sección; destructivos en contorno `color.danger.500`.
- Filtros como chips en una fila con scroll horizontal; los activos con relleno suave + borde de color.
- Nunca negro o blanco puros para texto; nunca un hex directo en componentes: primero un token aquí.

## 12. Versioning

- **Última actualización:** 2026-11-12 (aprobado; reglas de contraste en claro y nombres de tokens tomados del design system de Claude Design; iconos de sincronización, clave y cierre añadidos con fitness-coach/001; `ChevronLeft` y `ChevronDown` añadidos con fitness-coach/002 el 2026-11-14).
- **Responsable:** Al.
