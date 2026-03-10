# Datos para scripts de Airtable

Esquema exacto de las tablas para que los JSON y scripts coincidan con Airtable.

**Para generar más JSON con una IA:** usa la especificación [JSON-SPEC-FOR-AI.md](./JSON-SPEC-FOR-AI.md). Ahí están definidos tipos, campos obligatorios/opcionales y **todas las opciones** (enums) para recetas, ingredientes y shopping list, listas para copiar en el prompt.

---

## Ingredients (base Recipes)

| Campo     | Tipo   | Valores / notas |
|----------|--------|------------------|
| Name     | string | Obligatorio. |
| Name ES  | string | Opcional. |
| Description | string | Opcional. |
| Category | single select | **Solo uno de:** `Vegetable`, `Fruit`, `Meat`, `Dairy`, `Grain`, `Spice`, `Herb`, `Condiment`, `Other` |
| Unit     | single select | **Solo uno de:** `pcs`, `kg`, `L`, `pack`, `bag`, `cup`, `tbsp`, `tsp` |
| Notes    | string | Opcional. |
| Recipe Ingredients | link | Solo lectura (enlace inverso). No se escribe desde JSON. |

---

## Recipes (base Recipes)

| Campo | Tipo | Valores / notas |
|-------|------|------------------|
| Name | string | Obligatorio. |
| Name ES | string | Opcional. |
| Description | string | Opcional. |
| Meal Type | multi-select | **Uno o más de:** `Breakfast`, `Lunch`, `Dinner`, `Snack`, `Tapa` (en el JSON puede ser string o array; el script envía array) |
| Cooking Process | string | Opcional. |
| Complexity Rating | number | Opcional. |
| Nutrient Rating | number | Opcional. |
| Time to Cook (minutes) | number | Opcional. |
| Servings | number | Opcional. |
| Cuisine Type | single select | **Solo uno de:** `American`, `Asian`, `European`, `Middle Eastern`, `Mexican`, `Other`, `Spanish`, `Colombian`, `International` |
| Source/URL | string | Opcional. |
| Tags | string | Opcional. |
| Recipe Ingredients | link | Solo lectura (enlace inverso). No se escribe desde JSON. |

---

## Recipe Ingredients (base Recipes)

| Campo | Tipo | Valores / notas |
|-------|------|------------------|
| Recipe | link → Recipes | Obligatorio (record id). |
| Ingredient | link → Ingredients | Obligatorio (record id). |
| Quantity | number | Opcional. |
| Unit | string | Opcional. Mismos valores que Ingredients: `pcs`, `kg`, `L`, `pack`, `bag`, `cup`, `tbsp`, `tsp`. |
| Optional Ingredient | checkbox | Opcional (`true` / `false`). |
| Notes | string | Opcional. |

---

## Shopping List (base Shopping)

| Campo | Tipo | Valores / notas |
|-------|------|------------------|
| Name | string | Obligatorio. |
| Description | string | Opcional. |
| Name ES | string | Opcional. |
| Quantity | number | Opcional. |
| Unit | single select | **Solo uno de:** `pcs`, `kg`, `L`, `pack`, `bag`, `cup`, `tbsp`, `tsp` |
| Store | string | Opcional. |
| Status | single select | **Solo uno de:** `Need`, `Have` |
| Priority | single select | **Solo uno de:** `Low`, `Medium`, `High` |
| Category | single select | **Solo uno de:** `Fruits & Vegs`, `Meat & Fish`, `Herbs & Condiments`, `Drinks`, `Snacks`, `Other` |
| Notes | string | Opcional. |
| Image (Web) | url | Opcional. |

---

## JSON: Ingredients + Shopping List

**Fichero:** `ingredients-shopping.json` (ejemplo: `ingredients-shopping.example.json`).

```json
{
  "ingredients": [
    { "Name": "Oil", "Name ES": "Aceite", "Category": "Condiment", "Unit": "L" },
    { "Name": "Garlic", "Name ES": "Ajo", "Category": "Vegetable", "Unit": "pcs" }
  ],
  "shoppingList": [
    { "Name": "Oil", "Name ES": "Aceite", "Quantity": 1, "Unit": "L", "Status": "Need", "Priority": "Medium", "Category": "Herbs & Condiments" }
  ]
}
```

- **ingredients**: `Name` = inglés, `Name ES` = español. `Category` y `Unit` deben ser uno de los valores de la tabla Ingredients.
- **shoppingList**: Debe incluir **todos** los ingredientes (mismo `Name`). Si falta alguno, el script añade una entrada por defecto (Status: Need, Priority: Low). `Category`, `Unit`, `Status` y `Priority` = valores de la tabla Shopping List.

**Ejecutar** (desde `apps/personal-planner`; el `--` es necesario para pasar la ruta al script):

```bash
npm run seed-ingredients-shopping -- scripts/data/ingredients-shopping.json
```

---

## JSON: Recetas

**Fichero:** `recipes.json` (ejemplo: `recipes.example.json`).

Cada receta tiene los campos de la tabla **Recipes** y un array `ingredients` con referencias por **Name** (inglés, mismo que en la tabla Ingredients). Opcionalmente cada ítem puede llevar `Quantity`, `Unit`, `Optional Ingredient` (boolean), `Notes`.

```json
{
  "recipes": [
    {
      "Name": "Paella",
      "Name ES": "Paella",
      "Description": "- Aceite en la paella\n- ...",
      "Meal Type": "Lunch",
      "Cuisine Type": "Spanish",
      "Servings": 4,
      "Time to Cook (minutes)": 25,
      "ingredients": [
        { "Name": "Oil" },
        { "Name": "Garlic", "Quantity": 2, "Unit": "pcs" },
        { "Name": "Bomba rice", "Quantity": 0.24, "Unit": "kg", "Notes": "60 g por persona" }
      ]
    }
  ]
}
```

- **Campos de receta:** `Name`, `Name ES`, `Description`, `Meal Type` (Breakfast, Lunch, Dinner, Snack), `Cooking Process`, `Complexity Rating`, `Nutrient Rating`, `Time to Cook (minutes)`, `Servings`, `Cuisine Type` (American, Asian, European, Middle Eastern, Mexican, Other, Spanish, Colombian, International), `Source/URL`, `Tags`.
- **ingredients:** array de objetos con `Name` (obligatorio, debe existir en la tabla Ingredients). Opcionales: `Quantity`, `Unit` (pcs, kg, L, pack, bag, cup, tbsp, tsp), `Optional Ingredient` (true/false), `Notes`.

**Ejecutar** (desde `apps/personal-planner`):

```bash
npm run seed-recipes -- scripts/data/recipes.json
```

Los ingredientes deben estar ya creados en Airtable (p. ej. con `npm run seed-ingredients-shopping`); el script resuelve cada `Name` al record id del ingrediente.
