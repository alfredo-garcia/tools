# My Coach — Documentación funcional

> Project: `fitness-coach`

> Punto de entrada. Mientras el producto es pequeño, todo vive aquí. Cuando un dominio crezca, pasará a `docs/functional/domains/` y este fichero quedará como mapa.

## 1. Visión general

My Coach es el compañero de bolsillo de Al en cada entrenamiento: le dice qué le toca hoy, le guía ejercicio a ejercicio y deja en su knowledge-base lo que hizo, para que su entrenador (Claude) vaya ajustando el programa. Es una PWA para el móvil (también se adapta a pantallas anchas), con un solo usuario, Al, y funciona sin conexión.

Los datos (ejercicios, rutinas, programa, sesiones y vocabularios) viven en la carpeta `fitness` del Drive de Al y los mantiene la skill `fitness-manager`; la app guarda una copia en el dispositivo y la mantiene al día. Hoy la app solo lee: el registro de sesiones llegará con una feature posterior.

## 2. Cómo leer esta documentación

- **IDs:** `SCR-` pantallas, `FLW-` flujos, `CMP-` componentes con comportamiento propio. Son permanentes.
- **Plataforma:** una sola superficie, `Web` (PWA). Solo se anota una diferencia entre móvil (< 640 px) y pantalla ancha (≥ 640 px) cuando cambia el comportamiento, no el aspecto.
- **Origen:** cada entrada indica la feature (PRD + UX Flow) que la definió.
- **Alcance:** qué hace el producto y por qué. El aspecto (colores, tipografía, componentes visuales) está en `docs/context/ui_standards.md` y `docs/context/ui_kit_registry.md`.

## 3. Mapa de dominios

| Dominio | Qué cubre | Fichero | Estado |
|---|---|---|---|
| access | Acceso con la clave, primera apertura, copia en el dispositivo y su sincronización | inline abajo | Activo |
| home | Pantalla de Inicio | inline abajo | Activo (provisional) |
| routines | Rutinas: lista con filtros y detalle | inline abajo | Activo |
| exercises | Ejercicios | inline abajo | Provisional ("Próximamente") |

## 4. Navegación

- **Móvil (< 640 px):** barra inferior fija con Inicio, Rutinas y Ejercicios; el destino actual está marcado. Para actualizar a mano, se tira de la pantalla hacia abajo.
- **Pantalla ancha (≥ 640 px):** barra lateral con la marca "MC", "My Coach" y los mismos tres destinos. Para actualizar a mano, botón "Actualizar" en la cabecera (no hay gesto).
- La navegación no aparece en la bienvenida ni en la pantalla de primera apertura sin red.

## 5. Índice de pantallas y flujos

Todavía no hace falta: el mapa de dominios basta.

## 6. Conceptos transversales

**Funcionamiento sin conexión.** Toda pantalla se pinta desde la copia guardada en el dispositivo, antes de cualquier petición de red, y la app funciona entera sin red una vez hecha la primera sincronización. Instalada como app, arranca sin red aunque esté cerrada del todo.

**Actualización automática.** La app pide los datos nuevos: al abrirse; al volver a primer plano si la última sincronización correcta tiene más de 1 minuto; al recuperar la conexión; y a mano (gesto en móvil, botón "Actualizar" en pantalla ancha), siempre. Solo hay una actualización a la vez: los disparadores que llegan durante otra se ignoran. Si el Drive no ha cambiado, los datos no cambian y solo se renueva la hora de la última sincronización. Si el Drive falla o la actualización tarda más de 15 s, se abandona sin tocar la copia. La copia se reemplaza siempre de una vez, nunca a medias.

**Estado de sincronización.** En todas las pantallas con navegación se ve uno de cinco estados (ver CMP-sync-badge): sincronizado, sin conexión, sincronizando, no se pudo actualizar y clave no válida. Con datos guardados y red, al abrir la app se ve "Sincronizando…" hasta que termina: la app nunca dice que los datos están al día sin haberlo comprobado.

**Clave de acceso.** Los datos son de salud y están protegidos por una clave compartida. Se pide una sola vez, en la primera apertura, y se guarda en el dispositivo. Si el servidor deja de aceptarla, la copia sigue visible y se pide la clave nueva; la anterior solo se sustituye cuando la nueva es aceptada.

**Ficheros que no se pueden leer.** Un fichero del knowledge-base mal escrito o fuera de esquema se deja fuera sin afectar al resto; la app cuenta cuántos, sin mostrar su contenido ni su ruta. Si el que falla es el programa, las sesiones o un vocabulario, la app conserva la versión que tenía.

**Almacenamiento no disponible.** Si el navegador no deja guardar datos (modo privado, almacenamiento lleno o bloqueado), la app funciona solo con red y lo avisa una vez por arranque: "No se pueden guardar los datos en este dispositivo; sin conexión no funcionará." El aviso se cierra solo a los 4 s.

**Versión nueva de la app.** Si el servidor indica que la app instalada está desactualizada, la app se recarga para coger la versión nueva y vuelve a pedir los datos (sin entrar en bucle si el aviso se repite).

**Datos del navegador borrados.** La app vuelve a la primera apertura y pide la clave.

## 7. Componentes compartidos

### [CMP-sync-badge] Estado de sincronización

- **Referencia del design system:** `SyncBadge` (`components/feedback/SyncBadge`) en `ui_kit_registry.md`.
- **Función:** decir siempre si los datos están al día y de cuándo son.
- **Reglas:**
  - Sincronizado: "Sincronizado · hace X", con la edad de la última sincronización correcta.
  - Sin conexión: "Sin conexión · datos de hace X".
  - Sincronizando: "Sincronizando…".
  - No se pudo actualizar: "No se pudo actualizar · datos de hace X". El siguiente disparador lo vuelve a intentar.
  - Clave no válida: "Clave no válida · toca para introducirla". Solo en este estado se puede pulsar, y abre la petición de la clave nueva (ver SCR-access-home-key).
  - Las edades: "hace un momento" (< 1 min), "hace N min", "hace N h", "ayer", y una fecha corta a partir de 2 días. Se calculan con el reloj del propio dispositivo.
- **Usado en:** SCR-home, SCR-routines-list, SCR-exercises-list.
- **Origen:** `001_offline-kb-data_prd.md` + `001_offline-kb-data_ux_flow.md`.

## 8. Entidades de datos compartidas

### Copia de los datos (snapshot)

- **Definición:** la copia de los datos del knowledge-base que la app guarda en el dispositivo y desde la que pinta todo: ejercicios, rutinas activas y pausadas, el programa (fase, restricciones y calendario semanal, sin el diario), las sesiones de los últimos 14 días y los vocabularios. Las rutinas en borrador o archivadas no se descargan, ni el historial de cambios de las rutinas.
- **Ciclo de vida:** no existe (primera apertura) → guardada tras la primera sincronización con la clave correcta → reemplazada en cada actualización con cambios → se pierde si se borran los datos del navegador.
- **Reglas:** una rutina que apunta a un ejercicio que no existe se conserva, marcada; un `variant` o `resistance` desconocido se conserva tal cual. Cada feature decide cómo mostrarlos.
- **Propietario:** access.
- **La usan:** home, routines (y, cuando lleguen, exercises y el modo guiado).
- **Origen:** `001_offline-kb-data_prd.md` §7.

## 9. Flujos entre dominios

Ninguno todavía.

## 10. Glosario

- **Copia / snapshot:** los datos del knowledge-base guardados en el dispositivo (§8).
- **Sincronizar / actualizar:** pedir al servidor la copia más reciente y reemplazar la guardada.
- **Clave de acceso:** la clave compartida que protege los datos de salud; se pide una vez por dispositivo.
- **Knowledge-base:** la carpeta `fitness` del Drive de Al, fuente de verdad de los datos; la mantiene `fitness-manager`.

## 11. Cambios recientes

- 2026-11-14 — Rutinas: lista con filtros por día y tipo, y detalle con bloques, ejercicios y dosis (ver `changelog/002_my-routines_changelog.md`).
- 2026-11-13 — Acceso, Inicio, Rutinas, Ejercicios: datos del knowledge-base sin conexión, primera versión de la app (ver `changelog/001_offline-kb-data_changelog.md`).

---

## Dominio: Acceso y datos (`access`)

### Visión general

La primera apertura (clave o falta de red), la petición de una clave nueva y todo lo que mantiene la copia de los datos al día. No tiene destino propio en la navegación: sus pantallas aparecen antes del marco de la app o por encima de él.

### Pantallas

#### [SCR-access-welcome] Bienvenida

- **Plataforma:** Web.
- **Propósito:** pedir la clave de acceso la primera vez y comprobarla descargando los datos.
- **Entradas:** FLW-access-first-open; abrir la app sin copia guardada y con red; "Reintentar" desde SCR-access-first-open-offline.
- **Composición:** CMP-access-key-field; botón "Entrar".
- **Datos y reglas:** sin navegación. "Entrar" solo se puede pulsar con algo escrito. La clave solo se guarda si el servidor la acepta, y entonces se guardan también los datos. Tras aceptarla, la app abre Inicio, sea cual sea la dirección con la que se abrió.
- **Estados:**
  - Esperando la clave.
  - Entrando: comprobando la clave, sin poder editar.
  - Clave incorrecta: "Esa clave no es correcta", sin guardar nada.
  - Sin red al entrar: pasa a SCR-access-first-open-offline.
  - El servidor falla o tarda: "No se pudo conectar. Inténtalo de nuevo." *(pendiente de confirmar en el UX Flow)*.
  - App desactualizada: la app se recarga y hay que volver a escribir la clave *(ver preguntas abiertas)*.
- **Flujos:** FLW-access-first-open.
- **Origen:** `001_offline-kb-data_prd.md` + `001_offline-kb-data_ux_flow.md`.

#### [SCR-access-first-open-offline] Primera apertura sin red

- **Plataforma:** Web.
- **Propósito:** explicar que la primera vez hace falta conexión.
- **Entradas:** abrir la app sin copia guardada y sin red; red caída al pulsar "Entrar" en SCR-access-welcome.
- **Composición:** mensaje "Necesitas conexión la primera vez" y botón "Reintentar".
- **Datos y reglas:** sin navegación. "Reintentar" lleva a SCR-access-welcome si hay red; si no, no hace nada.
- **Flujos:** FLW-access-first-open.
- **Origen:** `001_offline-kb-data_prd.md` + `001_offline-kb-data_ux_flow.md`.

La petición de la clave nueva no es una pantalla propia: es un sheet que se abre sobre la pantalla actual (ver CMP-access-key-sheet).

### Componentes con comportamiento propio

#### [CMP-access-key-field] Campo de la clave

- **Referencia del design system:** todavía no está en `ui_kit_registry.md`: es el componente temporal `TmpKeyField` de la feature 001; está pendiente de formalizar.
- **Función:** escribir la clave con su etiqueta visible, poder mostrarla u ocultarla, y ver el error bajo el campo.
- **Reglas:** oculta al empezar y cada vez que se vuelve a abrir el sheet. Con error, el campo queda marcado como no válido y el mensaje se anuncia.
- **Usado en:** SCR-access-welcome, CMP-access-key-sheet.
- **Origen:** `001_offline-kb-data_ux_flow.md`.

#### [CMP-access-key-sheet] Clave nueva

- **Referencia del design system:** `Sheet` en `ui_kit_registry.md`, con CMP-access-key-field.
- **Función:** pedir la clave nueva cuando el servidor rechaza la guardada, sin ocultar los datos.
- **Reglas:**
  - Se abre solo la primera vez que el servidor rechaza la clave; después se reabre pulsando CMP-sync-badge en "Clave no válida".
  - "Guardar" solo con algo escrito. Clave incorrecta: "Esa clave no es correcta" y la guardada no cambia. Clave correcta: sustituye a la anterior, se completan la actualización y el sheet se cierra.
  - Sin red al guardar: "Sin conexión. Inténtalo al volver la red." *(pendiente de confirmar en el UX Flow)*. Si el servidor falla: "No se pudo conectar. Inténtalo de nuevo." *(ídem)*.
  - Se cierra con su botón, tocando fuera, con Escape o deslizando hacia abajo; la app se queda en "Clave no válida" con los datos visibles.
- **Usado en:** sobre SCR-home, SCR-routines-list y SCR-exercises-list.
- **Origen:** `001_offline-kb-data_prd.md` (FR-12) + `001_offline-kb-data_ux_flow.md` (2.6).

### Flujos

#### [FLW-access-first-open] Primera apertura

- **Objetivo:** tener la copia de los datos y la clave en un dispositivo nuevo (o tras borrar sus datos).
- **Pantallas:** sin red: SCR-access-first-open-offline → (Reintentar con red) → SCR-access-welcome. Con red: SCR-access-welcome → (clave correcta) → SCR-home.
- **Reglas:** sin copia guardada no se puede usar la app; no se guarda nada hasta que el servidor acepta la clave.
- **Casos límite:** clave incorrecta, sin red al entrar, servidor caído (ver SCR-access-welcome).
- **Origen:** `001_offline-kb-data_prd.md` + `001_offline-kb-data_ux_flow.md`.

#### [FLW-access-sync] Actualización de los datos

- **Objetivo:** que la copia refleje el Drive sin que Al haga nada.
- **Pantallas:** ocurre sobre cualquier pantalla con navegación; se ve en CMP-sync-badge.
- **Reglas:** disparadores, una sola a la vez, sin cambios, fallos y plazo de 15 s: ver §6 "Actualización automática".
- **Casos límite:** sin red → "Sin conexión" y la copia intacta; servidor caído o lento → "No se pudo actualizar"; clave rechazada → FLW-access-new-key; app desactualizada → recarga.
- **Origen:** `001_offline-kb-data_prd.md` (FR-5 a FR-9, FR-13).

#### [FLW-access-new-key] Clave nueva

- **Objetivo:** seguir actualizando cuando la clave guardada deja de valer.
- **Pantallas:** pantalla actual (rechazo en una actualización) → CMP-access-key-sheet → (clave correcta) → pantalla actual, sincronizada.
- **Reglas:** la copia sigue visible en todo momento; la clave guardada solo cambia cuando la nueva es aceptada.
- **Origen:** `001_offline-kb-data_prd.md` (FR-12) + `001_offline-kb-data_ux_flow.md` (2.6).

### Glosario del dominio

- **Primera apertura:** abrir la app en un dispositivo sin copia guardada.

---

## Dominio: Inicio (`home`)

### Visión general

La pantalla de Inicio. En esta versión es provisional: muestra un resumen de lo cargado. "Hoy te toca" la sustituirá.

### Pantallas

#### [SCR-home] Inicio (provisional)

- **Plataforma:** Web.
- **Propósito:** ver de un vistazo que los datos están cargados y de cuándo son.
- **Entradas:** destino Inicio de la navegación; abrir la app con copia guardada; tras la primera apertura.
- **Composición:** CMP-sync-badge; saludo "Hola, Al"; CMP-home-summary.
- **Datos y reglas:** todo sale de la copia guardada (§8); actualizar a mano según §4.
- **Estados:** los de CMP-sync-badge; aviso de almacenamiento no disponible (§6).
- **Origen:** `001_offline-kb-data_prd.md` (FR-17) + `001_offline-kb-data_ux_flow.md` (2.3).

### Componentes con comportamiento propio

#### [CMP-home-summary] Resumen de datos

- **Referencia del design system:** todavía no está en `ui_kit_registry.md`: es el componente temporal `TmpSummaryCard` de la feature 001; probablemente desaparezca con "Hoy te toca".
- **Función:** contar lo cargado.
- **Reglas:**
  - "N ejercicios · M rutinas activas" (también con 0 rutinas activas, sin error).
  - "1 pausada" / "K pausadas" solo si hay alguna.
  - "1 fichero no se pudo leer" / "K ficheros no se pudieron leer" solo si hay ficheros excluidos, sin decir cuáles.
  - "Actualizado hace X": la edad de la última sincronización correcta.
- **Usado en:** SCR-home.
- **Origen:** `001_offline-kb-data_ux_flow.md` (2.3).

---

## Dominio: Rutinas (`routines`)

### Visión general

Al encuentra cualquiera de sus rutinas, también sin conexión, y ve qué tiene que hacer en ella antes de empezar. Solo consulta: las rutinas las crea y cambia `fitness-manager`.

### Pantallas

#### [SCR-routines-list] Rutinas

- **Plataforma:** Web.
- **Propósito:** ver todas las rutinas de un vistazo y filtrarlas por día y por tipo.
- **Entradas:** destino Rutinas de la navegación; "Atrás" desde SCR-routines-detail.
- **Composición:** CMP-sync-badge; filtros "Día" (Todos, L M X J V S D) y "Tipo" (Todos y los tipos que tiene alguna rutina), cada opción con su recuento; cards de las rutinas activas; al final, el grupo "Pausadas" con sus cards.
- **Card de rutina:** tipo (emoji y nombre), título en una línea, duración aproximada si existe, número de ejercicios y los siete días de la semana con los de la rutina marcados ("Sin día fijo" si no tiene).
- **Reglas:**
  - Orden dentro de cada grupo: por el primer día de la semana de la rutina (lunes primero; las que no tienen día fijo, al final) y después por título.
  - Los dos filtros se combinan (día **y** tipo) y se aplican a los dos grupos; uno a la vez en cada filtro. El grupo "Pausadas" desaparece si no le queda ninguna.
  - Los filtros y la posición de la lista se conservan al abrir un detalle y volver, mientras la app siga abierta.
  - Sin conexión, la lista sale de la copia del dispositivo.
- **Estados:** sin rutinas ("Todavía no hay rutinas", sin filtros) · filtros sin resultado ("Ninguna rutina con estos filtros" y "Quitar filtros").
- **Origen:** `002_my-routines_prd.md` (FR-1 a FR-3) + `002_my-routines_ux_flow.md` (2.1). Sustituye a la versión provisional de `fitness-coach/001`.

#### [SCR-routines-detail] Detalle de rutina

- **Plataforma:** Web. En móvil, pantalla completa; en pantalla ancha, ventana sobre la lista.
- **Propósito:** ver todo lo que hay que hacer en una rutina antes de empezar.
- **Entradas:** una card de SCR-routines-list.
- **Composición:** "Atrás"; cabecera (tipo, "Pausada" si lo está, título, duración, número de ejercicios, días); un bloque desplegado por cada bloque de la rutina, en orden, con su nombre, duración y nota, y sus ejercicios; al final, "Pautas" y "Progresión" plegadas, si existen; pie fijo "Iniciar rutina".
- **Ejercicio:** monigote (o el tinte de su región si no tiene), nombre y dosis: "3 × 12", "2 × 30 s", "aguantar 20 s", "10 min", con "· descanso N s" si hay descanso (el del ejercicio o, si no, el de la rutina) y "por lado" si el ejercicio es de un solo lado; debajo, la variante y la resistencia por su nombre, y la nota. En esta versión los ejercicios no se pueden abrir.
- **Reglas:**
  - La dirección del detalle es siempre la misma y no lleva ni el id ni el nombre de la rutina (datos de salud fuera de las URLs); qué rutina mostrar se guarda en el dispositivo. Funciona sin conexión.
  - Un ejercicio que ya no existe se muestra con su id y "Ejercicio no encontrado"; una variante, resistencia o tipo desconocidos, tal cual.
  - Si una actualización de los datos cambia la rutina abierta, el detalle se repinta; si la quita, muestra "Esta rutina ya no está" y "Volver a Rutinas".
  - "Iniciar rutina" está en activas y pausadas. Hasta que llegue el modo guiado (`fitness-coach/003`), solo avisa: "El modo guiado llega pronto".
- **Origen:** `002_my-routines_prd.md` (FR-4 a FR-8) + `002_my-routines_ux_flow.md` (2.2).

### Flujos

#### [FLW-routines-browse] Consultar una rutina

1. Rutinas → (opcional) elegir día y tipo.
2. Tocar una card → detalle.
3. "Atrás" (o el atrás del navegador) → la lista, con los mismos filtros y la misma posición.

### Glosario del dominio

- **Rutina pausada:** una rutina que Al no está haciendo ahora; se puede consultar e iniciar igual.
- **Bloque:** parte de una rutina (calentamiento, fuerza, piscina…), con sus ejercicios en orden.
- **Dosis:** lo que toca de un ejercicio en esa rutina: series, repeticiones o segundos, descanso, variante y resistencia.

---

## Dominio: Ejercicios (`exercises`)

### Pantallas

#### [SCR-exercises-list] Ejercicios (provisional)

- **Plataforma:** Web.
- **Propósito:** destino Ejercicios de la navegación; de momento solo dice "Próximamente".
- **Entradas:** destino Ejercicios.
- **Composición:** CMP-sync-badge; "Próximamente · Aquí verás tus ejercicios."
- **Origen:** `001_offline-kb-data_prd.md` (FR-16) + `001_offline-kb-data_ux_flow.md` (2.5).
