/**
 * Única función serverless para todas las rutas /api/*.
 * Vercel reescribe /api/:path* → /api?path=:path; aquí enrutamos al handler correspondiente.
 * Reduce el número de Serverless Functions para cumplir el límite del plan Hobby (12).
 */

import validateHandler from '../server/handlers/validate.js'
import habitsHandler from '../server/handlers/habits.js'
import objectivesHandler from '../server/handlers/objectives.js'
import tasksHandler from '../server/handlers/tasks.js'
import shoppingHandler from '../server/handlers/shopping.js'
import discoveryHandler from '../server/handlers/discovery.js'
import habitTrackingHandler from '../server/handlers/habit-tracking.js'
import keyResultsHandler from '../server/handlers/key-results.js'
import keyResultTrackingHandler from '../server/handlers/key-result-tracking.js'
import recipesHandler from '../server/handlers/recipes.js'
import ingredientsHandler from '../server/handlers/ingredients.js'
import recipeIngredientsHandler from '../server/handlers/recipe-ingredients.js'
import mealsHandler from '../server/handlers/meals.js'

const ROUTES = {
  validate: validateHandler,
  habits: habitsHandler,
  objectives: objectivesHandler,
  tasks: tasksHandler,
  shopping: shoppingHandler,
  discovery: discoveryHandler,
  'habit-tracking': habitTrackingHandler,
  'key-results': keyResultsHandler,
  'key-result-tracking': keyResultTrackingHandler,
  recipes: recipesHandler,
  ingredients: ingredientsHandler,
  'recipe-ingredients': recipeIngredientsHandler,
  meals: mealsHandler,
}

function getPathFromRequest(req) {
  const pathFromQuery = req.query?.path
  if (pathFromQuery != null) {
    const path = typeof pathFromQuery === 'string' ? pathFromQuery : pathFromQuery.join('/')
    return path.replace(/^\/+/, '')
  }
  const url = req.url || ''
  const pathname = url.split('?')[0].replace(/\/$/, '')
  return pathname.replace(/^\/api\/?/, '')
}

function buildUrl(pathSegments, req) {
  const path = pathSegments.join('/')
  const other = { ...req.query }
  delete other.path
  const qs = new URLSearchParams(other).toString()
  return '/api/' + path + (qs ? '?' + qs : '')
}

export default async function handler(req, res) {
  const pathStr = getPathFromRequest(req)
  const pathSegments = pathStr.split('/').filter(Boolean)
  const resource = pathSegments[0]

  const routeHandler = resource ? ROUTES[resource] : null
  if (!routeHandler) {
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = 404
    res.end(JSON.stringify({ error: 'Not found', path: pathStr || '(empty)' }))
    return
  }

  // Los handlers esperan req.url como /api/resource/id; la reescritura deja path en query
  const originalUrl = req.url
  req.url = buildUrl(pathSegments, req)
  try {
    await routeHandler(req, res)
  } finally {
    req.url = originalUrl
  }
}
