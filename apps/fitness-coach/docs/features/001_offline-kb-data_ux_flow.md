# UX Flow: Datos del knowledge-base sin conexión

> Project: `fitness-coach`
> Feature: `fitness-coach/001`
> Source PRD: `001_offline-kb-data_prd.md`
> UI Standards referenced: `docs/context/ui_standards.md`
> UI Kit Registry referenced: `docs/context/ui_kit_registry.md`
> Prototype: lienzo de Claude Design "My Coach · 001 Datos sin conexión" (https://claude.ai/artifact/NzDAEeSnqr5soyRvyw6thA), hecho a partir de `prototypes/001_offline-kb-data_brief.md` con el design system "My Coach"
> Status: Approved by user on 2026-11-12

Instrucciones estrictas de orquestación de componentes para el agente de implementación. Sin imágenes ni descripciones visuales: el aspecto lo definen `ui_standards.md` y `ui_kit_registry.md`. Los nombres entre comillas invertidas al final de cada elemento interactivo (`key-input`, `sync-badge`…) son los nombres únicos del elemento en todo este documento; úsalos como identificadores de test.

## 1. Flow Summary

La app arranca desde la copia guardada si existe; si no, pide la clave (con red) o explica que hace falta red (sin red). Con la copia, todo vive dentro de `AppFrame` + `AppShell` con tres destinos y el `SyncBadge` arriba. Una clave rechazada por el servidor abre un `Sheet` sobre la Home sin ocultar los datos.

- Arranque sin copia y sin red → `FirstOpenOffline` → (pulsa "Reintentar") → `Welcome`
- Arranque sin copia y con red → `Welcome` → (escribe la clave y pulsa "Entrar", clave correcta) → `Home`
- Arranque con copia → `Home` (copia pintada antes de cualquier petición) → (actualización en segundo plano)
- `Home` → (pulsa Rutinas / Ejercicios en la navegación) → `Routines` / `Exercises`
- `Home` con `syncStatus === "invalid_key"` → (pulsa el `SyncBadge`) → `KeySheet` → (clave correcta) → `Home` con `syncStatus === "syncing"` → `"synced"`

## 2. Screens

### 2.1. Welcome (bienvenida / clave)

- **Platform**: Web
- **Purpose**: pedir la clave de acceso la primera vez y validarla descargando el snapshot (FR-10).
- **Route / entry point**: `/` cuando no hay `access_key` ni `snapshot` guardados y `navigator.onLine === true`; también desde `FirstOpenOffline` → "Reintentar".

**Data required**

| Field | Type | Source |
|---|---|---|
| `keyDraft` | string | estado local del campo |
| `isKeyVisible` | boolean | estado local, `false` al entrar |
| `isSubmitting` | boolean | estado local, `true` mientras dura `GET /api/snapshot` |
| `keyError` | `"invalid_key" \| null` | respuesta `401` de `GET /api/snapshot` |

**Component tree** (sin navegación: no se monta `AppFrame`)

- Contenedor de pantalla completa, contenido centrado verticalmente, padding `space-lg`
  - Texto "My Coach" en `display` (no hay logo)
  - Texto "Escribe tu clave para empezar" en `body`, `color-text-muted`
  - `<TmpKeyField id="key" label="Clave de acceso" value={keyDraft} visible={isKeyVisible} error={keyError ? "Esa clave no es correcta" : null} disabled={isSubmitting} onChange={...} onToggleVisible={...} />` (**NEW — temporary**, `components/inputs/TmpKeyField`) — input `key-input`, botón `key-visibility-toggle`, error `key-error`
  - `<Button variant="primary" size="md" loading={isSubmitting} disabled={keyDraft.length === 0 || isSubmitting}>Entrar</Button>` (kit: `components/inputs/Button`), ancho completo — `enter-button`

**Conditional rendering states**

- If `keyDraft.length === 0`, render `enter-button` with `disabled`
- If `isSubmitting === true`, render `<Button variant="primary" loading>` (texto "Entrando…") and `<TmpKeyField disabled />`
- If `keyError === "invalid_key"`, render `<TmpKeyField error="Esa clave no es correcta" />` (borde `color-danger-500`, mensaje con `role="alert"` bajo el campo, `aria-invalid="true"`); no se guarda nada (AC-11)
- If `GET /api/snapshot` falla por red (no `401`), render `FirstOpenOffline` (2.2)
- If `GET /api/snapshot` → `200`, guardar `snapshot`, `etag`, `last_synced_at` y `access_key` y render `Home` con `syncStatus === "synced"` (AC-10)
- If `GET /api/snapshot` → `409 client_outdated`, recargar la app y repetir la petición (PRD §10)

**Interactions / transitions**

- Escribir en `key-input` → `keyDraft` cambia, `keyError = null` → se queda
- Pulsar `key-visibility-toggle` → `isKeyVisible` alterna; el input pasa de `type="password"` a `type="text"`; `aria-label` "Mostrar clave" / "Ocultar clave", `aria-pressed={isKeyVisible}` → se queda
- Pulsar `enter-button` (o Intro en el campo) → `isSubmitting = true`, `GET /api/snapshot` con `x-app-key: keyDraft` → según respuesta, estados de arriba

### 2.2. FirstOpenOffline (primera apertura sin red)

- **Platform**: Web
- **Purpose**: explicar que la primera vez hace falta red (FR-11, AC-3).
- **Route / entry point**: `/` cuando no hay `snapshot` guardado y `navigator.onLine === false`, o cuando la petición de `Welcome` falla por red.

**Data required**

| Field | Type | Source |
|---|---|---|
| `isOnline` | boolean | `navigator.onLine` |

**Component tree** (sin navegación)

- `<EmptyState icon={CloudOff} title="Necesitas conexión la primera vez" text="Conéctate una vez para descargar tus rutinas; después funciona sin red." action={<Button variant="secondary">Reintentar</Button>} />` (kit: `components/feedback/EmptyState`, `components/inputs/Button`) — `retry-button`

**Conditional rendering states**

- Única variante; no hay estados intermedios.

**Interactions / transitions**

- Pulsar `retry-button` → si `navigator.onLine === true`, navega a `Welcome`; si sigue sin red, se queda en esta pantalla

### 2.3. Home (Home provisional)

- **Platform**: Web
- **Purpose**: mostrar el marco de la app, el estado de sincronización y un resumen de lo cargado (FR-16, FR-17).
- **Route / entry point**: `/`, con `snapshot` guardado; destino "Inicio" de la navegación.

**Data required**

| Field | Type | Source |
|---|---|---|
| `exerciseCount` | number | `snapshot.exercises.length` |
| `activeRoutineCount` | number | `snapshot.routines` con `status === "active"` |
| `pausedRoutineCount` | number | `snapshot.routines` con `status === "paused"` |
| `skippedCount` | number | `snapshot.skipped.length` |
| `lastSyncedAt` | string (ISO 8601) | `last_synced_at` en IndexedDB |
| `syncStatus` | `"synced" \| "offline" \| "syncing" \| "error" \| "invalid_key"` | capa de sincronización (FR-9) |
| `storageAvailable` | boolean | prueba de escritura en IndexedDB al arrancar |
| `viewport` | `"small" \| "medium" \| "large"` | breakpoints de ui_standards §4 |

**Component tree**

- `<AppFrame current="home">` (kit: `components/layout/AppFrame`)
  - small (<640 px): `<BottomNav current="home" />` al pie (kit: `components/navigation/Nav`) — `nav-home`, `nav-routines`, `nav-exercises`
  - medium y large (≥640 px): `<SideNav current="home" />` a la izquierda, con el icono "MC" y "My Coach" (kit: `components/navigation/Nav`); mismos tres elementos
  - `<AppShell title="My Coach" onRefresh={...}>` (kit: `components/layout/AppShell`; refresco: gesto de desplazar hacia abajo en small, botón de icono `RefreshCw` con `aria-label="Actualizar"` junto al `SyncBadge` desde 640 px — `refresh-button`)
    - `<SyncBadge status={syncStatus} lastSyncedAt={lastSyncedAt} onInvalidKey={openKeySheet} />` (kit: `components/feedback/SyncBadge`, cinco estados del registro) — `sync-badge`. En small va bajo el título; desde 640 px, a la derecha del título
    - Texto "Hola, Al" en `display`
    - `<TmpSummaryCard exercises={exerciseCount} activeRoutines={activeRoutineCount} pausedRoutines={pausedRoutineCount} skipped={skippedCount} lastSyncedAt={lastSyncedAt} />` (**NEW — temporary**, `components/common/TmpSummaryCard`) — `summary-card`, aviso `skipped-warning`
      - Línea 1, `heading-2`, `tabular-nums`: "{exerciseCount} ejercicios · {activeRoutineCount} rutinas activas"
      - Línea 2, `body` `color-text-muted`: "{pausedRoutineCount} pausada(s)"
      - Línea 3 (condicional), `caption` `color-text-muted` con icono `Info`: "{skippedCount} fichero(s) no se pudo/pudieron leer"
      - Línea 4, `caption` `color-text-muted`, separada por `color-border`: "Actualizado {edad(lastSyncedAt)}"

**Conditional rendering states**

`SyncBadge` (AC-13; textos de ui_standards §1; en claro, texto e icono de los avisos en `color-text` sobre el tinte de `color-warning-500`):

- If `syncStatus === "synced"`, render `<SyncBadge>` con tinte `success`, icono `Check`, "Sincronizado · {edad(lastSyncedAt)}"
- If `syncStatus === "offline"`, render `<SyncBadge>` con tinte `warning`, icono `CloudOff`, "Sin conexión · datos de {edad(lastSyncedAt)}"
- If `syncStatus === "syncing"`, render `<SyncBadge>` neutro (`color-surface-2`), icono `RefreshCw`, "Sincronizando…"
- If `syncStatus === "error"`, render `<SyncBadge>` con tinte `warning`, icono `TriangleAlert`, "No se pudo actualizar · datos de {edad(lastSyncedAt)}"
- If `syncStatus === "invalid_key"`, render `<SyncBadge>` con tinte `warning`, icono `KeyRound`, "Clave no válida · toca para introducirla", como `<button>` de al menos 44 px de alto que abre `KeySheet` (2.6)
- `SyncBadge` lleva `role="status"`; su texto nunca depende solo del color.

`edad(t)` (PRD §9, con `Intl`, sin librerías): "hace un momento" (< 1 min), "hace N min", "hace N h", "ayer", fecha corta a partir de 2 días.

Resumen:

- If `pausedRoutineCount === 0`, do not render la línea 2 de `TmpSummaryCard`
- If `pausedRoutineCount === 1`, render "1 pausada"; if `> 1`, render "{n} pausadas"
- If `skippedCount === 0`, do not render `skipped-warning`
- If `skippedCount === 1`, render `skipped-warning` "1 fichero no se pudo leer"; if `> 1`, "{n} ficheros no se pudieron leer" (sin rutas ni contenido, AC-15)
- If `activeRoutineCount === 0`, render "… · 0 rutinas activas" sin error (PRD §10)
- If `storageAvailable === false`, render además `<Toast>` (2.7)
- La copia se pinta siempre antes de cualquier petición (FR-5); una actualización nunca vacía la Home.

**Interactions / transitions**

- Desplazar la pantalla hacia abajo en `AppShell` (small) o pulsar `refresh-button` (≥640 px) → lanza una actualización aunque la última tenga < 1 min (FR-6d y FR-6e; AC-7, AC-20; `refresh-button` no se renderiza por debajo de 640 px) → `syncStatus = "syncing"` → al terminar, `"synced"` con `lastSyncedAt = ahora` (o `"error"` / `"invalid_key"` / `"offline"` según el resultado). Si ya hay una en curso, se ignora (FR-8)
- Pulsar `sync-badge` con `syncStatus === "invalid_key"` → abre `KeySheet`; en los demás estados no es interactivo
- Pulsar `nav-routines` → `Routines`; `nav-exercises` → `Exercises`; `nav-home` → se queda
- Disparadores automáticos (FR-6a–c): abrir la app, volver a primer plano con la última sincronización correcta de hace > 1 min, recuperar la conexión → mismo flujo que el gesto

### 2.4. Routines (Rutinas, provisional)

- **Platform**: Web
- **Purpose**: destino "Rutinas" de la navegación hasta la #3 (FR-16, AC-18).
- **Route / entry point**: `/routines`, desde `nav-routines`.

**Data required**

| Field | Type | Source |
|---|---|---|
| `syncStatus`, `lastSyncedAt` | ver 2.3 | capa de sincronización |

**Component tree**

- `<AppFrame current="routines">` con `BottomNav` / `SideNav` como en 2.3 (`nav-routines` con `aria-current="page"`)
  - `<AppShell title="Rutinas" onRefresh={...}>`
    - `<SyncBadge ... />` (mismos estados que 2.3) — `sync-badge`
    - `<EmptyState icon={ListChecks} title="Próximamente" text="Aquí verás tus rutinas." />` (kit: `components/feedback/EmptyState`)

**Conditional rendering states**

- Única variante; `SyncBadge` sigue las reglas de 2.3.

**Interactions / transitions**

- Pulsar `nav-home` → `Home`; `nav-exercises` → `Exercises`
- Pulsar `sync-badge` con `invalid_key` → `KeySheet` sobre esta pantalla

### 2.5. Exercises (Ejercicios, provisional)

- **Platform**: Web
- **Purpose**: destino "Ejercicios" de la navegación hasta la #4 (FR-16, AC-18).
- **Route / entry point**: `/exercises`, desde `nav-exercises`.

**Data required**: igual que 2.4.

**Component tree**

- `<AppFrame current="exercises">` con `BottomNav` / `SideNav` (`nav-exercises` con `aria-current="page"`)
  - `<AppShell title="Ejercicios" onRefresh={...}>`
    - `<SyncBadge ... />` — `sync-badge`
    - `<EmptyState icon={Dumbbell} title="Próximamente" text="Aquí verás tus ejercicios." />` (kit: `components/feedback/EmptyState`)

**Conditional rendering states**

- Única variante; `SyncBadge` sigue las reglas de 2.3.

**Interactions / transitions**

- Pulsar `nav-home` → `Home`; `nav-routines` → `Routines`
- Pulsar `sync-badge` con `invalid_key` → `KeySheet` sobre esta pantalla

### 2.6. KeySheet (clave no válida)

- **Platform**: Web
- **Purpose**: pedir la clave nueva cuando el servidor rechaza la guardada, sin ocultar los datos (FR-12, AC-12).
- **Route / entry point**: overlay sobre la pantalla actual; se abre solo al detectar `401` en una actualización con copia guardada, y desde `sync-badge` en estado `invalid_key`.

**Data required**

| Field | Type | Source |
|---|---|---|
| `keyDraft` | string | estado local del sheet |
| `isKeyVisible` | boolean | estado local |
| `isSubmitting` | boolean | estado local |
| `keyError` | `"invalid_key" \| null` | `401` de `GET /api/snapshot` con la clave nueva |

**Component tree**

- `<Sheet open onClose={...} title="Tu clave ya no vale">` (kit: `components/overlays/Sheet`; bottom sheet en small, modal centrado de máx. 520 px desde 640 px) — `key-sheet`
  - Botón de cerrar: `<Button variant="ghost" icon={X} aria-label="Cerrar" />` (kit) — `key-sheet-close`
  - Texto "Escribe la clave nueva para seguir actualizando. Tus datos guardados siguen aquí." en `body`, `color-text-muted`
  - `<TmpKeyField id="new-key" label="Clave de acceso" ... />` (**NEW — temporary**) — `key-sheet-input`, `key-sheet-visibility-toggle`, `key-sheet-error`
  - `<Button variant="primary" loading={isSubmitting} disabled={keyDraft.length === 0 || isSubmitting}>Guardar</Button>` (kit), ancho completo — `key-sheet-save`

**Conditional rendering states**

- If `keyDraft.length === 0`, render `key-sheet-save` with `disabled`
- If `isSubmitting === true`, render `<Button variant="primary" loading>`
- If `keyError === "invalid_key"`, render `<TmpKeyField error="Esa clave no es correcta" />`; la clave guardada no se toca
- If la clave nueva → `200`, reemplazar `access_key`, guardar el snapshot, cerrar el sheet y `syncStatus = "synced"`
- La pantalla de debajo sigue renderizada con sus datos y `syncStatus === "invalid_key"` mientras el sheet está abierto

**Interactions / transitions**

- Escribir en `key-sheet-input`, `key-sheet-visibility-toggle`: como en 2.1
- Pulsar `key-sheet-save` → `isSubmitting = true`, `GET /api/snapshot` con la clave nueva → estados de arriba
- Pulsar `key-sheet-close`, tocar fuera o deslizar hacia abajo → cierra el sheet; la app se queda en `invalid_key` con los datos visibles; `sync-badge` lo vuelve a abrir

### 2.7. StorageToast (almacenamiento no disponible)

- **Platform**: Web
- **Purpose**: avisar de que la app no puede guardar la copia (modo privado o almacenamiento lleno) y solo funcionará con red (PRD §10).
- **Route / entry point**: sobre cualquier pantalla con navegación, al arrancar, si la prueba de escritura en IndexedDB falla.

**Data required**

| Field | Type | Source |
|---|---|---|
| `storageAvailable` | boolean | prueba de escritura en IndexedDB |

**Component tree**

- `<Toast message="No se pueden guardar los datos en este dispositivo; sin conexión no funcionará." />` (kit: `components/feedback/Toast`; solo mensaje, sin icono ni botón de cerrar), por encima de la `BottomNav`, `role="status"`, `aria-live="polite"` — `storage-toast`

**Conditional rendering states**

- If `storageAvailable === false`, render `storage-toast` una vez por arranque
- Otherwise, do not render

**Interactions / transitions**

- No es interactivo. La pantalla que lo muestra lo cierra a los 4 s (ui_kit_registry, `Toast`). La app sigue funcionando con red.

### 2.8. PWA icon (recurso, no pantalla)

- **Platform**: Web
- **Purpose**: icono provisional "MC" para la instalación (FR-14, AC-17).
- Cuadrado con "MC" en Inter 800, `color-primary-500` oscuro (`#FF7A45`) sobre `color-bg` oscuro (`#15130F`). Tamaños: 192, 512, maskable (con zona segura) y `apple-touch-icon`. Va en `public/`; no es un componente ni un logo.

## 3. Navigation Map

```
arranque
 ├─ sin snapshot, sin red ──► FirstOpenOffline ──[Reintentar, con red]──► Welcome
 ├─ sin snapshot, con red ──► Welcome
 │                              ├─[Entrar, 401]──► Welcome (keyError)
 │                              ├─[Entrar, sin red]──► FirstOpenOffline
 │                              └─[Entrar, 200]──► Home (synced)
 └─ con snapshot ───────────► Home (pinta la copia) ──► actualización: syncing → synced | offline | error | invalid_key
                                                              │
Home ◄─► Routines ◄─► Exercises   (BottomNav <640 px, SideNav ≥640 px; SyncBadge en las tres)
 │
 ├─ invalid_key (401 en una actualización) ──► KeySheet (abierto sobre la pantalla actual)
 │      ├─[Guardar, 200]──► pantalla actual (synced)
 │      ├─[Guardar, 401]──► KeySheet (keyError)
 │      └─[Cerrar]──► pantalla actual (invalid_key) ──[toca sync-badge]──► KeySheet
 ├─ storageAvailable === false ──► StorageToast sobre la pantalla actual
 └─ 409 client_outdated ──► recarga ──► arranque
```

## 4. Data Requirements Summary

| Field | Type | Source |
|---|---|---|
| `snapshot` | `Snapshot` (PRD §7) | IndexedDB; `GET /api/snapshot` → `200` |
| `etag` | string | cabecera `ETag` de `GET /api/snapshot` |
| `last_synced_at` / `lastSyncedAt` | string (ISO 8601) | IndexedDB, reloj del dispositivo al terminar una actualización (`200` o `304`) |
| `access_key` | string | IndexedDB, guardada tras un `200` |
| `syncStatus` | `"synced" \| "offline" \| "syncing" \| "error" \| "invalid_key"` | capa de sincronización (FR-9) |
| `exerciseCount` | number | `snapshot.exercises.length` |
| `activeRoutineCount` / `pausedRoutineCount` | number | `snapshot.routines` por `status` |
| `skippedCount` | number | `snapshot.skipped.length` |
| `storageAvailable` | boolean | prueba de escritura en IndexedDB |
| `isOnline` | boolean | `navigator.onLine` y eventos `online` / `offline` |
| `keyDraft`, `isKeyVisible`, `isSubmitting`, `keyError` | string, boolean, boolean, `"invalid_key" \| null` | estado local de `Welcome` y `KeySheet` |

## 5. Component Legend

**Reused from `ui_kit_registry.md`**

| Component | Import path | Used on screens |
|---|---|---|
| `AppFrame` | `components/layout/AppFrame` | Home, Routines, Exercises |
| `AppShell` | `components/layout/AppShell` | Home, Routines, Exercises |
| `BottomNav` / `SideNav` | `components/navigation/Nav` | Home, Routines, Exercises |
| `Button` | `components/inputs/Button` | Welcome, FirstOpenOffline, KeySheet |
| `EmptyState` | `components/feedback/EmptyState` | FirstOpenOffline, Routines, Exercises |
| `SyncBadge` | `components/feedback/SyncBadge` | Home, Routines, Exercises (cinco estados; `invalid_key` interactivo) |
| `Sheet` | `components/overlays/Sheet` | KeySheet |
| `Toast` | `components/feedback/Toast` | StorageToast |

**New — temporary (needs formalizing before/at ship time)**

| Component | Purpose | Used on screens | Notes |
|---|---|---|---|
| `TmpKeyField` | Campo de clave con etiqueta visible, mostrar/ocultar (`Eye` / `EyeOff`) y error bajo el campo | Welcome, KeySheet | El registro no tiene ningún input; `Chip` no sirve. Anunciado el 2026-11-12. Props propuestas: `id`, `label`, `value`, `visible`, `error`, `disabled`, `onChange`, `onToggleVisible` |
| `TmpSummaryCard` | Card del resumen de la Home provisional | Home | `RoutineCard` y `ExerciseCard` llevan datos de rutina o ejercicio. Anunciado el 2026-11-12. Probablemente desaparece con "Hoy te toca" (#2) |

## 6. Deviations from PRD (Approved)

Ninguna: lo que cambió en el prototipo se llevó al PRD y al registro antes de escribir este documento. Para la trazabilidad:

| PRD said | We shipped instead | Why / who approved |
|---|---|---|
| Sin botón "Sincronizar" (definición y PRD §4) | Botón de icono "Actualizar" (`refresh-button`) en la cabecera desde 640 px; en small, solo el gesto de `AppShell`. Ya está en el PRD (FR-6e, AC-20) y en el registro (`AppShell`) | En pantallas anchas no hay gesto de tirar; es el patrón de `AppShell` de My Food. Al, 2026-11-12 |
| Rutinas y Ejercicios dentro del marco (FR-16) | `AppShell` con título "Rutinas" / "Ejercicios" en lugar de "My Coach" | El PRD no fija el título; sigue ui_standards §3 (títulos de pantalla). Al, 2026-11-12 |

El botón "Tira hacia abajo para actualizar" del lienzo solo simula el gesto y no se construye.

## 7. Open Items

1. **Registro:** proponer `TmpKeyField` como componente del registro (y del design system "My Coach") cuando la feature esté implementada; decidir si `TmpSummaryCard` se formaliza o se borra con la #2.
2. **Tema claro:** sigue a `prefers-color-scheme` (el interruptor manual queda fuera, PRD §4). El prototipo mostró la Home en claro con los avisos en `color-text` sobre el tinte amarillo.
3. **Design system en Claude Design:** volver a sincronizar "My Coach" con `ui_standards.md` y `ui_kit_registry.md` (su copia no tenía los iconos de §5 ni los cinco estados de `SyncBadge`).

Resueltos el 2026-11-12: `SyncBadge` con cinco estados (`synced` en `success`) y `Toast` (solo mensaje, 4 s) en el registro; botón "Actualizar" desde 640 px en el PRD (FR-6e, AC-20) y en `AppShell`.
