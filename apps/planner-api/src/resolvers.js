import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getRepositories } from '@tools/planner-db'
import { tasksResolvers } from './modules/tasks/tasks.resolver.js'
import { habitsResolvers } from './modules/habits/habits.resolver.js'
import { okrResolvers } from './modules/okr/okr.resolver.js'
import { mealsResolvers } from './modules/meals/meals.resolver.js'
import { recipesResolvers } from './modules/recipes/recipes.resolver.js'
import { shoppingResolvers } from './modules/shopping/shopping.resolver.js'
import { discoveryResolvers } from './modules/discovery/discovery.resolver.js'
import { summaryResolvers } from './modules/summary/summary.resolver.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const repos = getRepositories()

function mergeResolvers(resolverMaps) {
  const merged = { Query: {}, Mutation: {} }
  for (const map of resolverMaps) {
    if (map.Query) {
      for (const [key, fn] of Object.entries(map.Query)) merged.Query[key] = fn
    }
    if (map.Mutation) {
      for (const [key, fn] of Object.entries(map.Mutation)) merged.Mutation[key] = fn
    }
  }
  return merged
}

export function getSchema() {
  return readFileSync(join(__dirname, 'schema.graphql'), 'utf8')
}

export function getResolvers() {
  return mergeResolvers([
    tasksResolvers(repos),
    habitsResolvers(repos),
    okrResolvers(repos),
    mealsResolvers(repos),
    recipesResolvers(repos),
    shoppingResolvers(repos),
    discoveryResolvers(repos),
    summaryResolvers(repos),
  ])
}
