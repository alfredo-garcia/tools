# @tools/shared

Paquete compartido de diseño y componentes para las apps del monorepo (template, personal-planner). Incluye **design tokens**, componentes de UI recurrentes y contexto de autenticación.

## Estructura

```
apps/shared/
  package.json
  src/
    index.js              # reexporta componentes, contextos, hooks e iconos
    tokens/
      tokens.css          # variables :root y .dark (única fuente de verdad)
      theme.js            # theme.extend para Tailwind (referencia)
    components/
      Layout.jsx
      LoginScreen.jsx
      ThemeToggle.jsx
      Spinner.jsx
      PageHeader.jsx
      AppShell.jsx
      SettingsPage.jsx
      Icons.jsx
    contexts/
      AuthContext.jsx
    hooks/
      useTheme.js
      useApi.js
```

## Design tokens

Los tokens definen colores, tipografía y espaciados de forma semántica. Las apps **no** usan clases “quemadas” (`neutral-950`, `orange-500`); usan clases generadas a partir de los tokens (`bg-background`, `text-primary`, `bg-surface`, `border-border`, `text-text-muted`, etc.).

### Uso en una app

1. **Importar el CSS de tokens** en el CSS global de la app (por ejemplo `index.css`):

   ```css
   @import "tailwindcss";
   @import "@tools/shared/tokens.css";
   ```

2. **Extender el tema de Tailwind** para que las utilidades (`bg-background`, `text-primary`, etc.) existan. Con Tailwind v4, en el mismo `index.css` añade un bloque `@theme` que mapee las variables de tokens:

   ```css
   @theme {
     --color-background: var(--token-background);
     --color-surface: var(--token-surface);
     --color-border: var(--token-border);
     --color-text: var(--token-text);
     --color-text-muted: var(--token-text-muted);
     --color-primary: var(--token-primary);
     --color-primary-hover: var(--token-primary-hover);
     --color-primary-muted: var(--token-primary-muted);
     --color-nav-bg: var(--token-nav-bg);
     --color-nav-border: var(--token-nav-border);
     --color-nav-text: var(--token-nav-text);
     --color-nav-text-active: var(--token-nav-text-active);
     --color-spinner: var(--token-spinner);
     --font-sans: var(--font-sans);
   }
   ```

3. En componentes y páginas, usar solo clases tokenizadas: `bg-background`, `bg-surface`, `text-text`, `text-text-muted`, `text-primary`, `border-border`, `bg-primary`, etc.

### Cómo extender o cambiar tokens

- Editar `src/tokens/tokens.css`: en `:root` (tema claro) y `.dark` (tema oscuro) se definen las variables `--token-*` y `--font-sans`. Cambiar ahí los valores (por ejemplo otro color primario o otra fuente) y todas las apps que importan este CSS heredan el cambio.
- Si necesitas nuevos tokens (por ejemplo `--token-success`), añádelos en `tokens.css` y en el `@theme` de cada app que quiera usar la utilidad correspondiente.

## Exportaciones

- **Paquete principal**: `import { Layout, AppShell, ThemeToggle, Spinner, PageHeader, SettingsPage, AuthProvider, useAuth, useTheme, useApi, IconHome, ... } from '@tools/shared'`
- **Tokens CSS**: `import '@tools/shared/tokens.css'`
- **Theme (referencia)**: `import { themeExtend } from '@tools/shared/theme.js'` (opcional; las apps que usan Tailwind v4 suelen hacer el mapeo en CSS con `@theme`).

### Capas del design system

- **Átomos**: Spinner, Switch, Card, Fab, Icons, Tag/Badge (si se añaden).
- **Moléculas**: CardList, PageHeader, FilterBar, FilterDropdown, KpiCard, StatusProgressBar, InstallBanner.
- **Organismos**: Layout, AppShell, SettingsPage, LoginScreen, EntityListPage, EntityDetailPage, WeekView. Contenedores de gráficos: LineChart, AreaChart.

### Componentes (lista completa)

| Componente         | Capa       | Descripción |
|--------------------|------------|-------------|
| `Layout`           | Organismo  | Envuelve la app; muestra spinner mientras comprueba sesión y `LoginScreen` si no hay autenticación. |
| `LoginScreen`      | Organismo  | Formulario de código de acceso; llama a `POST /api/validate` y guarda en localStorage. |
| `AppShell`         | Organismo  | Navegación: sidebar (lg+) + bottom nav (< lg). Props: `navItems`, `title`, `storageKeyPrefix`. |
| `SettingsPage`     | Organismo  | Bloque de Ajustes: apariencia (ThemeToggle) + sesión (logout). Props opcionales: `backTo`, `backLabel`. |
| `EntityListPage`   | Organismo  | Layout genérico para listas: `header`, `filters`, `summary`, `children`, `emptyState`, `showEmptyState`. |
| `EntityDetailPage`| Organismo  | Layout genérico para detalle: `backLink`, `header`, `children`. |
| `WeekView`         | Organismo  | Vista semanal: `weekDays`, `onPrevWeek`, `onNextWeek`, `renderDayHeader`, `children`. |
| `ThemeToggle`      | Átomo      | Ciclo sistema / claro / oscuro; persiste en localStorage. |
| `Spinner`          | Átomo      | Indicador de carga (tamaños `sm`, `md`, `lg`). |
| `Card`             | Átomo      | Contenedor con título, icono, opcional expandible y botones. |
| `Switch`           | Átomo      | Toggle on/off con `checked`, `onChange`, `label`. |
| `Fab`              | Átomo      | Botón flotante; props `onClick`, `ariaLabel`, `variant`. |
| `PageHeader`       | Molécula   | Título/breadcrumbs + botón de refresh opcional. |
| `KpiCard`          | Molécula   | Tarjeta KPI: `title`, `value`, `subtitle`, `tone` (default/warning/danger), `as` (ej. Link). |
| `StatusProgressBar`| Molécula   | Barra segmentada: `segments` (objeto counts), `total?`, `ariaLabel`. |
| `FilterBar`        | Molécula   | Contenedor de filtros (icono + flex de controles). |
| `FilterDropdown`   | Molécula   | Desplegable de filtro: `label`, `summary`, `options`, `value`, `onChange`, `multi?`, `allOptionLabel?`. |
| `CardList`         | Molécula   | Lista agrupada: `items`, `renderItem`, `groupBy`, `groupOrder`, `groupLabels`, `initialCollapsed`. |
| `LineChart`        | Molécula   | Wrapper de gráfico de líneas (Recharts). |
| `AreaChart`        | Molécula   | Wrapper de gráfico de área (Recharts). |
| `InstallBanner`    | Molécula   | Banner PWA “instalar app”. |
| `Icons`            | Átomo      | Iconos Lucide + custom (IconPoop, IconHeartFire, etc.); API: `size`, `className`, `strokeWidth`. |

### Contextos y hooks

- `AuthProvider`, `useAuth`: clave `app_access_token` en localStorage; `login`, `logout`, `getAccessCode`, `isAuthenticated`, `isChecking`.
- `useTheme`: tema sistema/claro/oscuro; aplica clase en `<html>` y persiste en localStorage.
- `useApi`: devuelve `{ fetchApi }` que envía el código de acceso en header `Authorization` en cada petición.

## Añadir una nueva app que use shared

1. En la carpeta de la app (por ejemplo `apps/mi-app`), en `package.json`:

   ```json
   "dependencies": {
     "@tools/shared": "file:../shared",
     "react": "...",
     "react-dom": "...",
     "react-router-dom": "..."
   }
   ```

2. Instalar dependencias: `npm install` (desde la carpeta de la app).

3. En el CSS global de la app: `@import "@tools/shared/tokens.css"` y el bloque `@theme` que mapee los tokens (ver arriba).

4. En la app: envolver con `AuthProvider`, usar `Layout` y los componentes/hooks desde `import { ... } from '@tools/shared'`.

5. **Vite**: si el build falla al resolver `react` desde el código de shared, en `vite.config.js` de la app añade resolución desde la app para no duplicar React:

   ```js
   import path from 'path'
   const appRoot = path.resolve(process.cwd())
   const resolveFromApp = (pkg) => path.join(appRoot, 'node_modules', pkg)
   export default defineConfig({
     resolve: {
       dedupe: ['react', 'react-dom', 'react-router-dom'],
       alias: {
         react: resolveFromApp('react'),
         'react-dom': resolveFromApp('react-dom'),
         'react-router-dom': resolveFromApp('react-router-dom')
       }
     },
     // ...
   })
   ```

## Despliegue en Vercel

- Un proyecto Vercel por app (por ejemplo uno para personal-planner, otro para template).
- **Root Directory**: en cada proyecto, Root Directory = carpeta de la app (ej. `apps/personal-planner`).
- **Incluir carpeta hermana**: en la configuración del proyecto (Settings → General → Root Directory → Edit), activa **"Include source files outside of the Root Directory in the Build Step"**. Así el build puede acceder a `../shared` y `npm install` resuelve `"@tools/shared": "file:../shared"`.
- El repositorio debe contener tanto la app como `apps/shared`. Si el build falla con "failed to resolve @tools/shared", comprueba que esa opción está activada y que la rama incluye `apps/shared`.
