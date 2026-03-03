# Despliegue en Vercel

Esta app depende del paquete `@tools/shared` (`file:../shared`). Para que el build en Vercel resuelva esa dependencia, el repositorio debe clonar **todo el monorepo** y permitir acceso a la carpeta hermana `apps/shared`.

## Configuración del proyecto en Vercel

1. **Root Directory**: deja o establece `apps/personal-planner`.

2. **Incluir archivos fuera del Root Directory** (imprescindible):
   - En el proyecto de Vercel: **Settings** → **General** → **Root Directory**.
   - Pulsa **Edit** junto a Root Directory.
   - Activa la opción **"Include source files outside of the Root Directory in the Build Step"** (o similar).
   - Así el paso de build puede ver `../shared` y `npm install` resuelve `@tools/shared` correctamente.

3. **Build**: no hace falta cambiar el comando; usa `npm run build` (Vite).

4. **Output Directory**: `dist` (por defecto para Vercel con Vite).

5. **API (una sola Serverless Function)**: Todas las rutas `/api/*` se reescriben a la función única `api/index.js` para no superar el límite de 12 funciones del plan Hobby. El router en `api/index.js` despacha por path a los handlers en `server/handlers/`. La reescritura en `vercel.json` es: `"/api/:path*" → "/api?path=:path"`.

## Si el build sigue fallando

- Comprueba que la rama que despliegas (p. ej. `planner`) incluye la carpeta `apps/shared` en el repositorio.
- Asegúrate de que "Include source files outside of the Root Directory in the Build Step" está activada.
