# Tech Standards: Fitness Coach

> Project: `fitness-coach`
> Status: Approved (2026-11-12)
> Derived from: `product/product_vision.md` (approved 2026-11-12)
> Change process: ADR via tech-lead (§16)

## 1. Stack Overview

| Capa | Elección | Política de versiones | Por qué (driver de la visión) |
|---|---|---|---|
| Lenguaje | TypeScript, `strict: true` | Node 22 LTS (ADR 005) | Un solo lenguaje de punta a punta; conocido por el autor |
| Web | Next.js (App Router) + React | Major actual al empezar; subir majors a propósito | PWA y rutas de servidor en un solo deployable (hl_architecture §3) |
| Backend / API | Route Handlers de Next.js (runtime Node) como pasarela fina a Drive | igual | Credencial solo en el servidor; sin backend aparte |
| Base de datos | Ninguna. La carpeta `fitness` de Drive es la fuente de verdad; IndexedDB es la caché sin conexión | | Visión §8.1, §10 |
| Auth | Ninguna; una clave de acceso compartida para leer y escribir (§10) | | Visión §9: sin logins, datos de salud |
| Hosting | Vercel Hobby (gratis) | | Visión §9: coste ~0 |
| Servicios | Google Drive API v3 con una service account (la carpeta `fitness` compartida con su email) | | Visión §9 |

### Librerías aprobadas

| Propósito | Librería |
|---|---|
| Estilos | Tailwind CSS (con `@tailwindcss/postcss` y `postcss`, que necesita para Next) |
| Iconos | lucide-react |
| Drive API | `@googleapis/drive` (no el paquete completo `googleapis`) |
| YAML | `yaml` (API de documento para conservar comentarios) |
| Validación | `zod` |
| Almacenamiento sin conexión | `idb-keyval` (IndexedDB) |
| Service worker / PWA | `serwist` con `@serwist/next` en modo configurator y su CLI `@serwist/cli`, que empaqueta el worker con `esbuild` (solo en build) (`next build && serwist build`, compatible con Turbopack; ADR 004) |
| Tests unitarios | `vitest` |
| Tests end-to-end | `@playwright/test` |
| Lint / formato | ESLint (`eslint-config-next`) y Prettier, con `eslint-config-prettier` para que no se pisen |

**No permitido:**
- Bases de datos u ORMs (Postgres, Supabase, Firebase, Prisma): el Drive es la fuente de verdad.
- NextAuth u otros proveedores de auth: sin logins.
- Kits de componentes pesados (MUI, Chakra, Ant): el kit de UI se construye sobre Tailwind (ux-designer).
- `next-pwa` y Workbox directamente: se usa `serwist`.
- Gestores de estado (Redux, Zustand) y librerías de fetching: React state + `useReducer` para el modo guiado y una capa propia mínima sobre la caché, hasta que un ADR demuestre que no basta.
- Librerías de temporizadores o de fechas (moment, dayjs, date-fns): `Date` e `Intl` bastan para un día de la semana y un cronómetro.

## 2. Repository Structure

La app vive en `apps/fitness-coach/` dentro del monorepo `tools` (un deployable):

```
SDLC.md   package.json   next.config.ts
docs/                    # product, context, architecture, features, changelog
src/
  app/                   # rutas y páginas; app/api/** = pasarela a Drive
  components/            # componentes de UI (el kit vive aquí)
  lib/
    drive/               # cliente de Drive, listado, lectura, escritura con modifiedTime
    schema/              # esquemas zod que reflejan fitness/_system/schema.md
    domain/              # lógica pura: hoy, filtros, modo guiado, temporizador, entrada de sesión
    offline/             # IndexedDB: snapshot, outbox, sesión parcial
  sw.ts                  # service worker
public/                  # iconos, manifest ("My Coach")
tests/e2e/               # Playwright
prototypes/              # borradores (en gitignore)
```

## 3. Cross-Surface Contracts

Una sola superficie; contrato interno entre el cliente y las rutas:
- `GET /api/snapshot`: todo lo que necesita la UI en un documento (ejercicios, rutinas `active` y `paused`, programa, sesiones de los últimos 14 días, vocabularios), con ETag. Sin paginación.
- `POST /api/ops`: lote de operaciones `{ op_id, type, payload }`. En el MVP solo `type: "session.complete"`.
- Entradas validadas con zod; errores con `{ "error": { "code": string, "message": string } }` y el status HTTP adecuado.
- Sin versionado de API: el cliente y el servidor se despliegan juntos. Si el service worker sirve un cliente viejo, el servidor rechaza con `409 client_outdated` y el cliente se recarga.

## 4. Identity, Authentication & Authorization

Sin usuarios. Una clave compartida (`APP_ACCESS_KEY`) en la cabecera `x-app-key` para **todas** las rutas `/api/**`. Se pide una vez en el dispositivo, en el primer arranque, y se guarda en IndexedDB. Si el servidor la rechaza, se vuelve a pedir; los datos en caché siguen visibles y las operaciones siguen en la outbox.

## 5. Logging

`console` en las rutas, una línea por petición con ruta, status, duración y ids. **Nunca** se registran contenidos de rutinas, notas, restricciones ni el programa.

## 6. Observability

Solo los logs de las funciones de Vercel.

## 7. Events & Asynchronous Processing

n/a. La outbox del cliente es el único mecanismo diferido.

## 8. Notifications

n/a.

## 9. Data & Persistence

- **Contrato:** `fitness/_system/schema.md` manda (exercises 1, routines 3, program 1, sessions 1). `src/lib/schema` lo refleja con zod; los campos desconocidos se conservan y nunca se eliminan al escribir.
- Los ids son los slugs de los ficheros; la app nunca crea ids del knowledge-base.
- Marcas de tiempo ISO 8601 con el offset local del dispositivo; `date` en `YYYY-MM-DD` y `start` en `HH:MM` local.
- **La app solo escribe** `sessions/al.yaml`, y solo **añadiendo** entradas `status: completed` con el formato del esquema; actualiza `updated` del fichero. Nunca edita ejercicios, rutinas, programa ni vocabularios (son de `fitness-manager`). Nunca crea ni borra ficheros del Drive.
- Las escrituras son read-modify-write en el servidor sobre la versión más reciente, con comprobación de `modifiedTime` y un reintento. Se conservan los comentarios del YAML.
- **Idempotencia:** cada `session.complete` lleva un `op_id` (UUID del cliente). El servidor no duplica una sesión con la misma `date`, `start` y `routine`.
- **Caché sin conexión** (IndexedDB): el snapshot, la outbox ordenada, la sesión en curso o parcial (una por rutina y día; se descarta al cambiar de día local) y la clave de acceso.
- La valoración por ejercicio de la interfaz **no** se persiste fuera de la sesión local ni se envía.

## 10. Security & Privacy

- Secretos solo en variables de entorno de Vercel (`GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_DRIVE_FOLDER_ID`, `APP_ACCESS_KEY`) y en `.env.local` (en gitignore); nunca en el repo ni en el cliente.
- La service account solo tiene acceso a la carpeta `fitness`.
- Datos de salud personales: lectura y escritura protegidas por la clave (§4); nada de datos del programa en logs, URLs ni parámetros de consulta.
- Dependencias al día (`npm audit` revisado antes de desplegar).

## 11. Resilience & Performance

- Primer pintado desde IndexedDB; el refresco de red nunca bloquea la UI.
- La lectura del snapshot salta los ficheros cuyo `modifiedTime` no cambió (caché en memoria por instancia, opcional para la corrección).
- **Temporizador:** se calcula con marcas de tiempo (`Date.now()` al pulsar play y acumulado), nunca sumando ticks; el intervalo de refresco solo repinta. Así es correcto tras suspender la pantalla o la pestaña.
- **Wake Lock:** se pide `navigator.wakeLock` al entrar en el modo guiado y se libera al salir; si no existe o falla, se ignora sin error visible.
- Drive caído o sin red: snapshot en caché + outbox, con indicador de "pendiente de sincronizar".

## 12. Configuration & Feature Flags

Solo variables de entorno (§10). Sin feature flags.

## 13. Internationalization, Accessibility & Analytics

- Textos de la UI en español; código, identificadores y documentación técnica en inglés.
- Zonas táctiles ≥ 44 px; controles principales del modo guiado al alcance del pulgar.
- Sin analítica.

## 14. Test Platform

| Nivel | Herramienta | Qué cubre |
|---|---|---|
| Unitario | `vitest` | Todo `src/lib/domain` (hoy, estados del día, filtros, máquina de estados del modo guiado, temporizador con reloj simulado, entrada de sesión), esquemas zod contra los ficheros reales de ejemplo, merge e idempotencia de `session.complete`, reenvío de la outbox |
| End-to-end | `@playwright/test` | Flujos principales en viewport de móvil con las rutas `/api/**` simuladas (`page.route`): Home y "Hoy te toca", rutina guiada completa, rutina parcial y reanudación, uso sin conexión |
| Integración con Drive | Ninguna automática | Se prueba a mano contra una copia de la carpeta antes del primer despliegue |

**Formato de aceptación:** tests etiquetados. Cada test de aceptación lleva en el título `[fitness-coach/<id>] AC-n`.

## 15. Definition of Done (technical)

- [ ] Lint, type-check, tests unitarios y e2e de la feature pasan.
- [ ] La lógica nueva de dominio tiene tests unitarios; los cambios de esquema se comprueban contra ficheros reales.
- [ ] La feature funciona sin conexión; las escrituras pasan por la outbox.
- [ ] Ningún secreto ni dato de salud en el repo o en los logs; ninguna librería fuera de §1.
- [ ] Criterios de aceptación del PRD comprobados en viewport de móvil.
- [ ] Antes del merge: `document-manager` actualiza el functional spec y el changelog en la rama de la feature.

## 16. Changing These Standards

Cualquier tecnología nueva, librería fuera de §1 o cambio de regla requiere un ADR (`architecture/adr/`) aprobado por Al. Hasta entonces, no está permitido.

## 17. Enforcement Map

> Aprobado (2026-11-12). Rigor personal: formato, lint y dependencias aprobadas, más tres checks baratos de alto riesgo (strict, secretos, `.only`).

**Cómo bloquea:** no hay CI (hl_architecture §12, aplazado). `npm run check` (= `format:check` + `lint` + `typecheck` + `check:standards`) tiene que pasar en verde antes de abrir y antes de mergear cada PR; el subagente `fitness-coach-pr-reviewer` lo ejecuta y una ejecución en rojo es un blocker. Los scripts de `package.json` y las dependencias de lint/formato entran en el **primer PR de código** (el scaffold de `fitness-coach/001`), así que no hay deuda previa ni baseline: los checks bloquean desde el primer PR. Cuando se monte CI (`platform-engineer`), `npm run check` es el job del PR.

### Checks automáticos (bloqueantes)

| Id | Regla | Check | Config |
|---|---|---|---|
| E1 | §1 Solo librerías aprobadas; nada de la lista "No permitido" | Allowlist sobre `package.json` (incluye `@types/*` y los complementos `@tailwindcss/postcss`, `postcss`, `eslint-config-prettier`) | `scripts/check-standards.mjs` |
| E2 | §1 TypeScript `strict: true` | `check:standards` comprueba `tsconfig.json`; `tsc --noEmit` en `typecheck` | `scripts/check-standards.mjs`, `tsconfig.json` |
| E3 | §10 Ningún secreto en el repo | Busca claves privadas, credenciales de service account, valores de `APP_ACCESS_KEY` y ficheros `.env*` versionados | `scripts/check-standards.mjs` |
| E4 | Formato uniforme | `prettier --check .` | `.prettierrc.json`, `.prettierignore` |
| E5 | Lint del stack (Next, React, TypeScript) | `eslint .` con `eslint-config-next` (core-web-vitals + typescript) y `eslint-config-prettier` | `eslint.config.mjs` |
| E6 | §14-§15 Ningún test enfocado (`.only`) | Regla `no-restricted-properties` de ESLint; además `forbidOnly: true` en la config de Playwright | `eslint.config.mjs`, `playwright.config.ts` |
| E7 | §15 Tests unitarios y e2e de la feature en verde | `vitest run` y `playwright test` (fuera de `check`, en `npm test`; ambos obligatorios antes del merge) | `vitest.config.ts`, `playwright.config.ts` |

### Reglas de revisión (las comprueba `fitness-coach-pr-reviewer` en cada PR)

| Regla | Qué mira el revisor |
|---|---|
| §2 Estructura | Código en su carpeta (`lib/domain` puro, sin imports de `lib/drive` ni de React; `lib/drive` solo desde `app/api/**`) |
| §3 Contrato interno | Entradas validadas con zod, forma de error común, `409 client_outdated` |
| §4 Clave de acceso | Toda ruta nueva bajo `/api/**` comprueba `x-app-key` |
| §5 / §10 Logs y privacidad | **Alto riesgo.** Ningún log, URL ni query param con contenido de rutinas, notas, restricciones o programa; solo ids, rutas, status y duración |
| §9 Escrituras en Drive | **Alto riesgo.** Solo se añade a `sessions/al.yaml`, solo `status: completed`, se conservan comentarios y campos desconocidos, idempotencia por `op_id`, `modifiedTime` + un reintento |
| §9 Sesión parcial y valoración | Nunca salen del dispositivo |
| §11 Temporizador y Wake Lock | Tiempo por marcas de tiempo, nunca sumando ticks; Wake Lock sin errores visibles |
| §13 UI | Textos en español, zonas táctiles ≥ 44 px |
| §14 Etiquetas de aceptación | Cada AC del PRD tiene un test con `[fitness-coach/<id>] AC-n`; ningún test borrado, saltado o debilitado sin aprobación de Al |
| ui_standards / ui_kit_registry | Solo componentes del registro o `Tmp` anunciados en el UX Flow; ningún hex directo en componentes (solo tokens) |
| §15 DoD | Funciona sin conexión; escrituras por la outbox; docs según el proceso del proyecto |

### Manual

| Regla | Cuándo |
|---|---|
| §10 `npm audit` | Antes de cada despliegue a producción |
| §14 Integración con Drive | A mano contra una copia de la carpeta antes del primer despliegue y al cambiar `lib/drive` |

Cualquier ADR que añada o cambie una regla actualiza esta tabla y su check en el mismo cambio.
