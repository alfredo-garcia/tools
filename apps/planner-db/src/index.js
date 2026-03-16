/**
 * planner-db: data layer for planner apps. Repository interfaces and Airtable implementations.
 * planner-api uses this package; switch backend via DATA_BACKEND=airtable|postgres (postgres later).
 */
export * from './interfaces.js'

export { createAirtableTasksRepository } from './airtable/AirtableTasksRepository.js'
export { createAirtableHabitsRepository } from './airtable/AirtableHabitsRepository.js'
export { createAirtableHabitTrackingRepository } from './airtable/AirtableHabitTrackingRepository.js'
export { createAirtableObjectivesRepository } from './airtable/AirtableObjectivesRepository.js'
export { createAirtableKeyResultsRepository } from './airtable/AirtableKeyResultsRepository.js'
export { createAirtableMealsRepository } from './airtable/AirtableMealsRepository.js'
export { createAirtableRecipesRepository } from './airtable/AirtableRecipesRepository.js'
export { createAirtableIngredientsRepository } from './airtable/AirtableIngredientsRepository.js'
export { createAirtableShoppingRepository } from './airtable/AirtableShoppingRepository.js'
export { createAirtableDiscoveryRepository } from './airtable/AirtableDiscoveryRepository.js'

import { createAirtableTasksRepository } from './airtable/AirtableTasksRepository.js'
import { createAirtableHabitsRepository } from './airtable/AirtableHabitsRepository.js'
import { createAirtableHabitTrackingRepository } from './airtable/AirtableHabitTrackingRepository.js'
import { createAirtableObjectivesRepository } from './airtable/AirtableObjectivesRepository.js'
import { createAirtableKeyResultsRepository } from './airtable/AirtableKeyResultsRepository.js'
import { createAirtableMealsRepository } from './airtable/AirtableMealsRepository.js'
import { createAirtableRecipesRepository } from './airtable/AirtableRecipesRepository.js'
import { createAirtableIngredientsRepository } from './airtable/AirtableIngredientsRepository.js'
import { createAirtableShoppingRepository } from './airtable/AirtableShoppingRepository.js'
import { createAirtableDiscoveryRepository } from './airtable/AirtableDiscoveryRepository.js'

const backend = process.env.DATA_BACKEND || 'airtable'

/**
 * Returns repository instances for the configured backend (airtable or postgres).
 * Postgres repos are loaded dynamically so `pg` is only required when DATA_BACKEND=postgres.
 * @returns {Promise<import('./interfaces.js').PlannerRepositories>}
 */
export async function getRepositoriesAsync() {
  if (backend === 'postgres') {
    const [
      { createPostgresTasksRepository },
      { createPostgresHabitsRepository },
      { createPostgresHabitTrackingRepository },
      { createPostgresObjectivesRepository },
      { createPostgresKeyResultsRepository },
      { createPostgresMealsRepository },
      { createPostgresRecipesRepository },
      { createPostgresIngredientsRepository },
      { createPostgresShoppingRepository },
      { createPostgresDiscoveryRepository },
    ] = await Promise.all([
      import('./postgres/PostgresTasksRepository.js'),
      import('./postgres/PostgresHabitsRepository.js'),
      import('./postgres/PostgresHabitTrackingRepository.js'),
      import('./postgres/PostgresObjectivesRepository.js'),
      import('./postgres/PostgresKeyResultsRepository.js'),
      import('./postgres/PostgresMealsRepository.js'),
      import('./postgres/PostgresRecipesRepository.js'),
      import('./postgres/PostgresIngredientsRepository.js'),
      import('./postgres/PostgresShoppingRepository.js'),
      import('./postgres/PostgresDiscoveryRepository.js'),
    ])
    return {
      tasks: createPostgresTasksRepository(),
      habits: createPostgresHabitsRepository(),
      habitTracking: createPostgresHabitTrackingRepository(),
      objectives: createPostgresObjectivesRepository(),
      keyResults: createPostgresKeyResultsRepository(),
      meals: createPostgresMealsRepository(),
      recipes: createPostgresRecipesRepository(),
      ingredients: createPostgresIngredientsRepository(),
      shopping: createPostgresShoppingRepository(),
      discovery: createPostgresDiscoveryRepository(),
    }
  }
  return getRepositories()
}

/**
 * Returns repository instances (sync). Use Airtable only; for Postgres use getRepositoriesAsync().
 * @returns {import('./interfaces.js').PlannerRepositories}
 */
export function getRepositories() {
  if (backend === 'postgres') {
    throw new Error('Postgres backend requires getRepositoriesAsync() from @tools/planner-db. Use async initialization in planner-api.')
  }
  return {
    tasks: createAirtableTasksRepository(),
    habits: createAirtableHabitsRepository(),
    habitTracking: createAirtableHabitTrackingRepository(),
    objectives: createAirtableObjectivesRepository(),
    keyResults: createAirtableKeyResultsRepository(),
    meals: createAirtableMealsRepository(),
    recipes: createAirtableRecipesRepository(),
    ingredients: createAirtableIngredientsRepository(),
    shopping: createAirtableShoppingRepository(),
    discovery: createAirtableDiscoveryRepository(),
  }
}
