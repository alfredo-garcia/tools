/**
 * Map Airtable record (id + field names) to GraphQL type shape.
 */
export function taskFromRecord(r) {
  if (!r) return null
  return {
    id: r.id,
    taskName: r['Task Name'],
    status: r.Status,
    description: r.Description,
    dueDate: r['Due Date'],
    priority: r.Priority,
    assignee: r.Assignee,
    category: r.Category,
    keyResults: Array.isArray(r['Key Result']) ? r['Key Result'] : r['Key Results'] ?? [],
    objectives: r.Objectives ?? [],
    lastModified: r.lastModified,
  }
}

export function habitFromRecord(r) {
  if (!r) return null
  return {
    id: r.id,
    name: r.Name ?? r['Habit Name'],
    description: r.Description,
    frequency: r.Frequency,
    lastModified: r.lastModified,
  }
}

export function habitTrackingFromRecord(r) {
  if (!r) return null
  return {
    id: r.id,
    habitId: Array.isArray(r.Habit) ? r.Habit[0] : r.Habit,
    executionDateTime: r['Execution Date-Time'],
    wasSuccessful: r['Was Successful?'],
    lastModified: r.lastModified,
  }
}

export function objectiveFromRecord(r) {
  if (!r) return null
  return {
    id: r.id,
    objectiveName: r['Objective Name'],
    status: r.Status,
    description: r.Description,
    category: r.Category,
    priority: r.Priority,
    startDate: r['Start Date'],
    targetDate: r['Target Date'],
    lastModified: r.lastModified,
  }
}

export function keyResultFromRecord(r) {
  if (!r) return null
  return {
    id: r.id,
    keyResultName: r['Key Result Name'],
    status: r.Status,
    description: r.Description,
    metric: r.Metric,
    currentValue: r['Current Value'],
    targetValue: r['Target Value'],
    unit: r.Unit,
    deadline: r.Deadline,
    progressPercent: r['Progress (%)'],
    objectiveLink: r['Objective Link'] ?? [],
    lastModified: r.lastModified,
  }
}

export function mealFromRecord(r) {
  if (!r) return null
  return {
    id: r.id,
    mealType: r['Meal Type'],
    date: r.Date,
    meal: r.Meal,
    lastModified: r.lastModified,
  }
}

export function recipeFromRecord(r) {
  if (!r) return null
  return {
    id: r.id,
    name: r.Name,
    nameES: r['Name ES'],
    description: r.Description,
    mealType: r['Meal Type'] ?? [],
    cookingProcess: r['Cooking Process'],
    complexityRating: r['Complexity Rating'],
    nutrientRating: r['Nutrient Rating'],
    timeToCookMinutes: r['Time to Cook (minutes)'],
    servings: r.Servings,
    cuisineType: r['Cuisine Type'],
    sourceUrl: r['Source/URL'],
    tags: r.Tags,
    lastModified: r.lastModified,
  }
}

export function ingredientFromRecord(r) {
  if (!r) return null
  return {
    id: r.id,
    name: r.Name,
    nameES: r['Name ES'],
    description: r.Description,
    category: r.Category,
    unit: r.Unit,
    notes: r.Notes,
    lastModified: r.lastModified,
  }
}

export function shoppingItemFromRecord(r) {
  if (!r) return null
  return {
    id: r.id,
    name: r.Name,
    category: r.Category,
    description: r.Description,
    imageWeb: r['Image (Web)'],
    nameES: r['Name ES'],
    notes: r.Notes,
    priority: r.Priority,
    quantity: r.Quantity,
    status: r.Status,
    store: r.Store,
    unit: r.Unit,
    lastModified: r.lastModified,
  }
}

export function discoveryFromRecord(r) {
  if (!r) return null
  const objectives = r.Objetives ?? r.Objectives
  return {
    id: r.id,
    ideaName: r['Idea Name'],
    ideaDescription: r['Idea Description'],
    category: r.Category,
    status: r.Status,
    priority: r.Priority,
    dateAdded: r['Date Added'] ? String(r['Date Added']).slice(0, 10) : null,
    objectives: Array.isArray(objectives) ? objectives : objectives != null ? [objectives] : [],
    lastModified: r.lastModified,
  }
}
