# Implementation Plan: Datos del knowledge-base sin conexión

> Project: `fitness-coach`
> Feature: `fitness-coach/001`
> Sources: `001_offline-kb-data_prd.md` · `001_offline-kb-data_ux_flow.md` · test plan: n/a (rigor personal; trazabilidad en `tests/README.md`)
> Status: Approved (2026-11-12) · forma de trabajo: una rama, revisión por tarea con `fitness-coach-pr-reviewer`, un PR a `main` al final

## 1. Approach

Es el primer código de la app: un único Next.js (App Router) en `apps/fitness-coach`, con la ruta `GET /api/snapshot` como pasarela de solo lectura a Drive y un cliente que pinta desde IndexedDB y se actualiza en segundo plano. Se construye de dentro hacia fuera: andamiaje y checks, servidor (esquemas y snapshot), núcleo de sincronización en el cliente, kit de UI, pantallas y, al final, PWA y service worker. El riesgo técnico principal es el service worker: tiene que servir el shell sin red sin cachear nunca `/api/**` (datos de salud).

## 2. Slices

| Slice | User-visible outcome | ACs delivered | Flag | Surfaces |
|---|---|---|---|---|
| S0 Andamiaje | Ninguno: la app arranca vacía, `npm run check` y los runners de test funcionan | — | no | web |
| S1 Snapshot en el servidor | `GET /api/snapshot` devuelve el snapshot del Drive con la clave | AC-8, AC-10, AC-11 (servidor), AC-14 (502), AC-15, AC-16 (servidor) | no | web (route handlers) |
| S2 App sincronizada | Bienvenida con la clave, Home provisional con resumen y `SyncBadge`, navegación, sheet de clave, toast; todo desde la copia guardada | AC-1, AC-3–AC-16, AC-18–AC-20 | no | web |
| S3 Instalable y sin red en frío | "My Coach" en la pantalla de inicio y arranque en frío sin red | AC-2, AC-17 | no | web |

Sin flags: la app no está desplegada todavía y no hay usuarios que proteger.

## 3. Tasks

| Task | Slice / Story | Surface | What changes (modules/files) | FR / AC | Tests that prove it | Risk (normal/high: why) | Depends on | Assignee (agent) | Status | PR |
|---|---|---|---|---|---|---|---|---|---|---|
| T0 | S0 | web | `package.json` (deps aprobadas, scripts `check`, `format:check`, `lint`, `typecheck`, `check:standards`, `test`, `test:unit`, `test:e2e`), `tsconfig.json` (strict, alias `@/`), `next.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx` + `page.tsx` mínimos, Tailwind con los tokens de ui_standards como variables CSS | — (habilita E1–E7) | `npm run check` verde salvo el typecheck de los imports de los tests de aceptación (§8); los tests se ejecutan y fallan porque falta la funcionalidad | high: introduce las dependencias y conecta los checks del Enforcement Map | — | sesión principal | done | d7ad5827 + correcciones de revisión |
| T1 | S1 / US-5 | web | `src/lib/schema/*` (zod de exercises 1, routines 3, program 1, sessions 1, vocabularios), `src/lib/drive/snapshot.ts` (`buildSnapshot`, parseo de frontmatter y secciones con `yaml`) | FR-1–FR-4, PRD §7 | unit `snapshot-build.test.ts` | normal (lógica pura, sin red ni secretos) | T0 | sesión principal | done | ver §7 |
| T2 | S1 / US-2, US-3 | web | `src/lib/drive/client.ts` + `files.ts` (`readKbFiles` con `@googleapis/drive` y service account), `src/app/api/snapshot/route.ts` (clave, `x-client-format`, ETag por contenido, 304, errores, `no-store`, logs mínimos), `.env.example` | FR-7, FR-10, FR-12, FR-13, PRD §8 | unit `snapshot-route.test.ts`; integración con Drive a mano (§14) | high: secretos y datos de salud en el servidor y en los logs | T1 | sesión principal | done (pendiente de la revisión final de Al) | ver §7 |
| T3 | S2 / US-1, US-2, US-4 | web | `src/lib/offline/store.ts` (snapshot, etag, last_synced_at, access_key en `idb-keyval`; prueba de escritura), `src/lib/offline/merge.ts`, `src/lib/domain/age.ts`, `src/lib/sync/*` (estado `synced/offline/syncing/error/invalid_key`, disparadores FR-6, una en curso FR-8, timeout 15 s FR-13, 409 → recarga) | FR-1, FR-5–FR-9, FR-12, FR-13 | unit `merge-snapshot.test.ts`, `data-age.test.ts` (+ unit propios de la máquina de estados) | high: guarda en el dispositivo la clave y datos de salud | T0 | sesión principal | todo | — |
| T4 | S2 / US-7 | web | Resto de tokens de ui_standards en `globals.css` (tipografía, `space`, `size`, `duration`, `cat`, `region`, `figure`); kit en `src/components`: `AppFrame`, `AppShell` (gesto y botón "Actualizar" ≥ 640 px), `BottomNav`/`SideNav`, `Button`, `SyncBadge` (cinco estados), `EmptyState`, `Sheet`, `Toast`, y los `Tmp` del UX Flow: `TmpKeyField`, `TmpSummaryCard` | FR-9, FR-16 (piezas) | se prueban a través de los e2e de T5 | normal | T0 | sesión principal | todo | — |
| T5 | S2 / US-1–US-5, US-7 | web | Pantallas y cableado: `Welcome`, `FirstOpenOffline`, `Home` (`/`), `Routines` (`/routines`), `Exercises` (`/exercises`), `KeySheet`, `StorageToast`, con los `data-testid` del UX Flow | AC-1, AC-3–AC-16, AC-18–AC-20, FR-17 | e2e `001-offline-kb-data.spec.ts` (todo salvo AC-2 y AC-17) | normal | T3, T4 | sesión principal | todo | — |
| T6 | S3 / US-6 | web | `src/app/manifest.ts`, iconos "MC" en `public/` (192, 512, maskable, `apple-touch-icon`), `src/sw.ts` con `serwist` (precache del shell; `/api/**` nunca en caché) | FR-14, FR-15, AC-2, AC-17 | e2e AC-2 y AC-17; AC-17 en el móvil a mano | high: un error de caché guardaría datos de salud en el service worker | T5 | sesión principal | todo | — |

Tamaño: T4 y T5 pueden pasar de ~400 líneas (son las primeras pantallas y el kit entero); con rigor personal se acepta, y se parten si el revisor lo pide.

## 4. Order & Compatibility

- Orden: T0 → T1 → T2 → T3 → T4 → T5 → T6 (T3 y T4 son independientes entre sí y pueden ir en cualquier orden tras T0).
- Todo en la rama `fitness-coach/001-offline-kb-data`, un commit (o grupo de commits) por tarea con `[fitness-coach/001]`; sin PRs de GitHub separados mientras no haya CI: cada tarea se revisa con `fitness-coach-pr-reviewer` sobre su rango de commits antes de pasar a la siguiente. El merge a `main` es uno, al final de la feature, con `npm run check` y `npm test` en verde.
- Compatibilidad: no hay clientes desplegados. `x-client-format: 1` y `409 client_outdated` quedan listos para el futuro.

## 5. Needs from Other Roles

| Need | Role | Status |
|---|---|---|
| Proyecto de Vercel para `apps/fitness-coach`, service account de solo lectura sobre `fitness`, variables `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_DRIVE_FOLDER_ID`, `APP_ACCESS_KEY` (PRD §12) | platform-engineer (o Al) | pendiente; necesario para la prueba manual con Drive (T2) y para desplegar, no para los tests |
| Prueba manual de integración con Drive contra una copia de la carpeta | Al + sesión principal | pendiente: T2 hecho, falta la plataforma (service account y variables) |
| Ninguna librería fuera de tech_standards §1 | tech-lead | no hace falta ADR |

## 6. Risks & Mitigations

- **El service worker cachea `/api/**`:** la ruta responde `no-store` y `src/sw.ts` excluye `/api/**` explícitamente; el revisor lo comprueba (§5/§10, alto riesgo).
- **Datos de salud en logs:** test unitario de logs en T2; el revisor lo marca como alto riesgo.
- **Tests e2e lentos (build de producción):** se aceptan; `npm run test:e2e` solo antes de cada revisión de tarea con UI y antes del merge.
- **Interfaces fijadas por los tests (tests/README.md):** si alguna resulta mala al implementar, se cambia con qa-engineer y el motivo, nunca rebajando el test.

## 7. Review Record

| PR | Task | Reviewers (pr-reviewer / CI review / others) | Result (approved / changes requested) | Blockers found | Risk | User approval (high-risk only: date) | Date |
|---|---|---|---|---|---|---|---|
| e370ad7d..d7ad5827 | T0 | `sdlc-suite:pr-reviewer` con la definición de `fitness-coach-pr-reviewer` (el agente del proyecto no se carga desde la raíz del monorepo) | changes requested → resuelto | `npm run check` en rojo por el typecheck de los tests (resuelto como desviación aprobada, §8). Should-fix aplicados: tokens sin auto-referencia en `@theme`, resto de tokens movidos a T4, `web_app`/`web_components` en `SDLC.md` | high (dependencias, checks) | Al, 2026-11-12 (incluye sacar `*.md` y `.claude/` de Prettier) | 2026-11-12 |
| dc6a3d45..d028c44f | T1 | `sdlc-suite:pr-reviewer` con la definición de `fitness-coach-pr-reviewer` | approved con should-fix → aplicados | ninguno. Should-fix aplicados: campos opcionales aceptan `null` (claves vacías del YAML), listas internas del programa pueden estar vacías (schema.md no marca campos obligatorios en program 1; se exigen solo los bloques `phase`, `constraints`, `schedule` como objetos), rutinas `draft`/`archived` no cuentan como excluidas, 4 tests unitarios nuevos en `src/lib/drive/snapshot.test.ts`. Comprobado contra el espejo local del KB imprimiendo solo recuentos: 29 ejercicios, 7 rutinas activas, programa, 11 vocabularios, 0 excluidos, 52 KB (< 300 KB), sin `## History` ni `journal` | normal | n/a | 2026-11-13 |
| 047c7677..fec0b321 | T2 | `sdlc-suite:pr-reviewer` con la definición de `fitness-coach-pr-reviewer` | changes requested → resuelto | `TS2533` en `snapshot-build.test.ts:84` introducido por la corrección de T1 (`week` nullish): resuelto en el código, no en el test, normalizando `schedule.week` a los siete días con lista (`[]` si vacío). Should-fix: test unitario del recorrido del Drive con un cliente falso (`src/lib/drive/files.test.ts`); un fallo de descarga de un fichero hace fallar toda la lectura (502, la copia no se toca); el PRD no lo fija, queda como **pregunta abierta para Al** en la revisión final. Nits aplicados: JSON de la service account mal formado → 500 `server_misconfigured`; `buildSnapshot` dentro de un try. Cambio en E3 (regex de `APP_ACCESS_KEY`) revisado: sigue detectando valores reales | high (secretos, datos de salud, cambio de un check) | pendiente: revisión final de Al (§8) | 2026-11-13 |

## 8. Deviations

| Qué | Aprobado por | Hasta cuándo |
|---|---|---|
| `npm run typecheck` (y por tanto `npm run check`) puede estar en rojo en las revisiones de T0–T2, **solo** por los `TS2307` de los imports de los tests de aceptación (`@/lib/domain/age`, `@/lib/offline/merge`, `@/lib/drive/snapshot`, `@/app/api/snapshot/route`). No se excluyen tests ni se crean stubs. Cualquier otro error de tipos es blocker | Al, 2026-11-12 | Desde la revisión de T3, y siempre en el merge a `main`, `npm run check` en verde |
| Aprobación de alto riesgo por tarea (T2, T3, T6) y la pausa entre tareas: Al pide hacer T1–T6 seguidas sin su aprobación intermedia y revisarlo todo al final. Cada tarea sigue teniendo su revisión independiente con `fitness-coach-pr-reviewer` y su fila en §7; nada se mergea a `main` sin la aprobación explícita de Al sobre el conjunto | Al, 2026-11-13 | Hasta la revisión final de la feature, antes del merge a `main` |
