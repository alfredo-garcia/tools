#!/usr/bin/env node
/**
 * Crea en Airtable los Ingredients (base Recipes) y los ítems de Shopping List (base Shopping)
 * a partir de un JSON.
 *
 * Uso (desde apps/personal-planner):
 *   node --env-file=.env scripts/seed-ingredients-shopping.js scripts/data/ingredients-shopping.json
 *
 * Formato del JSON: ver scripts/data/ingredients-shopping.example.json
 */

import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { getRecipesBase, getShoppingBase, fetchTable, createRecord } from '../api/_lib/airtable.js'

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

const TABLE_INGREDIENTS = process.env.AIRTABLE_TABLE_INGREDIENTS || 'Ingredients'
const TABLE_SHOPPING = process.env.AIRTABLE_TABLE_SHOPPING || 'Shopping List'

// Valores permitidos en Airtable (single select)
const INGREDIENT_CATEGORIES = new Set(['Vegetable', 'Fruit', 'Meat', 'Dairy', 'Grain', 'Spice', 'Herb', 'Condiment', 'Other'])
const INGREDIENT_UNITS = new Set(['pcs', 'kg', 'L', 'pack', 'bag', 'cup', 'tbsp', 'tsp'])
const SHOPPING_CATEGORIES = new Set(['Fruits & Vegs', 'Meat & Fish', 'Herbs & Condiments', 'Drinks', 'Snacks', 'Other'])
const SHOPPING_UNITS = new Set(['pcs', 'kg', 'L', 'pack', 'bag', 'cup', 'tbsp', 'tsp'])
const SHOPPING_STATUS = new Set(['Need', 'Have'])
const SHOPPING_PRIORITY = new Set(['Low', 'Medium', 'High'])

function normalizeName(s) {
  return (String(s || '').toLowerCase().trim())
}

function mapIngredientFields(obj) {
  const fields = {}
  if (obj.Name != null && String(obj.Name).trim()) fields.Name = String(obj.Name).trim()
  if (obj['Name ES'] != null && String(obj['Name ES']).trim()) fields['Name ES'] = String(obj['Name ES']).trim()
  if (obj.Description != null && String(obj.Description).trim()) fields.Description = String(obj.Description).trim()
  const cat = obj.Category != null ? String(obj.Category).trim() : ''
  if (cat && INGREDIENT_CATEGORIES.has(cat)) fields.Category = cat
  else if (cat) console.warn('Ingredients: Category no válida (se omite):', cat, '- Permitidas:', [...INGREDIENT_CATEGORIES].join(', '))
  const unit = obj.Unit != null ? String(obj.Unit).trim() : ''
  if (unit && INGREDIENT_UNITS.has(unit)) fields.Unit = unit
  else if (unit) console.warn('Ingredients: Unit no válida (se omite):', unit, '- Permitidas:', [...INGREDIENT_UNITS].join(', '))
  if (obj.Notes != null && String(obj.Notes).trim()) fields.Notes = String(obj.Notes).trim()
  return fields
}

function mapShoppingFields(obj) {
  const fields = {}
  if (obj.Name != null && String(obj.Name).trim()) fields.Name = String(obj.Name).trim()
  if (obj.Description != null && String(obj.Description).trim()) fields.Description = String(obj.Description).trim()
  if (obj['Name ES'] != null && String(obj['Name ES']).trim()) fields['Name ES'] = String(obj['Name ES']).trim()
  if (obj.Quantity != null && obj.Quantity !== '') fields.Quantity = typeof obj.Quantity === 'number' ? obj.Quantity : Number(obj.Quantity)
  const unit = obj.Unit != null ? String(obj.Unit).trim() : ''
  if (unit && SHOPPING_UNITS.has(unit)) fields.Unit = unit
  else if (unit) console.warn('Shopping List: Unit no válida (se omite):', unit, '- Permitidas:', [...SHOPPING_UNITS].join(', '))
  if (obj.Store != null && String(obj.Store).trim()) fields.Store = String(obj.Store).trim()
  const status = obj.Status != null ? String(obj.Status).trim() : ''
  if (status && SHOPPING_STATUS.has(status)) fields.Status = status
  else if (status) console.warn('Shopping List: Status no válido (se omite):', status, '- Permitidos:', [...SHOPPING_STATUS].join(', '))
  const priority = obj.Priority != null ? String(obj.Priority).trim() : ''
  if (priority && SHOPPING_PRIORITY.has(priority)) fields.Priority = priority
  else if (priority) console.warn('Shopping List: Priority no válida (se omite):', priority, '- Permitidas:', [...SHOPPING_PRIORITY].join(', '))
  const cat = obj.Category != null ? String(obj.Category).trim() : ''
  if (cat && SHOPPING_CATEGORIES.has(cat)) fields.Category = cat
  else if (cat) console.warn('Shopping List: Category no válida (se omite):', cat, '- Permitidas:', [...SHOPPING_CATEGORIES].join(', '))
  if (obj.Notes != null && String(obj.Notes).trim()) fields.Notes = String(obj.Notes).trim()
  if (obj['Image (Web)'] != null && String(obj['Image (Web)']).trim()) fields['Image (Web)'] = String(obj['Image (Web)']).trim()
  return fields
}

async function main() {
  loadEnv()
  const rawPath = process.argv[2]
  if (!rawPath || !String(rawPath).trim()) {
    console.error('Uso: node scripts/seed-ingredients-shopping.js <ruta-al-json>')
    console.error('Ejemplo: npm run seed-ingredients-shopping -- scripts/data/ingredients-shopping.json')
    process.exit(1)
  }
  // Resolver ruta: primero desde cwd, luego desde raíz del app
  const fromCwd = join(process.cwd(), rawPath.replace(/^\.\//, ''))
  const fromRoot = join(root, rawPath.replace(/^\.\//, ''))
  let jsonPath = existsSync(fromCwd) ? fromCwd : fromRoot
  if (!existsSync(jsonPath)) {
    const examplePath = join(root, 'scripts/data/ingredients-shopping.example.json')
    if (existsSync(examplePath)) {
      console.error('No se encuentra el fichero:', rawPath)
      console.error('Usando el ejemplo: scripts/data/ingredients-shopping.example.json')
      jsonPath = examplePath
    } else {
      console.error('No se encuentra el fichero:', rawPath)
      console.error('Copia el ejemplo: cp scripts/data/ingredients-shopping.example.json scripts/data/ingredients-shopping.json')
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

  const ingredients = Array.isArray(data.ingredients) ? data.ingredients : []
  let shoppingList = Array.isArray(data.shoppingList) ? data.shoppingList : []

  const recipesBase = getRecipesBase()
  const shoppingBase = getShoppingBase()

  if (ingredients.length && !recipesBase) {
    console.error('Airtable Recipes no configurado (AIRTABLE_PAT, AIRTABLE_BASE_ID_RECIPES). No se pueden crear Ingredients.')
    process.exit(1)
  }
  if ((shoppingList.length > 0 || ingredients.length > 0) && !shoppingBase) {
    console.error('Airtable Shopping no configurado (AIRTABLE_PAT, AIRTABLE_BASE_ID o AIRTABLE_BASE_ID_SHOPPING). No se puede crear Shopping List.')
    process.exit(1)
  }

  if (ingredients.length > 0) {
    const existing = await fetchTable(TABLE_INGREDIENTS, 500, recipesBase)
    const byName = new Map(existing.map((r) => [normalizeName(r.Name), r]))
    for (const item of ingredients) {
      const name = (item.Name && String(item.Name).trim()) || null
      if (!name) continue
      if (byName.has(normalizeName(name))) {
        console.log('Ingredient ya existe:', name)
        continue
      }
      const fields = { Name: name, ...mapIngredientFields(item) }
      const created = await createRecord(TABLE_INGREDIENTS, fields, recipesBase)
      byName.set(normalizeName(name), created)
      console.log('Ingredient creado:', created.Name, created.id)
    }
  }

  // Asegurar que todos los ingredientes tengan entrada en shoppingList (por Name)
  const shoppingNames = new Set(shoppingList.map((item) => normalizeName((item.Name && String(item.Name).trim()) || '')).filter(Boolean))
  const ingredientToShoppingCategory = {
    Vegetable: 'Fruits & Vegs',
    Fruit: 'Fruits & Vegs',
    Meat: 'Meat & Fish',
    Dairy: 'Other',
    Grain: 'Other',
    Spice: 'Herbs & Condiments',
    Herb: 'Herbs & Condiments',
    Condiment: 'Herbs & Condiments',
    Other: 'Other',
  }
  for (const ing of ingredients) {
    const name = (ing.Name && String(ing.Name).trim()) || null
    if (!name || shoppingNames.has(normalizeName(name))) continue
    const cat = ing.Category && ingredientToShoppingCategory[ing.Category] ? ingredientToShoppingCategory[ing.Category] : 'Other'
    shoppingList = shoppingList.concat([{
      Name: name,
      'Name ES': (ing['Name ES'] && String(ing['Name ES']).trim()) || name,
      Quantity: 1,
      Unit: (ing.Unit && SHOPPING_UNITS.has(String(ing.Unit).trim())) ? String(ing.Unit).trim() : 'pcs',
      Status: 'Need',
      Priority: 'Low',
      Category: cat,
    }])
    shoppingNames.add(normalizeName(name))
  }

  for (const item of shoppingList) {
    const name = (item.Name && String(item.Name).trim()) || '(sin nombre)'
    const fields = { Name: name, ...mapShoppingFields(item) }
    const created = await createRecord(TABLE_SHOPPING, fields, shoppingBase)
    console.log('Shopping List creado:', created.Name, created.id)
  }

  console.log('Hecho.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
