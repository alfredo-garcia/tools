# @tools/shared-planner

Dominio compartido del planner (tareas, hábitos, OKR, comidas, recetas, compra). Lógica y helpers reutilizables para apps web (p. ej. planner-web), sin depender de una API concreta ni de UI.

## Arquitectura

Lógica de negocio compartida para el planner (tareas, hábitos, calendario). **Sin componentes ni estilos.** Para UI las apps usan **@tools/shared** (p. ej. planner-web importa componentes y tokens de shared). Opcional: para adaptadores de campos (Airtable, etc.) puedes usar `field`, `str` de @tools/shared.

## Estructura

```
apps/shared-planner/
  package.json
  src/
    index.js           # barrel: reexporta dominio y lógica
    task/
      domain.js        # (placeholder) modelos Task
      status.js        # getTaskStatusGroup, getTaskStatusBreakdown, getTaskDisplayGroup
    habit/
      domain.js        # isHabitSuccess, getHabitIdFromTracking
      analytics.js     # computeHabitSuccessPercentage, groupHabitsByCategory, filterTrackingByHabitIds
```

## Dependencias

- **peerDependencies**: `react`, `@tools/shared` (opcional; para normalización de campos en adaptadores, p. ej. Airtable).

## Exportaciones

### Task

| Función | Descripción |
|--------|-------------|
| `getTaskStatusGroup(task, options?)` | Agrupa estado de tarea en `'pending' \| 'in_progress' \| 'done' \| 'other'`. `options.fieldAccessor` para adaptar nombres de campo. |
| `getTaskStatusBreakdown(tasks, options?)` | Devuelve `{ total, counts, percentages }` por grupo. |
| `getTaskDisplayGroup(task, dueDateStr, isPastDueFn, options?)` | Grupo para listas: `'past_due'` si vencida y no done, sino el status group. |

### Habit

| Función | Descripción |
|--------|-------------|
| `isHabitSuccess(record, options?)` | Indica si un registro de tracking cuenta como éxito. |
| `getHabitIdFromTracking(record, options?)` | Extrae id de hábito desde el campo link del registro. |
| `computeHabitSuccessPercentage(tracking)` | Porcentaje de éxito (0–100) sobre un array de registros. |
| `groupHabitsByCategory(habits, options?)` | Agrupa hábitos por categoría; devuelve `[category, habits[]][]`. |
| `filterTrackingByHabitIds(tracking, habitIds)` | Filtra registros por conjunto de ids de hábito. |

## Uso desde planner-web (o cualquier app web que use @tools/shared)

```js
import {
  getTaskStatusGroup,
  getTaskStatusBreakdown,
  getTaskDisplayGroup,
  isHabitSuccess,
  computeHabitSuccessPercentage,
  groupHabitsByCategory,
} from '@tools/shared-planner'
```

Con adaptador de campos (ej. Airtable):

```js
import { field, str } from '@tools/shared'
import { getTaskStatusGroup } from '@tools/shared-planner'

const statusGroup = getTaskStatusGroup(task, {
  fieldAccessor: (t, ...keys) => str(field(t, ...keys)),
})
```
