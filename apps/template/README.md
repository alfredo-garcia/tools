# Micro App Template

Plantilla base profesional y reutilizable para micro-apps personales privadas: React + Vite + Tailwind, API serverless (Vercel), Airtable y PWA.

## Stack

- **Frontend:** React 19, Vite 7, Tailwind CSS v4 (mobile-first, 16px base)
- **Backend:** Node.js serverless en `/api` (estándar Vercel)
- **Base de datos:** Airtable (API oficial, paquete `airtable`)
- **PWA:** vite-plugin-pwa (instalable, manifest, offline básico)
- **Seguridad:** Código de acceso en variable de entorno, validación en cada request API

## Estructura

```
apps/template/
├── api/                 # Serverless (Vercel)
│   ├── _lib/auth.js     # Validación APP_ACCESS_CODE
│   ├── validate.js      # POST /api/validate (login)
│   └── data.js         # GET /api/data (ejemplo Airtable)
├── public/              # Estáticos + iconos PWA
├── src/
│   ├── components/      # Layout, LoginScreen, Spinner, ThemeToggle
│   ├── contexts/        # AuthContext
│   ├── hooks/           # useTheme
│   ├── lib/             # useApi (cliente con Authorization)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── server.js            # Servidor local (estáticos + /api) para Docker y dev
├── vercel.json          # SPA + rutas API
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Configuración

1. Copia `.env.example` a `.env` y rellena:

   - `APP_ACCESS_CODE`: código para la pantalla de login (obligatorio).
   - `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME`: para `/api/data` y cualquier otra función que use Airtable.

2. (Opcional) Añade en `public/` iconos PWA: `pwa-192x192.png`, `pwa-512x512.png`. Si no existen, la PWA sigue funcionando con los valores por defecto.

## Desarrollo local

1. Crea `.env` desde `.env.example` y rellena al menos `APP_ACCESS_CODE`. El servidor API carga `.env` al arrancar (`node --env-file=.env server.js`).
2. **Terminal 1 (API):** `npm run dev:api` (puerto 3000). Si el puerto está ocupado: `PORT=3009 npm run dev:api`.
3. **Terminal 2 (front):** `npm run dev`. Si la API está en otro puerto: `API_PORT=3009 npm run dev` para que el proxy apunte a la API correcta.

Abre http://localhost:5173. Si el login muestra "API no encontrada", asegúrate de que la API está en marcha y de que el puerto del proxy coincide (ej. `API_PORT=3009 npm run dev` si la API va en 3009).

- **Con Docker (producción):**  
  `docker compose up --build` → http://localhost:3000 (sirve SPA + API).

- **Con Docker (desarrollo):**  
  `docker compose --profile dev up` → Vite en 5173, API en 3000.

## Despliegue en Vercel

- Conectar el repo y desplegar. Las variables de entorno se configuran en el dashboard (incluir `APP_ACCESS_CODE` y las de Airtable).
- El build es `npm run build`; las funciones en `/api` se publican como serverless.
- `vercel.json` deja las rutas `/api/*` para las funciones y el resto para el SPA.

## Uso como plantilla

1. Clona o copia esta carpeta como base de una nueva app.
2. Cambia solo la lógica de negocio (páginas, hooks, nuevas rutas en `/api`).
3. Ajusta `AIRTABLE_BASE_ID` y `AIRTABLE_TABLE_NAME` (y tablas/campos) para tu base.
4. Mantén `AuthContext`, `Layout`, `api/_lib/auth.js` y la validación por header en todas las rutas `/api/*`.

## Seguridad

- Todas las funciones en `/api/*` deben validar el código con `validateAccess(req)` (ver `api/_lib/auth.js`).
- El frontend envía el código en el header `Authorization` en cada petición (ver `src/lib/api.js`).
- El código se persiste en `localStorage` tras un login correcto y se comprueba al cargar la app.
