/**
 * Repository interfaces for planner-db. Implementations (Airtable, Postgres) must satisfy these contracts.
 * Used by planner-api; domain types align with @tools/shared-planner where applicable.
 */

/**
 * @typedef {Object} TasksRepository
 * @property {() => Promise<Object[]>} list
 * @property {(id: string) => Promise<Object|null>} getById
 * @property {(fields: Object) => Promise<Object>} create
 * @property {(id: string, fields: Object, opts?: { clientLastModified?: string }) => Promise<Object>} update
 * @property {(id: string) => Promise<void>} delete
 */

/**
 * @typedef {Object} HabitsRepository
 * @property {() => Promise<Object[]>} list
 */

/**
 * @typedef {Object} HabitTrackingRepository
 * @property {() => Promise<Object[]>} list
 * @property {(input: { habitId: string, date: string }) => Promise<Object>} create
 * @property {(id: string, fields: { wasSuccessful: boolean }, opts?: { clientLastModified?: string }) => Promise<Object>} update
 * @property {(id: string) => Promise<void>} delete
 */

/**
 * @typedef {Object} ObjectivesRepository
 * @property {() => Promise<Object[]>} list
 * @property {(id: string) => Promise<Object|null>} getById
 * @property {(fields: Object) => Promise<Object>} create
 * @property {(id: string, fields: Object, opts?: { clientLastModified?: string }) => Promise<Object>} update
 * @property {(id: string) => Promise<void>} delete
 */

/**
 * @typedef {Object} KeyResultsRepository
 * @property {() => Promise<Object[]>} list
 * @property {(id: string) => Promise<Object|null>} getById
 * @property {(fields: Object) => Promise<Object>} create
 * @property {(id: string, fields: Object, opts?: { clientLastModified?: string }) => Promise<Object>} update
 * @property {(id: string) => Promise<void>} delete
 */

/**
 * @typedef {Object} MealsRepository
 * @property {() => Promise<Object[]>} list
 * @property {(id: string) => Promise<Object|null>} getById
 * @property {(fields: Object) => Promise<Object>} create
 * @property {(id: string, fields: Object, opts?: { clientLastModified?: string }) => Promise<Object>} update
 * @property {(id: string) => Promise<void>} delete
 */

/**
 * @typedef {Object} RecipesRepository
 * @property {() => Promise<Object[]>} list
 * @property {(id: string) => Promise<Object|null>} getById
 * @property {(fields: Object) => Promise<Object>} create
 * @property {(id: string, fields: Object, opts?: { clientLastModified?: string }) => Promise<Object>} update
 * @property {(id: string) => Promise<void>} delete
 */

/**
 * @typedef {Object} IngredientsRepository
 * @property {() => Promise<Object[]>} list
 * @property {(id: string) => Promise<Object|null>} getById
 * @property {(fields: Object) => Promise<Object>} create
 * @property {(id: string, fields: Object, opts?: { clientLastModified?: string }) => Promise<Object>} update
 * @property {(id: string) => Promise<void>} delete
 */

/**
 * @typedef {Object} RecipeIngredientsRepository
 * @property {() => Promise<Object[]>} list
 * @property {(id: string) => Promise<Object|null>} getById
 * @property {(fields: Object) => Promise<Object>} create
 * @property {(id: string, fields: Object, opts?: { clientLastModified?: string }) => Promise<Object>} update
 * @property {(id: string) => Promise<void>} delete
 */

/**
 * @typedef {Object} ShoppingRepository
 * @property {() => Promise<Object[]>} list
 * @property {(id: string) => Promise<Object|null>} getById
 * @property {(fields: Object) => Promise<Object>} create
 * @property {(id: string, fields: Object, opts?: { clientLastModified?: string }) => Promise<Object>} update
 * @property {(id: string) => Promise<void>} delete
 */

/**
 * @typedef {Object} DiscoveryRepository
 * @property {() => Promise<Object[]>} list
 * @property {(id: string) => Promise<Object|null>} getById
 * @property {(fields: Object) => Promise<Object>} create
 * @property {(id: string, fields: Object, opts?: { clientLastModified?: string }) => Promise<Object>} update
 * @property {(id: string) => Promise<void>} delete
 */

/**
 * @typedef {Object} PlannerRepositories
 * @property {TasksRepository} tasks
 * @property {HabitsRepository} habits
 * @property {HabitTrackingRepository} habitTracking
 * @property {ObjectivesRepository} objectives
 * @property {KeyResultsRepository} keyResults
 * @property {MealsRepository} meals
 * @property {RecipesRepository} recipes
 * @property {IngredientsRepository} ingredients
 * @property {RecipeIngredientsRepository} recipeIngredients
 * @property {ShoppingRepository} shopping
 * @property {DiscoveryRepository} discovery
 */
