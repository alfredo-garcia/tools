# PRD: Mis rutinas

> Project: `fitness-coach`
> Feature: `fitness-coach/002`
> Variant: lite (rigor personal) · MVP: yes — Backlog item: #3 (Mis rutinas: lista con filtros y detalle con pie "Iniciar rutina")
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-11-12)
> Surfaces touched: web
> Prototype (ux-designer): required
> Source feature doc: n/a (PRD lite)
> Master doc referenced: `docs/functional-spec.md` (SCR-routines-list, CMP-sync-badge, snapshot)
> Status: Approved (2026-11-13)

## 1. Goal & Delta

Al encuentra cualquiera de sus rutinas en el móvil, también sin conexión, y ve exactamente qué tiene que hacer en ella (bloques, ejercicios y su dosis) sin abrir el knowledge-base ni preguntar por Telegram.

Antes: la pestaña Rutinas (SCR-routines-list) solo dice "Próximamente", aunque la copia de los datos ya trae las rutinas activas y pausadas (feature 001).

Después: la lista de rutinas en cards, con filtros por día y por tipo, y un detalle con un pie fijo "Iniciar rutina". El modo guiado es la feature siguiente (`fitness-coach/003`, backlog #5); hasta entonces el pie avisa de que llega pronto.

## 2. Out of Scope

- El modo guiado y el registro de sesiones: `fitness-coach/003`.
- Editar rutinas (dosis, orden, ejercicios) o crearlas: fuera del MVP.
- Filtro de dificultad: las rutinas no tienen nivel.
- El detalle de un ejercicio: llega con "Mis ejercicios" (backlog #4); en esta feature los ejercicios de una rutina no se pueden abrir.
- El historial de cambios de la rutina (`## History`): no está en la copia de los datos y no se muestra.
- Las rutinas en borrador o archivadas: no están en la copia de los datos.
- El estado del día (pendiente / parcial / hecha): es de "Hoy te toca" (backlog #2).

## 3. User Stories & Acceptance Criteria

**US-1. Como Al, quiero ver todas mis rutinas en cards, para encontrar la que busco de un vistazo.**

- `AC-1 (FR-1, FR-2)`: Given una copia con 3 rutinas activas y 1 pausada, when abro Rutinas, then veo 3 cards en la lista principal y 1 card en un grupo final "Pausadas", y la card pausada lleva la etiqueta "Pausada".
- `AC-2 (FR-2)`: Given una rutina con `title` "Fuerza de pierna", `category` `strength`, `days` [mon, thu], `duration_min` 40 y 2 bloques con 3 y 4 ejercicios, when veo su card, then muestra "Fuerza de pierna", la etiqueta de la categoría según `categories.yaml`, los días "L · J", "~40 min" y "7 ejercicios".
- `AC-3 (FR-2)`: Given una rutina sin `days` y sin `duration_min`, when veo su card, then muestra "Sin día fijo" y no muestra duración, sin error.
- `AC-4 (FR-1)`: Given una copia sin rutinas, when abro Rutinas, then veo el estado vacío "Todavía no hay rutinas" y ningún filtro.
- `AC-5 (FR-1)`: Given que no hay red y hay una copia guardada, when abro Rutinas, then veo las rutinas de la copia y el estado de sincronización "Sin conexión".

**US-2. Como Al, quiero filtrar por día de la semana y por tipo, para ver solo lo que me interesa.**

- `AC-6 (FR-3)`: Given rutinas para lunes y para jueves, when elijo el día "L", then solo veo las rutinas cuyo `days` incluye `mon`, también en el grupo "Pausadas".
- `AC-7 (FR-3)`: Given el día "L" elegido, when elijo además el tipo "Fuerza", then veo solo las rutinas de lunes con `category` `strength`.
- `AC-8 (FR-3)`: Given filtros que no dejan ninguna rutina, when se aplican, then veo "Ninguna rutina con estos filtros" y un botón "Quitar filtros" que vuelve a mostrarlas todas.
- `AC-9 (FR-3)`: Given filtros elegidos, when abro el detalle de una rutina y vuelvo atrás, then los filtros siguen elegidos.

**US-3. Como Al, quiero ver el detalle completo de una rutina, para saber qué voy a hacer antes de empezar.**

- `AC-10 (FR-4, FR-5)`: Given la lista, when toco una card, then se abre el detalle con el título, la categoría, los días, la duración y, por orden, cada bloque con su nombre, su nota y su duración si los tiene.
- `AC-11 (FR-5)`: Given un ejercicio con `sets` 3 y `reps` 12, otro con `sets` 2 y `time` 30, otro con `hold` 20 y otro con `duration_min` 10, when veo el detalle, then leo "3 × 12", "2 × 30 s", "aguantar 20 s" y "10 min", cada uno junto al título del ejercicio.
- `AC-12 (FR-5)`: Given un ejercicio con `variant` y `resistance`, when veo el detalle, then aparecen la etiqueta de la variante (de `variants` del ejercicio) y la de la resistencia (de `resistances.yaml`); un valor desconocido se muestra tal cual.
- `AC-13 (FR-5)`: Given un ejercicio de la rutina que no existe en la copia, when veo el detalle, then aparece su id con el aviso "Ejercicio no encontrado", y el resto de la rutina se ve normal.
- `AC-14 (FR-6)`: Given una rutina con `## Guidelines` y `## Progression`, when veo el detalle, then aparecen como "Pautas" y "Progresión"; si no existen, esas secciones no aparecen.
- `AC-15 (FR-4)`: Given el detalle abierto, when pulso atrás (botón de la pantalla o del navegador), then vuelvo a la lista en la misma posición de scroll.
- `AC-16 (FR-4)`: Given el detalle de una rutina abierto, when una actualización de los datos la quita de la copia, then veo "Esta rutina ya no está" y un botón "Volver a Rutinas".

**US-4. Como Al, quiero iniciar la rutina desde su detalle (cuando llegue el modo guiado).**

- `AC-17 (FR-7)`: Given el detalle de cualquier rutina, activa o pausada, when hago scroll, then el pie con "Iniciar rutina" sigue fijo y visible.
- `AC-18 (FR-7)`: Given que el modo guiado aún no existe, when toco "Iniciar rutina", then aparece el aviso "El modo guiado llega pronto" y no cambia nada más.
- `AC-19 (FR-8)`: Given el detalle de una rutina, when miro la URL, then no contiene ni el id ni el título de la rutina.

## 4. Functional Requirements

1. FR-1: La pantalla Rutinas lista las rutinas de la copia de los datos: primero las activas, después un grupo "Pausadas". Funciona igual sin conexión. Sin rutinas, muestra un estado vacío.
2. FR-2: Cada card muestra título, etiqueta de la categoría, días (abreviados L M X J V S D, o "Sin día fijo"), duración aproximada si existe y número total de ejercicios; las pausadas llevan "Pausada". Dentro de cada grupo, orden por el primer día de la semana de la rutina (lunes primero; sin día fijo al final) y después por título.
3. FR-3: Filtros por día (uno a la vez, o "Todos") y por tipo (una categoría a la vez, o "Todos"), combinados con Y, aplicados a los dos grupos. Se conservan al ir al detalle y volver, y mientras la app siga abierta. Solo se ofrecen las categorías que tiene alguna rutina de la copia.
4. FR-4: Tocar una card abre el detalle; atrás vuelve a la lista con su scroll. Si la rutina desaparece de la copia, el detalle lo dice y ofrece volver.
5. FR-5: El detalle muestra los bloques en orden (nombre `label`, o el id si no hay; nota; duración) y, en cada uno, sus ejercicios en orden con el título del ejercicio y su dosis: series × repeticiones, series × segundos, aguantar N s, N min, variante, resistencia, descanso (`rest` del ejercicio o, si no, el de la rutina) y nota. Un ejercicio que no existe se muestra con su id y un aviso.
6. FR-6: El detalle muestra las secciones "Pautas" (`## Guidelines`) y "Progresión" (`## Progression`) si existen. Plegadas por defecto, al final del detalle.
7. FR-7: El detalle tiene un pie fijo con "Iniciar rutina", para activas y pausadas. Hasta `fitness-coach/003`, tocarlo muestra el aviso "El modo guiado llega pronto".
8. FR-8: El detalle se abre en una ruta fija (`/routines/detail`) que guarda qué rutina mostrar en el estado de navegación del dispositivo, no en la URL (tech_standards §10: un id de rutina puede revelar datos de salud y las URLs llegan a los logs). Al ser una ruta fija, se precarga y funciona sin conexión.

## 5. Data & Contracts

Ninguno nuevo. Se usa la copia de los datos de `fitness-coach/001`: `routines` (activas y pausadas, con `sections.guidelines` y `sections.progression`), `exercises` (título y `variants`) y los vocabularios `categories` y `resistances`. Ningún cambio en `/api/snapshot` ni en el Drive.

## 6. UI States

Pantalla Rutinas (sustituye a SCR-routines-list provisional) y nueva pantalla Detalle de rutina, dentro del marco de la app, con los patrones de `ui_standards.md` y el registro del kit; el prototipo decide los componentes y anuncia cualquier `Tmp` nuevo.

- **Lista:** con rutinas · sin rutinas (estado vacío) · filtros sin resultado ("Quitar filtros") · sin conexión con copia (CMP-sync-badge) · primera apertura sin copia (ya la cubre `fitness-coach/001`).
- **Detalle:** normal · con ejercicio no encontrado · sin secciones · rutina pausada (etiqueta) · la rutina ya no está · aviso de "Iniciar rutina".

## 7. Edge Cases & Dependencies

- `days` vacío o ausente; `duration_min`, `label`, `note` o `rest` ausentes: no se muestran, sin error.
- Un `variant`, `resistance` o `category` desconocido: se muestra el valor tal cual (regla de la copia de los datos en el functional spec).
- Una rutina sin bloques o con un bloque sin ejercicios: se muestra el bloque vacío / "0 ejercicios", sin error.
- Títulos largos: se cortan en la card con elipsis y se ven completos en el detalle.
- Depende de: `fitness-coach/001` (copia de los datos, marco, navegación, CMP-sync-badge). La sigue: `fitness-coach/003` (modo guiado), que reemplaza el aviso de FR-7.
- Platform / release needs: ninguna.

## 8. Open Questions

Ninguna.
