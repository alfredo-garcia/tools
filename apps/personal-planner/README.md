# Personal Planner

App de planificación personal: OKRs, Key Results, Tareas (TODOs) y seguimiento de hábitos. Los datos se leen desde Airtable.

## Tablas de Airtable

Configura una base con estas tablas (los nombres de campos pueden variar; la app usa variantes comunes):

- **Objectives**: Objective Name, Description, Category, Status, Target Date, Start Date, Priority
- **Key Results**: Key Result Name, Description, Metric, Target Value, Current Value, Unit, Status, Deadline, Progress (%), Objective Link (link a Objectives)
- **Key Result Tracking**: Key Result (link a Key Results), Date, Current Value, Progress (%) (opcionales). Se crea un registro al actualizar "Current value" o "Progress (%)" en un Key Result, con snapshot de valor y progreso.
- **Tasks**: Task Name, Description, Category, Priority, Status, Assignee, Due Date, Objectives, Key Result (links opcionales)
- **Habits**: Habit Name, Habit Description, Category, Frequency, Priority, Habit type (opcional: "Good" o "Bad" para separar en Planner en contadores y agrupar en la lista por categoría)
- **Habit Tracking**: Habit (link a Habits), Was Successful?, Execution Date-Time
- **Shopping List**: Name, Category, Description, Image (Web), Name ES, Notes, Priority, Quantity, Status (Need / Have), Store, Unit (puede estar en otra base; usa `AIRTABLE_BASE_ID_SHOPPING`)
- **Meals** (base principal): Meal Type (Breakfast, Lunch, Dinner), Date, Meal (ID de la receta de la base Recipes; la app muestra el nombre resolviendo contra Recipes)
- **Recipes** (base separada; usa `AIRTABLE_BASE_ID_RECIPES`): **Recipes**: Name, Name ES, Description, Meal Type (Breakfast, Lunch, Dinner, Snack, Tapa, Sauce, Dessert), Cooking Process, Complexity Rating, Nutrient Rating, Time to Cook (minutes), Servings, Cuisine Type, Source/URL, Tags. Crear/editar recetas desde la lista (FAB) y en la página de detalle (campos editables; ingredientes con FAB y modal para añadir/editar/eliminar). **Ingredients**: Name, Name ES, Description, Category, Unit, Notes. **Recipe Ingredients**: Recipe (link), Ingredient (link), Quantity, Unit, Optional Ingredient, Notes

## Variables de entorno

Copia `.env.example` a `.env` y rellena:

- `APP_ACCESS_CODE`: código de acceso a la app
- `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`: acceso a la base principal
- `AIRTABLE_BASE_ID_SHOPPING` (opcional): si la tabla Shopping List está en **otra base**, define aquí el Base ID de esa base; el mismo PAT debe tener acceso a ambas bases
- `AIRTABLE_BASE_ID_RECIPES` (opcional): base de Airtable para Recipes, Ingredients y Recipe Ingredients (tablas separadas); el mismo PAT debe tener acceso
- `AIRTABLE_TABLE_OBJECTIVES`, `AIRTABLE_TABLE_KEY_RESULTS`, `AIRTABLE_TABLE_TASKS`, `AIRTABLE_TABLE_HABITS`, `AIRTABLE_TABLE_HABIT_TRACKING`, `AIRTABLE_TABLE_KEY_RESULT_TRACKING`, `AIRTABLE_TABLE_SHOPPING`, `AIRTABLE_TABLE_MEALS`: nombres exactos de cada tabla en tu base
- `AIRTABLE_TABLE_RECIPES`, `AIRTABLE_TABLE_INGREDIENTS`, `AIRTABLE_TABLE_RECIPE_INGREDIENTS`: nombres exactos de las tablas en la base de Recipes
- `ENABLE_KEY_RESULT_TRACKING`: si no usas la tabla Key Result Tracking o el PAT no tiene permiso de escritura, pon `false` para desactivar el registro de tracking al actualizar "Current value".

## Desarrollo

1. Crea `.env` desde `.env.example` y rellena al menos `APP_ACCESS_CODE` (el servidor API carga `.env` al arrancar).
2. **Terminal 1** (API): `npm run dev:api` (por defecto puerto 3000). Si usas otro puerto: `PORT=3009 npm run dev:api`.
3. **Terminal 2** (front): `npm run dev`. Si la API está en otro puerto, usa el mismo: `API_PORT=3009 npm run dev` para que el proxy de Vite apunte a la API correcta.

Abre http://localhost:5173 e introduce el mismo valor que pusiste en `APP_ACCESS_CODE`.

**Si el login dice "Not found"**: la petición no está llegando al servidor API. Comprueba que la API está en marcha y que el puerto del proxy coincide (si la API va en 3009, arranca Vite con `API_PORT=3009 npm run dev`).

## API (backend)

Todas las rutas `/api/*` (validate, tasks, objectives, habits, etc.) se sirven mediante **una sola** Serverless Function en Vercel (`api/index.js`), que enruta por path a los handlers en `server/handlers/`. Así se respeta el límite de 12 funciones del plan Hobby. En desarrollo local, `server.js` usa el mismo `api/index.js`.

### Caché en el cliente y modo offline

Las respuestas GET se cachean **en memoria** (1 día) y en **IndexedDB** (persistente). La caché se invalida al crear, actualizar o borrar un recurso y al usar el refresh manual.

**Comportamiento offline:**

- **UI:** La PWA sirve la shell (HTML, JS, CSS) desde el Service Worker (precache + navigate fallback a `index.html`), así la app carga y navega sin red.
- **Datos:** Si no hay conexión, las lecturas se sirven desde IndexedDB. Las mutaciones (crear, editar, borrar) se encolan en IndexedDB y se aplican en la copia local de forma optimista (la UI se actualiza al instante). Al recuperar conexión, la cola se envía a la API en orden.
- **Indicador:** En la parte superior se muestra "Sin conexión", "Sincronizando…" o el número de cambios pendientes cuando aplica.
- **Conflictos:** Si al aplicar un cambio encolado el servidor tiene una versión más reciente (por `lastModified`), la API responde **409 Conflict** y ese cambio se descarta; la app actualiza con los datos del servidor y muestra un aviso de conflicto.

Para que la resolución de conflictos funcione, las tablas de Airtable deben tener un campo de tipo **"Last Modified Time"** (campo calculado de Airtable) o la API usará la metadata del registro cuando esté disponible.

## Build y producción

```bash
npm run build
# Con Docker
docker compose up --build
```

## Vista Meals

En la ruta `/meals` se muestra una vista de semana (como en Planner) con una columna por día. Cada columna tiene tres huecos: **Breakfast**, **Lunch** y **Dinner**. En cada hueco se muestran las comidas (Meals) de Airtable para ese día y tipo. Puedes arrastrar una comida a otro día o a otro tipo (desayuno/comida/cena) y se actualiza la fecha y el tipo en Airtable. El botón "+" en cada hueco abre un modal para elegir una receta (de la base Recipes) que coincida con el Meal Type. **Al elegir una receta**, la app comprueba si alguno de sus ingredientes está en tu Shopping List. Si hay ingredientes en la lista, se muestra un pop-up **Ingredientes en tu lista** con esos ingredientes agrupados en **Need** (primero) y **Have** (después), cada uno con un checkbox (marcado = Need, desmarcado = Have). Puedes cambiar el estado antes de confirmar. **Atrás**: cierra el pop-up sin añadir la receta ni modificar la Shopping List. **Confirmar**: añade la receta al día y actualiza el estado (Have/Need) de esos ingredientes en la Shopping List según los checkboxes. Si la receta no tiene ningún ingrediente en tu lista, se añade directamente sin pop-up. Al hacer clic en una comida se abre un modal para sustituirla por otra receta o borrarla.

## Vista Planner

En la ruta `/` (Planner), las secciones **Tasks** y **Habits** son colapsables. Al colapsar Tasks se mantiene visible la barra de progreso. Al colapsar Habits se mantienen visibles dos filas de contadores (1–5): una para Good Habits (corazones verdes) y otra para Bad Habits (corazones rojos). La lista de hábitos es única: todos (good y bad) agrupados por categoría y ordenados alfabéticamente dentro de cada grupo.

En la cabecera de cada día se muestra el nombre del día y la fecha en formato **Monday March 2nd** (mes y día con ordinal). Indicadores en la cabecera:
- **Estrella**: todas las tareas del día completadas.
- **Fuego**: 5 o más Good Habits completados ese día.
- **Caca** (icono de mierda): 2 o más Bad Habits completados ese día.

## Rutas

- `/` — Planner (tareas por día y hábitos)
- `/meals` — Meals (vista semana: desayuno/comida/cena por día; arrastrar, añadir y editar desde recetas)
- `/objectives`, `/objectives/:id` — Objetivos
- `/key-results`, `/key-results/:id` — Key Results
- `/tasks`, `/tasks/:id` — Tareas (filtros: Today, Week, Month, Unplanned —sin fecha de vencimiento—, All)
- `/habits`, `/habits/:id` — Hábitos
- `/analysis/okr` — Análisis OKR
- `/analysis/tasks` — Análisis tareas
- `/analysis/habits` — Análisis hábitos
- `/shopping` — Lista de la compra (filtros por Status, Priority, Store, Category; búsqueda; checkbox Need/Have; edición en modal). Los filtros aparecen colapsados por defecto; la preferencia abrir/cerrar se guarda en `localStorage` (`mosco-shopping-filters-collapsed`).
- `/recipes`, `/recipes/:id` — Recetas (lista con búsqueda; detalle con ingredientes: ver, ampliar, editar, eliminar, añadir)

## Scripts de datos (Airtable)

- **Ingredients + Shopping List:** `npm run seed-ingredients-shopping -- scripts/data/ingredients-shopping.json` — JSON con `ingredients` y/o `shoppingList`.
- **Recetas:** `npm run seed-recipes -- scripts/data/recipes.json` — JSON con `recipes`; cada receta incluye `ingredients` (por `Name` en inglés, mismos que en la tabla Ingredients). Formato: ver `scripts/data/README.md` y `scripts/data/recipes.example.json`.

## PWA y offline

La app es instalable como PWA. En el manifest se definen **shortcuts** que permiten abrir directamente: Discovery (`/discovery`), OKRs (`/objectives`), Tasks (`/tasks`) y Shopping (`/shopping`). Tras instalar la PWA, los shortcuts suelen mostrarse al mantener pulsado el icono de la app (Android) o en el menú contextual del icono (escritorio).

La **UI se sirve desde caché** (precache de assets + fallback de navegación a `index.html`), de modo que la app abre y navega sin red. Los **datos** se leen y escriben contra IndexedDB cuando no hay conexión; al volver a estar online se sincronizan con la API y se resuelven conflictos por timestamp (`lastModified`). Ver sección "Caché en el cliente y modo offline" más arriba.
