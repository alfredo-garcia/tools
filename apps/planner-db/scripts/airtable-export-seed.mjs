#!/usr/bin/env node
import 'dotenv/config'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import Airtable from 'airtable'
import { uuidFromAirtableId } from '../src/lib/seedIds.js'
import { asDate, asNumber, asString, asTextArray, mapLinkArrayToUuids } from '../src/lib/seedNormalize.js'

function requireEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is required`)
  return v
}

function getBase(baseId) {
  const pat = requireEnv('AIRTABLE_PAT')
  if (!baseId) throw new Error('baseId is required')
  return new Airtable({ apiKey: pat }).base(baseId)
}

async function fetchAll(base, tableName) {
  const results = []
  await base(tableName)
    .select({})
    .eachPage(
      (records, next) => {
        for (const r of records) {
          const lastModified =
            (r.fields && r.fields['Last Modified Time']) ||
            (typeof r._rawJson !== 'undefined' && r._rawJson?.lastModifiedTime) ||
            undefined
          results.push({
            id: r.id,
            ...r.fields,
            ...(lastModified && { lastModified }),
          })
        }
        next()
      },
      (err) => {
        if (err) throw err
      }
    )
  return results
}

function mapRecordCommon(r) {
  return {
    id: uuidFromAirtableId(r.id),
    last_modified: r.lastModified ? new Date(r.lastModified).toISOString() : null,
  }
}

function mapTasks(records) {
  const tasksKrField = process.env.AIRTABLE_TASKS_KR_FIELD || 'Key Result'
  return records.map((r) => ({
    ...mapRecordCommon(r),
    task_name: asString(r['Task Name']),
    status: asString(r.Status),
    description: asString(r.Description),
    due_date: asDate(r['Due Date']),
    priority: asString(r.Priority),
    assignee: asString(r.Assignee),
    category: asString(r.Category),
    key_results: mapLinkArrayToUuids(r['Key Results'] ?? r[tasksKrField]),
    objectives: mapLinkArrayToUuids(r.Objectives),
  }))
}

function mapObjectives(records) {
  return records.map((r) => ({
    ...mapRecordCommon(r),
    objective_name: asString(r['Objective Name']),
    status: asString(r.Status) ?? 'Pending',
    description: asString(r.Description),
    category: asString(r.Category),
    priority: asString(r.Priority),
    start_date: asDate(r['Start Date']),
    target_date: asDate(r['Target Date']),
  }))
}

function mapKeyResults(records) {
  return records.map((r) => ({
    ...mapRecordCommon(r),
    key_result_name: asString(r['Key Result Name']),
    status: asString(r.Status) ?? 'Not Started',
    description: asString(r.Description),
    metric: asString(r.Metric),
    current_value: asNumber(r['Current Value']),
    target_value: asNumber(r['Target Value']),
    unit: asString(r.Unit),
    deadline: asDate(r.Deadline),
    progress_percent: asNumber(r['Progress (%)']),
    objective_link: mapLinkArrayToUuids(r['Objective Link'] ?? r.Objective),
  }))
}

function mapHabits(records) {
  return records.map((r) => ({
    ...mapRecordCommon(r),
    name: asString(r.Name ?? r['Habit Name']),
    description: asString(r.Description),
    frequency: asString(r.Frequency),
  }))
}

function mapHabitTracking(records) {
  return records.map((r) => {
    const habitRaw = r.Habit
    const habitId =
      Array.isArray(habitRaw) ? habitRaw[0] : typeof habitRaw === 'string' ? habitRaw : null
    const execution = r['Execution Date-Time']
    return {
      ...mapRecordCommon(r),
      habit_id: habitId ? uuidFromAirtableId(habitId) : null,
      execution_date_time: execution ? new Date(execution).toISOString() : null,
      was_successful: Boolean(r['Was Successful?']),
    }
  })
}

function mapMeals(records) {
  return records.map((r) => ({
    ...mapRecordCommon(r),
    meal_type: asString(r['Meal Type']),
    date: asDate(r.Date),
    meal: asString(r.Meal ?? r.Recipe),
  }))
}

function mapShopping(records) {
  return records.map((r) => ({
    ...mapRecordCommon(r),
    name: asString(r.Name),
    category: asString(r.Category),
    description: asString(r.Description),
    image_web: asString(r['Image (Web)']),
    name_es: asString(r['Name ES']),
    notes: asString(r.Notes),
    priority: asString(r.Priority),
    quantity: asNumber(r.Quantity),
    status: asString(r.Status),
    store: asString(r.Store),
    unit: asString(r.Unit),
  }))
}

function mapDiscovery(records) {
  const objectivesField = process.env.AIRTABLE_DISCOVERY_OBJECTIVES_FIELD || 'Objetives'
  return records.map((r) => ({
    ...mapRecordCommon(r),
    idea_name: asString(r['Idea Name']),
    idea_description: asString(r['Idea Description']),
    category: asString(r.Category),
    status: asString(r.Status),
    priority: asString(r.Priority),
    date_added: asDate(r['Date Added']),
    objectives: mapLinkArrayToUuids(r.Objectives ?? r.Objective ?? r[objectivesField]),
  }))
}

function mapRecipes(records) {
  return records.map((r) => ({
    ...mapRecordCommon(r),
    name: asString(r.Name),
    name_es: asString(r['Name ES']),
    description: asString(r.Description),
    meal_type: asTextArray(r['Meal Type']),
    cooking_process: asString(r['Cooking Process']),
    complexity_rating: asNumber(r['Complexity Rating']),
    nutrient_rating: asNumber(r['Nutrient Rating']),
    time_to_cook_minutes: r['Time to Cook (minutes)'] == null ? null : asNumber(r['Time to Cook (minutes)']),
    servings: r.Servings == null ? null : asNumber(r.Servings),
    cuisine_type: asString(r['Cuisine Type']),
    source_url: asString(r['Source/URL']),
    tags: asString(r.Tags),
  }))
}

function mapIngredients(records) {
  return records.map((r) => ({
    ...mapRecordCommon(r),
    name: asString(r.Name),
    name_es: asString(r['Name ES']),
    description: asString(r.Description),
    category: asString(r.Category),
    unit: asString(r.Unit),
    notes: asString(r.Notes),
  }))
}

function mapRecipeIngredients(records) {
  return records.map((r) => {
    const recipeRaw = r.Recipe
    const ingRaw = r.Ingredient
    const recipeId = Array.isArray(recipeRaw) ? recipeRaw[0] : recipeRaw
    const ingredientId = Array.isArray(ingRaw) ? ingRaw[0] : ingRaw
    return {
      ...mapRecordCommon(r),
      recipe_id: recipeId ? uuidFromAirtableId(recipeId) : null,
      ingredient_id: ingredientId ? uuidFromAirtableId(ingredientId) : null,
      quantity: asNumber(r.Quantity),
      unit: asString(r.Unit),
      optional_ingredient: Boolean(r['Optional Ingredient']),
      notes: asString(r.Notes),
    }
  })
}

function parseArgs(argv) {
  const out = { outDir: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--outDir') out.outDir = argv[++i]
  }
  return out
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outDir = resolve(args.outDir || join(process.cwd(), 'apps/planner-db/seeds', stamp))
  mkdirSync(outDir, { recursive: true })

  const plannerBaseId = requireEnv('AIRTABLE_BASE_ID')
  const shoppingBaseId = process.env.AIRTABLE_BASE_ID_SHOPPING || plannerBaseId
  const recipesBaseId = requireEnv('AIRTABLE_BASE_ID_RECIPES')

  const tables = {
    objectives: { baseId: plannerBaseId, table: process.env.AIRTABLE_TABLE_OBJECTIVES || 'Objectives', map: mapObjectives, file: 'objectives.json' },
    key_results: { baseId: plannerBaseId, table: process.env.AIRTABLE_TABLE_KEY_RESULTS || 'Key Results', map: mapKeyResults, file: 'key_results.json' },
    tasks: { baseId: plannerBaseId, table: process.env.AIRTABLE_TABLE_TASKS || 'Tasks', map: mapTasks, file: 'tasks.json' },
    habits: { baseId: plannerBaseId, table: process.env.AIRTABLE_TABLE_HABITS || 'Habits', map: mapHabits, file: 'habits.json' },
    habit_tracking: { baseId: plannerBaseId, table: process.env.AIRTABLE_TABLE_HABIT_TRACKING || 'Habit Tracking', map: mapHabitTracking, file: 'habit_tracking.json' },
    meals: { baseId: plannerBaseId, table: process.env.AIRTABLE_TABLE_MEALS || 'Meals', map: mapMeals, file: 'meals.json' },
    discovery_ideas: { baseId: plannerBaseId, table: process.env.AIRTABLE_TABLE_DISCOVERY || 'Discovery Ideas', map: mapDiscovery, file: 'discovery_ideas.json' },
    shopping_items: { baseId: shoppingBaseId, table: process.env.AIRTABLE_TABLE_SHOPPING || 'Shopping List', map: mapShopping, file: 'shopping_items.json' },
    recipes: { baseId: recipesBaseId, table: process.env.AIRTABLE_TABLE_RECIPES || 'Recipes', map: mapRecipes, file: 'recipes.json' },
    ingredients: { baseId: recipesBaseId, table: process.env.AIRTABLE_TABLE_INGREDIENTS || 'Ingredients', map: mapIngredients, file: 'ingredients.json' },
    recipe_ingredients: { baseId: recipesBaseId, table: process.env.AIRTABLE_TABLE_RECIPE_INGREDIENTS || 'Recipe Ingredients', map: mapRecipeIngredients, file: 'recipe_ingredients.json' },
  }

  const meta = { outDir, exportedAt: new Date().toISOString(), tables: {} }

  for (const [key, t] of Object.entries(tables)) {
    const base = getBase(t.baseId)
    const raw = await fetchAll(base, t.table)
    const mapped = t.map(raw)
    writeFileSync(join(outDir, t.file), JSON.stringify(mapped, null, 2) + '\n', 'utf8')
    meta.tables[key] = { table: t.table, baseId: t.baseId, count: mapped.length }
  }

  writeFileSync(join(outDir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8')
  const latestDir = resolve(join(process.cwd(), 'apps/planner-db/seeds/latest'))
  mkdirSync(latestDir, { recursive: true })
  writeFileSync(join(latestDir, 'README.txt'), `Latest export is in: ${outDir}\n`, 'utf8')
  console.log(`Exported seeds to ${outDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

