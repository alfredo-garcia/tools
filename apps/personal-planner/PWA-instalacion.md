# Instalar la PWA en móvil

## Por qué no me sale "Instalar"

### 1. Tienes que usar **HTTPS** (o localhost)

En **móvil**, si abres la app por la IP de tu red (por ejemplo `http://192.168.1.x:4173`), el navegador **no** permite instalar la PWA: hace falta un “contexto seguro” (HTTPS).

- **Solución:** Despliega la app en un hosting con HTTPS (Vercel, Netlify, etc.) o usa un túnel con HTTPS (p. ej. ngrok) y abre esa URL en el móvil.
- En **escritorio**, `http://localhost` sí cuenta como seguro para desarrollo.

### 2. En **iPhone/iOS** no hay botón "Instalar"

Safari **no** muestra un aviso de “Instalar aplicación”. Hay que hacerlo a mano:

1. Abre la web en **Safari** (no en Chrome u otro).
2. Toca el botón **Compartir** (cuadrado con flecha hacia arriba).
3. Elige **“Añadir a la pantalla de inicio”**.
4. Pon el nombre y toca **Añadir**.

Después verás el icono en la pantalla de inicio y se abrirá como app (con tu splash e icono).

### 3. En **Android (Chrome)**

Con HTTPS, manifest y service worker correctos, Chrome puede:

- Mostrar un banner de instalación, o
- En el menú (⋮) → **“Instalar aplicación”** o **“Añadir a la pantalla de inicio”**.

A veces el banner tarda unos segundos o no aparece hasta que se ha usado un poco la web; en ese caso usa siempre el menú (⋮).

## Comprobar que todo está bien

1. **Build de producción:** `npm run build` y sirve la carpeta `dist` con HTTPS.
2. En Chrome (escritorio): F12 → pestaña **Application** → **Manifest** (debe verse sin errores) y **Service Workers** (debe haber uno registrado).
3. En el móvil, abre la **misma URL HTTPS** (no la IP en HTTP) y sigue los pasos de iOS o Android de arriba.
