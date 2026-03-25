#!/usr/bin/env node
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import pg from 'pg'

const Pool = pg.Pool || (pg.default && pg.default.Pool)

function requireEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is required`)
  return v
}

function parseArgs(argv) {
  const out = { seedDir: null, dryRun: false, truncate: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--seedDir') out.seedDir = argv[++i]
    else if (a === '--dry-run') out.dryRun = true
    else if (a === '--truncate') out.truncate = true
  }
  return out
}

function readJson(path) {
  const raw = readFileSync(path, 'utf8')
  return JSON.parse(raw)
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function applySchema(client, schemaPath) {
  const sql = readFileSync(schemaPath, 'utf8')
  await client.query(sql)
}

function colsAndValues(rows, cols) {
  const values = []
  const placeholders = rows.map((r, rowIdx) => {
    const parts = cols.map((c, colIdx) => {
      values.push(r[c])
      return `$${rowIdx * cols.length + colIdx + 1}`
    })
    return `(${parts.join(', ')})`
  })
  return { values, placeholders }
}

async function upsertMany(client, table, cols, rows, { chunkSize = 200 } = {}) {
  if (!Array.isArray(rows) || rows.length === 0) return 0

  let total = 0
  for (const part of chunk(rows, chunkSize)) {
    const { values, placeholders } = colsAndValues(part, cols)
    const updateCols = cols.filter((c) => c !== 'id')
    const updateSet = updateCols.map((c) => `${c} = EXCLUDED.${c}`).join(', ')
    const sql = `INSERT INTO ${table} (${cols.join(', ')})
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (id) DO UPDATE SET ${updateSet}`
    const res = await client.query(sql, values)
    total += res.rowCount || 0
  }
  return total
}

async function truncateAll(client) {
  // Order matters for FK constraints.
  await client.query('TRUNCATE TABLE habit_tracking RESTART IDENTITY CASCADE')
  await client.query('TRUNCATE TABLE recipe_ingredients RESTART IDENTITY CASCADE')
  await client.query('TRUNCATE TABLE tasks RESTART IDENTITY CASCADE')
  await client.query('TRUNCATE TABLE key_results RESTART IDENTITY CASCADE')
  await client.query('TRUNCATE TABLE objectives RESTART IDENTITY CASCADE')
  await client.query('TRUNCATE TABLE meals RESTART IDENTITY CASCADE')
  await client.query('TRUNCATE TABLE habits RESTART IDENTITY CASCADE')
  await client.query('TRUNCATE TABLE shopping_items RESTART IDENTITY CASCADE')
  await client.query('TRUNCATE TABLE discovery_ideas RESTART IDENTITY CASCADE')
  await client.query('TRUNCATE TABLE recipes RESTART IDENTITY CASCADE')
  await client.query('TRUNCATE TABLE ingredients RESTART IDENTITY CASCADE')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const seedDir = resolve(args.seedDir || join(process.cwd(), 'apps/planner-db/seeds/latest'))
  const databaseUrl = requireEnv('DATABASE_URL')

  const pool = new Pool({ connectionString: databaseUrl })
  const client = await pool.connect()
  try {
    if (args.dryRun) {
      console.log(`[dry-run] Would import from ${seedDir}`)
      return
    }

    await client.query('BEGIN')
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto')
    await applySchema(client, join(process.cwd(), 'apps/planner-db/src/postgres/schema.sql'))

    if (args.truncate) await truncateAll(client)

    const objectives = readJson(join(seedDir, 'objectives.json'))
    const keyResults = readJson(join(seedDir, 'key_results.json'))
    const tasks = readJson(join(seedDir, 'tasks.json'))
    const habits = readJson(join(seedDir, 'habits.json'))
    const habitTracking = readJson(join(seedDir, 'habit_tracking.json'))
    const meals = readJson(join(seedDir, 'meals.json'))
    const discoveryIdeas = readJson(join(seedDir, 'discovery_ideas.json'))
    const shoppingItems = readJson(join(seedDir, 'shopping_items.json'))
    const recipes = readJson(join(seedDir, 'recipes.json'))
    const ingredients = readJson(join(seedDir, 'ingredients.json'))
    const recipeIngredients = readJson(join(seedDir, 'recipe_ingredients.json'))

    // Load order for FKs: recipes+ingredients → recipe_ingredients, habits → habit_tracking.
    await upsertMany(client, 'objectives', ['id', 'objective_name', 'status', 'description', 'category', 'priority', 'start_date', 'target_date', 'last_modified'], objectives)
    await upsertMany(client, 'key_results', ['id', 'key_result_name', 'status', 'description', 'metric', 'current_value', 'target_value', 'unit', 'deadline', 'progress_percent', 'objective_link', 'last_modified'], keyResults)
    await upsertMany(client, 'tasks', ['id', 'task_name', 'status', 'description', 'due_date', 'priority', 'assignee', 'category', 'key_results', 'objectives', 'last_modified'], tasks)
    await upsertMany(client, 'habits', ['id', 'name', 'description', 'frequency', 'last_modified'], habits)
    await upsertMany(client, 'habit_tracking', ['id', 'habit_id', 'execution_date_time', 'was_successful', 'last_modified'], habitTracking)
    await upsertMany(client, 'meals', ['id', 'meal_type', 'date', 'meal', 'last_modified'], meals)
    await upsertMany(client, 'discovery_ideas', ['id', 'idea_name', 'idea_description', 'category', 'status', 'priority', 'date_added', 'objectives', 'last_modified'], discoveryIdeas)
    await upsertMany(client, 'shopping_items', ['id', 'name', 'category', 'description', 'image_web', 'name_es', 'notes', 'priority', 'quantity', 'status', 'store', 'unit', 'last_modified'], shoppingItems)
    await upsertMany(client, 'recipes', ['id', 'name', 'name_es', 'description', 'meal_type', 'cooking_process', 'complexity_rating', 'nutrient_rating', 'time_to_cook_minutes', 'servings', 'cuisine_type', 'source_url', 'tags', 'last_modified'], recipes)
    await upsertMany(client, 'ingredients', ['id', 'name', 'name_es', 'description', 'category', 'unit', 'notes', 'last_modified'], ingredients)
    await upsertMany(client, 'recipe_ingredients', ['id', 'recipe_id', 'ingredient_id', 'quantity', 'unit', 'optional_ingredient', 'notes', 'last_modified'], recipeIngredients)

    await client.query('COMMIT')
    console.log(`Imported seed from ${seedDir}`)
  } catch (err) {
    try {
      await client.query('ROLLBACK')
    } catch {}
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

