import { objectiveFromRecord, keyResultFromRecord } from '../../shared/mappers.js'

function toObjectiveFields(input, forCreate) {
  const fields = {}
  if (input.objectiveName != null) fields['Objective Name'] = input.objectiveName
  if (input.status != null) fields.Status = input.status
  if (input.description != null) fields.Description = input.description
  if (input.category != null) fields.Category = input.category
  if (input.priority != null) fields.Priority = input.priority
  if (input.startDate != null) fields['Start Date'] = input.startDate
  if (input.targetDate != null) fields['Target Date'] = input.targetDate
  if (input.clientLastModified != null && !forCreate) fields.clientLastModified = input.clientLastModified
  return fields
}

function toKeyResultFields(input, forCreate) {
  const fields = {}
  if (input.keyResultName != null) fields['Key Result Name'] = input.keyResultName
  if (input.status != null) fields.Status = input.status
  if (input.description != null) fields.Description = input.description
  if (input.metric != null) fields.Metric = input.metric
  if (input.currentValue != null) fields['Current Value'] = input.currentValue
  if (input.targetValue != null) fields['Target Value'] = input.targetValue
  if (input.unit != null) fields.Unit = input.unit
  if (input.deadline != null) fields.Deadline = input.deadline
  if (input.progressPercent != null) fields['Progress (%)'] = input.progressPercent
  if (input.objectiveLink != null) fields['Objective Link'] = input.objectiveLink
  if (input.clientLastModified != null && !forCreate) fields.clientLastModified = input.clientLastModified
  return fields
}

export function okrResolvers(repos) {
  const objectives = repos.objectives
  const keyResults = repos.keyResults
  return {
    Query: {
      async objectives() {
        const list = await objectives.list()
        return list.map(objectiveFromRecord)
      },
      async objective(_, { id }) {
        const r = await objectives.getById(id)
        return objectiveFromRecord(r)
      },
      async keyResults() {
        const list = await keyResults.list()
        return list.map(keyResultFromRecord)
      },
      async keyResult(_, { id }) {
        const r = await keyResults.getById(id)
        return keyResultFromRecord(r)
      },
    },
    Mutation: {
      async createObjective(_, { input }) {
        const { clientLastModified, ...rest } = toObjectiveFields(input, true)
        const r = await objectives.create(rest)
        return objectiveFromRecord(r)
      },
      async updateObjective(_, { id, input }) {
        const { clientLastModified, ...update } = toObjectiveFields(input, false)
        const r = await objectives.update(id, update, { clientLastModified })
        return objectiveFromRecord(r)
      },
      async deleteObjective(_, { id }) {
        await objectives.delete(id)
        return true
      },
      async createKeyResult(_, { input }) {
        const { clientLastModified, ...rest } = toKeyResultFields(input, true)
        const r = await keyResults.create(rest)
        return keyResultFromRecord(r)
      },
      async updateKeyResult(_, { id, input }) {
        const { clientLastModified, ...update } = toKeyResultFields(input, false)
        const r = await keyResults.update(id, update, { clientLastModified })
        return keyResultFromRecord(r)
      },
      async deleteKeyResult(_, { id }) {
        await keyResults.delete(id)
        return true
      },
    },
  }
}
