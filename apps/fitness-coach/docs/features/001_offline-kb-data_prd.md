# PRD: Datos del knowledge-base sin conexión

> Project: `fitness-coach`
> Feature: `fitness-coach/001`
> Tech standards applied: `docs/context/tech_standards.md` (approved 2026-11-12); una sola superficie (web)
> Surfaces touched: web
> Issue: n/a (work_tracker: none)
> Technical review (tech-lead Mode C): n/a (rigor personal)
> Test plan (qa-engineer): n/a (rigor personal)
> Prototype (ux-designer): required
> Source feature doc: `001_offline-kb-data.md`
> Master doc referenced: ninguno todavía (no existe `docs/functional-spec.md`; es la primera feature)
> Status: Approved (2026-11-12)

## 1. Summary

La primera pieza de My Coach: la app lee la carpeta `fitness` del Drive de Al (ejercicios, rutinas, programa, sesiones recientes y vocabularios), guarda una copia en el móvil y funciona entera con esa copia sin conexión, actualizándose sola cuando hay red. Incluye lo mínimo para verlo y usarlo en el móvil: la clave de acceso la primera vez, el marco de la app con su navegación, el estado de sincronización, una Home provisional con el resumen de lo cargado y la instalación como PWA "My Coach". Es la base de todas las demás features del MVP.

## 2. Background & Context

- **Hoy:** no existe la app. Los datos viven en la carpeta `fitness` del Drive (espejo local `~/knowledge-base/fitness`) con el contrato de `fitness/_system/schema.md` (exercises 1, routines 3, program 1, sessions 1) y los mantiene la skill `fitness-manager`. Datos actuales: 29 ejercicios (21 con `figure`), 7 rutinas activas, `sessions/al.yaml` vacío con ejemplos comentados.
- **Arquitectura ya decidida:** Next.js en Vercel con rutas de servidor como pasarela fina a Drive (service account, ADR 002); el cliente guarda un snapshot en IndexedDB y un service worker sirve la app sin conexión (ADR 001); clave compartida para leer y escribir (ADR 003). Ver `hl_architecture.md` §5–§7 y `tech_standards.md` §3, §4, §9–§11.
- **Por qué ahora:** todo lo demás del MVP (Home, rutinas, ejercicios, modo guiado) lee estos datos y tiene que funcionar sin conexión.

## 3. Goals & Success Metrics

- **G1:** sin red, la app abre y muestra los datos de la última sincronización en menos de 1 s.
- **G2:** con red, un cambio hecho en el Drive aparece en la app sin que Al haga nada más que abrirla o volver a ella.
- **G3:** Al ve siempre si los datos están al día y de cuándo son.
- **Éxito (cualitativo):** Al usa la app en la piscina sin cobertura y nunca se encuentra una pantalla en blanco ni un dato a medias.

## 4. Non-Goals / Out of Scope

- Escribir en el Drive: ni sesiones (`session.complete`) ni la cola de envíos pendientes (outbox). Llega con la #5. Esta feature solo lee.
- "Hoy te toca", listas, detalles y filtros de rutinas y ejercicios (#2, #3, #4). Aquí Rutinas y Ejercicios muestran "Próximamente".
- Decidir qué se muestra de las rutinas pausadas (#2, #3); aquí solo se descargan.
- Botón "Sincronizar"; sincronización entre dispositivos; notificaciones o avisos push.
- Editar o reinterpretar el formato del knowledge-base; leer `sessions/_archive/`.
- Diseñar el logo; el icono "MC" es provisional.
- El diario del programa (`program.journal`): ninguna feature del MVP lo usa, así que no se descarga (ver FR-3).
- Cambio de tema claro / oscuro manual en la UI: sigue a `prefers-color-scheme` (ui_standards §2); el interruptor llega con otra feature.

## 5. User Stories & Acceptance Criteria

**US-1. Como** Al, **quiero** abrir la app sin conexión y tener mis datos, **para** consultar mis rutinas en la piscina.
- AC-1 (FR-1, FR-5, FR-9): Given una copia guardada con 29 ejercicios y 7 rutinas activas y el dispositivo sin red, when Al abre la app, then la Home provisional muestra "29 ejercicios · 7 rutinas activas" y el estado "Sin conexión · datos de hace <tiempo>", sin ninguna petición de red bloqueante.
- AC-2 (FR-15): Given la app instalada y abierta antes al menos una vez con red, when Al la abre sin red con la app cerrada del todo (arranque en frío), then la app carga y muestra la Home provisional (no la página de error del navegador).
- AC-3 (FR-11): Given que es la primera apertura (sin copia guardada) y no hay red, when Al abre la app, then ve "Necesitas conexión la primera vez" con "Reintentar", y al recuperar la red y pulsar "Reintentar" pasa a pedir la clave.

**US-2. Como** Al, **quiero** que la app se actualice sola, **para** ver los cambios que `fitness-manager` hace por Telegram sin acordarme de sincronizar.
- AC-4 (FR-6): Given una copia de hace 2 horas y red disponible, when Al abre la app, then primero ve la copia guardada y, al terminar la actualización, el resumen y el estado reflejan los datos nuevos ("Sincronizado · hace un momento").
- AC-5 (FR-6): Given la app abierta en segundo plano y una rutina cambiada en el Drive, when Al vuelve a la app (pasa a primer plano) y la última sincronización correcta tiene más de 1 minuto, then se lanza una actualización y el resumen refleja el cambio.
- AC-6 (FR-6): Given la app abierta sin red, when vuelve la conexión, then se lanza una actualización sin que Al haga nada.
- AC-7 (FR-6): Given la Home provisional con red, when Al tira hacia abajo para refrescar, then se lanza una actualización aunque la última tenga menos de 1 minuto, y se ve el estado "Sincronizando".
- AC-8 (FR-7): Given que el Drive no ha cambiado desde la última copia, when se actualiza, then los datos no cambian y la hora de "Sincronizado" pasa a la actual.
- AC-9 (FR-8): Given una actualización en curso, when se produce otro disparador (volver a la app, red, gesto), then no se lanza una segunda actualización en paralelo.

**US-3. Como** Al, **quiero** poner la clave una sola vez, **para** que nadie más vea mis datos de salud y yo no tenga que escribirla cada día.
- AC-10 (FR-10): Given la primera apertura con red, when Al escribe la clave correcta y pulsa "Entrar", then se descargan los datos, se muestra la Home provisional y en las siguientes aperturas no se pide la clave.
- AC-11 (FR-10): Given la primera apertura, when Al escribe una clave incorrecta, then ve "Esa clave no es correcta" en el mismo formulario y no se guarda nada.
- AC-12 (FR-12): Given una copia guardada y una clave que el servidor ya no acepta (la clave se cambió), when la app intenta actualizar, then la copia sigue visible, el estado pasa a "Clave no válida" y se pide la clave nueva; al introducir la correcta, la actualización se completa.

**US-4. Como** Al, **quiero** saber siempre si mis datos están al día, **para** fiarme de lo que veo.
- AC-13 (FR-9): Given cada uno de los estados (sincronizado, sin conexión, sincronizando, error, clave no válida), when se muestra cualquier pantalla con navegación, then el `SyncBadge` muestra el texto y el icono de ese estado, y en "sincronizado", "sin conexión" y "error" también hace cuánto se sincronizó por última vez.
- AC-14 (FR-13): Given red pero el Drive falla o tarda más de 15 s, when se actualiza, then la copia anterior sigue visible sin cambios y el estado muestra "No se pudo actualizar · datos de hace <tiempo>"; el siguiente disparador lo vuelve a intentar.

**US-5. Como** Al, **quiero** que un fichero mal escrito no rompa la app, **para** seguir entrenando aunque `fitness-manager` se equivoque en uno.
- AC-15 (FR-4): Given que 1 de las 7 rutinas activas no cumple el esquema, when se actualiza, then la Home muestra "28 ejercicios…" o "6 rutinas activas" según corresponda y el aviso "1 fichero no se pudo leer", sin mostrar el contenido del fichero; el resto de los datos se actualiza.
- AC-16 (FR-4): Given que `program/al.yaml` no se puede leer, when se actualiza, then ejercicios y rutinas se actualizan igual, el aviso cuenta 1 fichero y el programa se queda con su versión anterior (o vacío si nunca hubo).

**US-6. Como** Al, **quiero** instalar la app en el móvil, **para** abrirla como "My Coach" desde la pantalla de inicio.
- AC-17 (FR-14): Given la app abierta en Chrome de Android o Safari de iOS, when Al la añade a la pantalla de inicio, then aparece con el nombre "My Coach" y el icono "MC", y al abrirla se ve a pantalla completa (sin barra del navegador).

**US-7. Como** Al, **quiero** ver ya la estructura de la app, **para** saber dónde estará cada cosa.
- AC-18 (FR-16): Given la app en un móvil (<640 px), when Al la abre, then ve la barra inferior con Inicio, Rutinas y Ejercicios, con Inicio activo; al pulsar Rutinas o Ejercicios ve un estado vacío "Próximamente" y la barra sigue visible.
- AC-19 (FR-16): Given la app en una pantalla ≥ 640 px, when se abre, then la navegación es la barra lateral con el icono y "My Coach".

## 6. Functional Requirements

1. **FR-1:** La app guarda en el dispositivo una copia (snapshot) con los ejercicios, las rutinas `active` y `paused`, el programa (sin diario), las sesiones de los últimos 14 días y los vocabularios, y pinta cualquier pantalla desde esa copia.
2. **FR-2:** El servidor construye el snapshot leyendo la carpeta `fitness` del Drive según `fitness/_system/schema.md`: `exercises/items/*/*.md` (frontmatter y secciones del cuerpo), `routines/items/*/*.md` (idem), `program/al.yaml`, `sessions/al.yaml`, `_system/*.yaml` y `routines/_system/categories.yaml`. Las rutinas `draft` y `archived` no se incluyen.
3. **FR-3:** Del programa se incluyen `phase`, `constraints` y `schedule`; `journal` no se incluye.
4. **FR-4:** Un fichero que no se puede leer o no cumple el esquema se excluye sin afectar a los demás. El snapshot indica cuántos ficheros se excluyeron y, por fichero, solo su ruta relativa y un código de motivo (`parse_error`, `schema_error`), nunca su contenido. Si un fichero de nivel único (programa, sesiones, un vocabulario) falla, el cliente conserva su versión anterior.
5. **FR-5:** Al abrir la app, la copia guardada se muestra antes de cualquier petición de red.
6. **FR-6:** La app pide una actualización: (a) al abrir; (b) al volver a primer plano, si la última sincronización correcta tiene más de 1 minuto; (c) al recuperar la conexión; (d) con el gesto de tirar para refrescar en la Home provisional, siempre.
7. **FR-7:** La actualización es condicional: si el snapshot no ha cambiado, el servidor responde sin cuerpo y el cliente solo actualiza la hora de la última sincronización.
8. **FR-8:** Como mucho hay una actualización en curso a la vez; los disparadores que llegan durante ella se ignoran.
9. **FR-9:** El estado de sincronización es uno de: `synced` (con hace cuánto), `offline` (con la edad de los datos), `syncing`, `error` (con la edad de los datos) y `invalid_key`; se muestra con `SyncBadge` en las pantallas con navegación.
10. **FR-10:** En la primera apertura con red, la app pide la clave de acceso, la valida contra el servidor descargando el snapshot y, si es correcta, la guarda en el dispositivo. Si es incorrecta, no guarda nada y lo dice.
11. **FR-11:** En la primera apertura sin red (sin copia), la app muestra "Necesitas conexión la primera vez" con "Reintentar".
12. **FR-12:** Si el servidor rechaza la clave guardada, la copia sigue visible, el estado pasa a `invalid_key` y la app pide la clave nueva (en un `Sheet`); la clave anterior se reemplaza solo cuando la nueva es aceptada.
13. **FR-13:** Si el Drive falla o la actualización tarda más de 15 s, la actualización se abandona sin tocar la copia y el estado pasa a `error`.
14. **FR-14:** La app es instalable como PWA: nombre y nombre corto "My Coach", icono "MC" (192, 512 y maskable, más `apple-touch-icon`), modo `standalone`, colores de fondo y tema `color.bg` oscuro.
15. **FR-15:** El service worker guarda el shell de la app (HTML, JS, CSS, fuentes, iconos) para que la app arranque en frío sin red.
16. **FR-16:** La app tiene su marco (`AppFrame` + `AppShell`) con la navegación de ui_standards §9: Inicio (Home provisional), Rutinas y Ejercicios (estado vacío "Próximamente").
17. **FR-17:** La Home provisional muestra el saludo, el resumen "N ejercicios · M rutinas activas" (más "K pausadas" si K > 0), el aviso de ficheros excluidos si los hay, y la hora de la última sincronización.

## 7. Data Model / Schema Changes

**Knowledge-base:** ningún cambio. Solo lectura del contrato actual.

**Snapshot** (documento que devuelve el servidor y que el cliente guarda tal cual), ya normalizado para que las features siguientes no vuelvan a parsear YAML/Markdown en el cliente:

```
Snapshot {
  format: 1                       // versión del formato del snapshot (sube si cambia la forma)
  generated_at: string            // ISO 8601
  exercises: Exercise[]           // frontmatter del esquema (exercises 1) + sections
  routines: Routine[]             // status active | paused; frontmatter (routines 3) + sections
  program: { phase, constraints, schedule } | null
  sessions: Session[]             // de sessions/al.yaml, date >= hoy - 14 días
  vocabularies: { [vocab: string]: { [id: string]: { label: string, ... } } }   // regions, zones, muscles, goals, patterns, positions, equipment, resistances, stresses, levels, categories
  skipped: { path: string, reason: "parse_error" | "schema_error" }[]
}
Exercise.sections = { execution, common_mistakes?, progression?, notes? }   // texto Markdown de cada sección
Routine.sections  = { guidelines?, progression? }                          // `## History` no se incluye
```

- Los ids son los del knowledge-base (slugs); los campos desconocidos del frontmatter se conservan tal cual.
- Una rutina cuyo item apunta a un `ex` inexistente se conserva; ese item lleva `missing_exercise: true`; cada feature decide cómo mostrarlo.

**Estado en el dispositivo:** `snapshot`, `etag`, `last_synced_at` (ISO 8601), `access_key`. Nada más en esta feature.

## 8. API / Interface Contracts

**`GET /api/snapshot`** (tech_standards §3)
- Cabeceras de petición: `x-app-key` (obligatoria), `If-None-Match` (opcional, el `etag` guardado), `x-client-format: 1` (para el `409 client_outdated` de §3).
- `200` + cuerpo `Snapshot` + cabecera `ETag`; `Cache-Control: private, no-store` *(los datos de salud nunca se cachean en la CDN)*.
- `304` sin cuerpo si el `ETag` coincide.
- `401 { error: { code: "invalid_key", message } }`: falta la clave o no coincide con `APP_ACCESS_KEY`.
- `409 { error: { code: "client_outdated" } }`: `x-client-format` distinto del del servidor; el cliente se recarga para coger la versión nueva.
- `502 { error: { code: "drive_unavailable" } }`: el Drive falla o no responde.
- `500 { error: { code: "server_misconfigured" } }`: faltan variables de entorno.
- Los logs de la ruta registran solo método, ruta, status, duración, nº de ficheros y nº de excluidos (§5).

No hay escrituras ni otras rutas en esta feature.

## 9. UI/UX Requirements

### Web (única superficie)

Componentes del registro: `AppFrame`, `AppShell`, `BottomNav` / `SideNav`, `SyncBadge`, `EmptyState`, `Sheet`, `Button`, `Toast`. Pantallas y estados:

| Pantalla / estado | Qué se ve |
|---|---|
| Primera apertura con red | Pantalla de bienvenida sin navegación: "My Coach", campo de clave (tipo contraseña, con mostrar/ocultar) y `Button` primario "Entrar". Cargando: el botón en `loading`. Error: "Esa clave no es correcta" bajo el campo |
| Primera apertura sin red | `EmptyState` "Necesitas conexión la primera vez" + "Reintentar" |
| Home provisional | `AppShell` "My Coach" + `SyncBadge`; saludo `display`; una card resumen: "29 ejercicios · 7 rutinas activas", "1 pausada", aviso de ficheros no leídos (si hay) en `caption` `text.muted` con icono `Info`; tirar para refrescar |
| Rutinas / Ejercicios | `EmptyState` "Próximamente" con el icono del destino (`ListChecks`, `Dumbbell`) |
| `SyncBadge` | `synced`: "Sincronizado · hace 5 min" (`success`, `Check`); `offline`: "Sin conexión · datos de hace 2 h" (`CloudOff`); `syncing`: "Sincronizando…"; `error`: "No se pudo actualizar · datos de hace 2 h"; `invalid_key`: "Clave no válida" (toca para introducirla). Textos de aviso según ui_standards §2 (contraste en claro) |
| Clave no válida con datos | `Sheet` con el campo de clave y "Guardar"; cerrar el sheet deja la app en `invalid_key` con los datos visibles |

- Tiempos relativos: "hace un momento" (< 1 min), "hace N min", "hace N h", "ayer", y fecha corta a partir de 2 días (con `Intl`, sin librerías de fechas: tech_standards §1).
- Voz según ui_standards §1. Ningún texto muestra contenido de rutinas, notas o programa en errores.

## 10. Edge Cases & Error Handling

| Caso | Comportamiento |
|---|---|
| Primera apertura sin red | FR-11 |
| Clave incorrecta en la primera apertura | FR-10, nada guardado |
| Clave cambiada en el servidor | FR-12 |
| Drive caído, cuota agotada o > 15 s | FR-13 |
| Respuesta del servidor con forma inesperada o JSON roto | Se trata como `error`; la copia no se toca |
| Fichero con YAML roto o fuera de esquema | FR-4 |
| Rutina que apunta a un ejercicio inexistente | Se conserva; item con `missing_exercise` (§7) |
| `variant` o `resistance` que no existen en su vocabulario | Se conserva el id tal cual; cada feature decide mostrarlo crudo |
| `sessions/al.yaml` vacío o solo con comentarios | `sessions: []`, sin error |
| `program/al.yaml` ausente | `program: null`, cuenta como fichero excluido |
| Carpeta sin rutinas activas | Resumen "0 rutinas activas", sin error |
| Disparadores simultáneos | FR-8 |
| Actualización iniciada y la app pasa a segundo plano | Si termina, se guarda; si se corta, la copia anterior sigue intacta (la copia se reemplaza de una vez, nunca a medias) |
| Versión nueva desplegada con otro formato de snapshot | `409 client_outdated` → el cliente se recarga y vuelve a pedir el snapshot |
| Almacenamiento del navegador no disponible (modo privado) o lleno | La app funciona solo con red, con un `Toast` "No se pueden guardar los datos en este dispositivo; sin conexión no funcionará" |
| Datos del navegador borrados | Vuelve a la primera apertura (pide la clave) |
| Reloj del móvil desajustado | Las edades relativas usan `last_synced_at` guardado con el reloj del propio móvil, así que siguen siendo coherentes |
| Varias pestañas abiertas | Cada una actualiza por su cuenta; la última que termina deja su copia (mismo contenido) |

## 11. Non-Functional Requirements

- **Rendimiento:** con una copia guardada, la Home provisional muestra los datos en < 1 s desde que se abre la app en un móvil de gama media (G1). Una actualización completa con los datos actuales (~30 ejercicios, ~10 rutinas) tarda < 5 s con 4G; si a menudo supera los 5 s en frío, se revisa el aplazamiento de un índice (hl_architecture §12).
- **Tamaño:** snapshot < 300 KB sin comprimir con los datos actuales.
- **Privacidad y seguridad:** la clave solo viaja en `x-app-key`, nunca en URLs; ninguna respuesta de `/api/**` se cachea en la CDN ni en la caché del service worker (solo en IndexedDB); los logs no contienen datos del programa, notas ni rutinas (tech_standards §5, §10).
- **Accesibilidad:** zonas táctiles ≥ 44 px; `SyncBadge` con texto, no solo color; el campo de clave tiene etiqueta visible.
- **Sin conexión:** toda la feature funciona sin red una vez hecha la primera sincronización (FR-1, FR-15).

## 12. Dependencies & Existing System Touchpoints

- **Datos:** carpeta `fitness` del Drive, contrato `fitness/_system/schema.md`; propiedad de `fitness-manager`.
- **Arquitectura:** ADR 001 (snapshot + service worker; la outbox no entra aquí), ADR 002 (service account), ADR 003 (clave de acceso).
- **Shared dependencies:** ninguna.
- **Platform needs:** proyecto de Vercel con raíz `apps/fitness-coach`; service account de Google con la carpeta `fitness` compartida en solo lectura (esta feature no escribe; el permiso de escritura se añade con la #5); variables `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_DRIVE_FOLDER_ID`, `APP_ACCESS_KEY` en Vercel y `.env.local`. Lo puede montar `platform-engineer` (Mode B) o Al a mano.
- **Release needs:** ninguna (un usuario, despliegue directo).
- **Bloquea a:** #2, #3, #4 y #5. Este PR también trae el scaffold del proyecto y los scripts de `npm run check` (tech_standards §17).

## 13. Assumptions & Open Questions

- Rutinas y Ejercicios muestran "Próximamente" hasta la #3 y la #4 (confirmado en la definición).
- Las rutinas `paused` se descargan; cómo se muestran se decide en la #2 y la #3.
- "Sesiones recientes" = últimos 14 días (tech_standards §3); basta para el estado del día de la #2.
- ¿Service account nueva o la que ya usa Al? Lo decide Al al montar la plataforma (hl_architecture §13).

## 14. Rollout & Testing Considerations

- **Rollout:** despliegue directo a producción en Vercel tras el merge; sin flags.
- **Pruebas:** según el plan de la feature (no requerido con `rigor: personal`) y tech_standards §14. Riesgos que merecen atención especial:
  - Arranque en frío sin red con la PWA instalada (AC-2), sobre todo en iOS.
  - Que una actualización cortada nunca deje la copia a medias.
  - Que ningún log, error ni URL contenga datos del programa o de las rutinas.
  - Ficheros reales del knowledge-base, incluidos los comentarios de `sessions/al.yaml` y los ejercicios sin `figure`.
  - Prueba manual contra una copia de la carpeta de Drive antes del primer despliegue (tech_standards §14).

## 15. Appendix

- **Snapshot:** la copia normalizada de los datos del knowledge-base que la app guarda en el dispositivo.
- **Sincronizar / actualizar:** pedir al servidor el snapshot más reciente y reemplazar la copia.
- Referencias: `product_vision.md` §5, §10; `hl_architecture.md` §5–§7, §9, §12; `tech_standards.md` §3–§5, §9–§11, §14, §17; `ui_standards.md` §1, §2, §9; `ui_kit_registry.md` (AppFrame, AppShell, BottomNav/SideNav, SyncBadge, EmptyState, Sheet, Button, Toast); `fitness/_system/schema.md`.
