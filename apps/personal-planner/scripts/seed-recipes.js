#!/usr/bin/env node
/**
 * Crea en Airtable Recetas (Recipes) y sus enlaces con ingredientes (Recipe Ingredients)
 * a partir de un JSON. Los ingredientes se referencian por Name (inglés, mismo que en la tabla Ingredients).
 *
 * Uso (desde apps/personal-planner):
 *   npm run seed-recipes -- scripts/data/recipes.json
 *
 * Formato del JSON: ver scripts/data/recipes.example.json
 */

import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { getRecipesBase, fetchTable, createRecord } from '../api/_lib/airtable.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnv() {
  const envPath = join(root, '.env')
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
      if (m && !process.env[m[1]]) {
        const val = m[2].replace(/^["']|["']$/g, '').trim()
        process.env[m[1]] = val
      }
    }
  }
}

const TABLE_RECIPES = process.env.AIRTABLE_TABLE_RECIPES || 'Recipes'
const TABLE_INGREDIENTS = process.env.AIRTABLE_TABLE_INGREDIENTS || 'Ingredients'
const TABLE_RECIPE_INGREDIENTS = process.env.AIRTABLE_TABLE_RECIPE_INGREDIENTS || 'Recipe Ingredients'

const MEAL_TYPES = new Set(['Breakfast', 'Lunch', 'Dinner', 'Snack'])
const CUISINE_TYPES = new Set(['American', 'Asian', 'European', 'Middle Eastern', 'Mexican', 'Other', 'Spanish', 'Colombian', 'International'])
const RECIPE_INGREDIENT_UNITS = new Set(['pcs', 'kg', 'L', 'pack', 'bag', 'cup', 'tbsp', 'tsp'])

function normalizeName(s) {
  return String(s || '').toLowerCase().trim()
}

function mapRecipeFields(obj) {
  const fields = {}
  if (obj.Name != null && String(obj.Name).trim()) fields.Name = String(obj.Name).trim()
  if (obj['Name ES'] != null && String(obj['Name ES']).trim()) fields['Name ES'] = String(obj['Name ES']).trim()
  if (obj.Description != null && String(obj.Description).trim()) fields.Description = String(obj.Description).trim()
  // Meal Type y Cuisine Type son multi-select en Airtable: enviar como array
  const mealRaw = obj['Meal Type']
  const mealValues = Array.isArray(mealRaw)
    ? mealRaw.map((m) => String(m).trim()).filter((m) => MEAL_TYPES.has(m))
    : (mealRaw != null && String(mealRaw).trim() && MEAL_TYPES.has(String(mealRaw).trim()) ? [String(mealRaw).trim()] : [])
  if (mealValues.length) fields['Meal Type'] = mealValues
  if (obj['Cooking Process'] != null && String(obj['Cooking Process']).trim()) fields['Cooking Process'] = String(obj['Cooking Process']).trim()
  if (obj['Complexity Rating'] != null && obj['Complexity Rating'] !== '') fields['Complexity Rating'] = Number(obj['Complexity Rating'])
  if (obj['Nutrient Rating'] != null && obj['Nutrient Rating'] !== '') fields['Nutrient Rating'] = Number(obj['Nutrient Rating'])
  if (obj['Time to Cook (minutes)'] != null && obj['Time to Cook (minutes)'] !== '') fields['Time to Cook (minutes)'] = Number(obj['Time to Cook (minutes)'])
  if (obj.Servings != null && obj.Servings !== '') fields.Servings = Number(obj.Servings)
  const cuisine = obj['Cuisine Type'] != null ? String(obj['Cuisine Type']).trim() : ''
  if (cuisine && CUISINE_TYPES.has(cuisine)) fields['Cuisine Type'] = cuisine
  else if (cuisine) console.warn('Recipes: Cuisine Type no válido (se omite):', cuisine)
  if (obj['Source/URL'] != null && String(obj['Source/URL']).trim()) fields['Source/URL'] = String(obj['Source/URL']).trim()
  if (obj.Tags != null && String(obj.Tags).trim()) fields.Tags = String(obj.Tags).trim()
  return fields
}

async function main() {
  loadEnv()
  const rawPath = process.argv[2]
  if (!rawPath || !String(rawPath).trim()) {
    console.error('Uso: node scripts/seed-recipes.js <ruta-al-json>')
    console.error('Ejemplo: npm run seed-recipes -- scripts/data/recipes.json')
    process.exit(1)
  }
  const fromCwd = join(process.cwd(), rawPath.replace(/^\.\//, ''))
  const fromRoot = join(root, rawPath.replace(/^\.\//, ''))
  let jsonPath = existsSync(fromCwd) ? fromCwd : fromRoot
  if (!existsSync(jsonPath)) {
    const examplePath = join(root, 'scripts/data/recipes.example.json')
    if (existsSync(examplePath)) {
      console.error('No se encuentra el fichero:', rawPath)
      console.error('Usando el ejemplo: scripts/data/recipes.example.json')
      jsonPath = examplePath
    } else {
      console.error('No se encuentra el fichero:', rawPath)
      process.exit(1)
    }
  }

  let data
  try {
    data = JSON.parse(readFileSync(jsonPath, 'utf8'))
  } catch (e) {
    console.error('Error leyendo JSON:', e.message)
    process.exit(1)
  }

  const recipes = Array.isArray(data.recipes) ? data.recipes : []
  if (recipes.length === 0) {
    console.error('El JSON no tiene un array "recipes" con al menos una receta.')
    process.exit(1)
  }

  const base = getRecipesBase()
  if (!base) {
    console.error('Airtable Recipes no configurado (AIRTABLE_PAT, AIRTABLE_BASE_ID_RECIPES).')
    process.exit(1)
  }

  const ingredientsList = await fetchTable(TABLE_INGREDIENTS, 500, base)
  const ingredientById = new Map(ingredientsList.map((r) => [normalizeName(r.Name), r]))

  const existingRecipes = await fetchTable(TABLE_RECIPES, 500, base)
  const recipeByName = new Map(existingRecipes.map((r) => [normalizeName(r.Name), r]))

  for (const item of recipes) {
    const name = (item.Name && String(item.Name).trim()) || null
    if (!name) {
      console.warn('Receta sin Name, se omite.')
      continue
    }
    if (recipeByName.has(normalizeName(name))) {
      console.log('Receta ya existe (se omite):', name)
      continue
    }
    const recipeFields = { Name: name, ...mapRecipeFields(item) }
    const recipe = await createRecord(TABLE_RECIPES, recipeFields, base)
    recipeByName.set(normalizeName(name), recipe)
    console.log('Receta creada:', recipe.Name, recipe.id)

    const ingredients = Array.isArray(item.ingredients) ? item.ingredients : []
    for (const ri of ingredients) {
      const ingName = (ri.Name && String(ri.Name).trim()) || null
      if (!ingName) continue
      const ing = ingredientById.get(normalizeName(ingName))
      if (!ing) {
        console.warn('  Ingrediente no encontrado en Airtable (se omite):', ingName)
        continue
      }
      const fields = {
        Recipe: [recipe.id],
        Ingredient: [ing.id],
      }
      if (ri.Quantity != null && ri.Quantity !== '') fields.Quantity = Number(ri.Quantity)
      const unit = ri.Unit != null ? String(ri.Unit).trim() : ''
      if (unit && RECIPE_INGREDIENT_UNITS.has(unit)) fields.Unit = unit
      if (ri['Optional Ingredient'] != null) fields['Optional Ingredient'] = Boolean(ri['Optional Ingredient'])
      if (ri.Notes != null && String(ri.Notes).trim()) fields.Notes = String(ri.Notes).trim()
      await createRecord(TABLE_RECIPE_INGREDIENTS, fields, base)
      console.log('  - Recipe Ingredient:', ingName)
    }
  }

  console.log('Hecho.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
