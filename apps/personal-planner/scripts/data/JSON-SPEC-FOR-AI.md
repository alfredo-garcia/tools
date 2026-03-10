# Especificación JSON para generación por IA

Usa esta especificación para que una IA genere ficheros JSON válidos que se pueden importar con los scripts de seed (`seed-recipes.js`, `seed-ingredients-shopping.js`). Los nombres de propiedades y los valores enumerados deben coincidir **exactamente** (incluyendo mayúsculas y espacios).

---

## 1. Fichero de recetas: `recipes.json`

**Estructura raíz:** un objeto con una única clave `recipes`, que es un **array de objetos** (cada objeto = una receta).

### Objeto receta (cada elemento de `recipes`)

| Propiedad | Tipo | Obligatorio | Descripción y opciones |
|-----------|------|-------------|------------------------|
| `Name` | string | **Sí** | Nombre de la receta (ej. en inglés). |
| `Name ES` | string | No | Nombre en español. |
| `Description` | string | No | Descripción o pasos. Puede contener `\n` para saltos de línea. |
| `Meal Type` | string **o** array de strings | No | **Solo uno o más de:** `Breakfast`, `Lunch`, `Dinner`, `Snack`, `Tapa`. Si es un solo valor, enviar string; si son varios, array. |
| `Cooking Process` | string | No | Texto del proceso de cocción. |
| `Complexity Rating` | number | No | Número (ej. 1–5). |
| `Nutrient Rating` | number | No | Número (ej. 1–5). |
| `Time to Cook (minutes)` | number | No | Minutos totales. |
| `Servings` | number | No | Número de raciones. |
| `Cuisine Type` | string | No | **Solo uno de:** `American`, `Asian`, `European`, `Middle Eastern`, `Mexican`, `Other`, `Spanish`, `Colombian`, `International`. |
| `Source/URL` | string | No | URL de la fuente (opcional). |
| `Tags` | string | No | Etiquetas en texto libre (ej. "comfort, one-pot"). |
| `ingredients` | array | No | Lista de ingredientes de la receta (ver abajo). |

### Objeto ingrediente dentro de una receta (cada elemento de `ingredients`)

Los ingredientes se referencian por **Name** (debe coincidir con el `Name` de un ingrediente ya existente en la tabla Ingredients; típicamente en inglés).

| Propiedad | Tipo | Obligatorio | Descripción y opciones |
|-----------|------|-------------|------------------------|
| `Name` | string | **Sí** | Nombre del ingrediente (debe existir en la tabla Ingredients). |
| `Quantity` | number | No | Cantidad (ej. 2, 0.5, 0.24). |
| `Unit` | string | No | **Solo uno de:** `pcs`, `kg`, `L`, `pack`, `bag`, `cup`, `tbsp`, `tsp`. |
| `Optional Ingredient` | boolean | No | `true` si el ingrediente es opcional. |
| `Notes` | string | No | Nota para esta receta (ej. "dientes enteros, retirar al dorar"). |

**Resumen de opciones para recetas:**

- **Meal Type:** `Breakfast` | `Lunch` | `Dinner` | `Snack` | `Tapa` (uno o varios).
- **Cuisine Type:** `American` | `Asian` | `European` | `Middle Eastern` | `Mexican` | `Other` | `Spanish` | `Colombian` | `International`.
- **Unit (en ingredients):** `pcs` | `kg` | `L` | `pack` | `bag` | `cup` | `tbsp` | `tsp`.

**Ejemplo mínimo de una receta:**

```json
{
  "recipes": [
    {
      "Name": "Tomato Pasta",
      "Name ES": "Pasta con tomate",
      "Description": "Cook pasta. Add sauce.",
      "Meal Type": "Dinner",
      "Cuisine Type": "European",
      "Servings": 2,
      "Time to Cook (minutes)": 20,
      "ingredients": [
        { "Name": "Pasta" },
        { "Name": "Tomato", "Quantity": 4, "Unit": "pcs" },
        { "Name": "Olive oil", "Quantity": 2, "Unit": "tbsp", "Notes": "extra virgin" }
      ]
    }
  ]
}
```

---

## 2. Fichero de ingredientes y lista de la compra: `ingredients-shopping.json`

**Estructura raíz:** un objeto con dos claves: `ingredients` (array) y `shoppingList` (array).

### Objeto ingrediente (cada elemento de `ingredients`)

| Propiedad | Tipo | Obligatorio | Descripción y opciones |
|-----------|------|-------------|------------------------|
| `Name` | string | **Sí** | Nombre del ingrediente (ej. en inglés). Debe ser único en el array. |
| `Name ES` | string | No | Nombre en español. |
| `Description` | string | No | Descripción del ingrediente. |
| `Category` | string | No | **Solo uno de:** `Vegetable`, `Fruit`, `Meat`, `Dairy`, `Grain`, `Spice`, `Herb`, `Condiment`, `Other`. |
| `Unit` | string | No | **Solo uno de:** `pcs`, `kg`, `L`, `pack`, `bag`, `cup`, `tbsp`, `tsp`. |
| `Notes` | string | No | Notas. |

**Resumen de opciones para ingredients:**

- **Category:** `Vegetable` | `Fruit` | `Meat` | `Dairy` | `Grain` | `Spice` | `Herb` | `Condiment` | `Other`.
- **Unit:** `pcs` | `kg` | `L` | `pack` | `bag` | `cup` | `tbsp` | `tsp`.

### Objeto ítem de lista de la compra (cada elemento de `shoppingList`)

| Propiedad | Tipo | Obligatorio | Descripción y opciones |
|-----------|------|-------------|------------------------|
| `Name` | string | **Sí** | Debe coincidir con el `Name` de un ingrediente en el array `ingredients` (mismo nombre exacto). |
| `Name ES` | string | No | Nombre en español. |
| `Description` | string | No | Descripción. |
| `Quantity` | number | No | Cantidad a comprar. |
| `Unit` | string | No | **Solo uno de:** `pcs`, `kg`, `L`, `pack`, `bag`, `cup`, `tbsp`, `tsp`. |
| `Store` | string | No | Dónde comprarlo (texto libre). |
| `Status` | string | No | **Solo uno de:** `Need`, `Have`. |
| `Priority` | string | No | **Solo uno de:** `Low`, `Medium`, `High`. |
| `Category` | string | No | **Solo uno de:** `Fruits & Vegs`, `Meat & Fish`, `Herbs & Condiments`, `Drinks`, `Snacks`, `Other`. |
| `Notes` | string | No | Notas. |
| `Image (Web)` | string | No | URL de imagen. |

**Resumen de opciones para shoppingList:**

- **Status:** `Need` | `Have`.
- **Priority:** `Low` | `Medium` | `High`.
- **Category:** `Fruits & Vegs` | `Meat & Fish` | `Herbs & Condiments` | `Drinks` | `Snacks` | `Other`.
- **Unit:** `pcs` | `kg` | `L` | `pack` | `bag` | `cup` | `tbsp` | `tsp`.

**Regla importante:** Cada ítem de `shoppingList` debe tener un `Name` que exista en el array `ingredients`. Si quieres una lista de la compra coherente, incluye en `shoppingList` una entrada por cada ingrediente que quieras comprar (mismo `Name` que en `ingredients`).

**Ejemplo mínimo:**

```json
{
  "ingredients": [
    { "Name": "Tomato", "Name ES": "Tomate", "Category": "Vegetable", "Unit": "pcs" },
    { "Name": "Pasta", "Name ES": "Pasta", "Category": "Grain", "Unit": "kg" }
  ],
  "shoppingList": [
    { "Name": "Tomato", "Name ES": "Tomate", "Quantity": 4, "Unit": "pcs", "Status": "Need", "Priority": "Medium", "Category": "Fruits & Vegs" },
    { "Name": "Pasta", "Name ES": "Pasta", "Quantity": 0.5, "Unit": "kg", "Status": "Need", "Priority": "Low", "Category": "Other" }
  ]
}
```

---

## Prompt sugerido para la IA

Puedes copiar y adaptar algo así:

```
Genera un fichero JSON válido según esta especificación.

[Pega aquí la sección 1 para recetas O la sección 2 para ingredients-shopping.]

Reglas:
- Nombres de propiedades exactos (incluyendo "Name ES", "Meal Type", "Time to Cook (minutes)", "Optional Ingredient", "Source/URL", "Image (Web)").
- Para campos con opciones (Meal Type, Cuisine Type, Category, Unit, Status, Priority) usa solo uno de los valores listados.
- En recetas, cada elemento de "ingredients" debe tener "Name" y opcionalmente Quantity, Unit, Optional Ingredient, Notes. El "Name" debe ser un ingrediente que existiría en la tabla Ingredients (nombre en inglés).
- En ingredients-shopping, cada ítem de shoppingList debe tener un "Name" que coincida con algún "Name" del array "ingredients".
- Salida: solo JSON, sin markdown ni explicaciones alrededor.
```

---

## Referencia rápida de enums

| Contexto | Campo | Valores permitidos |
|----------|--------|--------------------|
| Recipe | Meal Type | `Breakfast`, `Lunch`, `Dinner`, `Snack`, `Tapa` |
| Recipe | Cuisine Type | `American`, `Asian`, `European`, `Middle Eastern`, `Mexican`, `Other`, `Spanish`, `Colombian`, `International` |
| Recipe ingredient / Ingredient / Shopping | Unit | `pcs`, `kg`, `L`, `pack`, `bag`, `cup`, `tbsp`, `tsp` |
| Ingredient | Category | `Vegetable`, `Fruit`, `Meat`, `Dairy`, `Grain`, `Spice`, `Herb`, `Condiment`, `Other` |
| Shopping | Status | `Need`, `Have` |
| Shopping | Priority | `Low`, `Medium`, `High` |
| Shopping | Category | `Fruits & Vegs`, `Meat & Fish`, `Herbs & Condiments`, `Drinks`, `Snacks`, `Other` |
