import { taskFromRecord } from '../../shared/mappers.js'

function toTaskCreateFields(input) {
  const fields = { 'Task Name': input.taskName }
  if (input.status != null) fields.Status = input.status
  if (input.description != null) fields.Description = input.description
  if (input.dueDate != null) fields['Due Date'] = input.dueDate
  if (input.priority != null) fields.Priority = input.priority
  if (input.assignee != null) fields.Assignee = input.assignee
  if (input.category != null) fields.Category = input.category
  if (input.keyResults != null) fields['Key Results'] = input.keyResults
  if (input.objectives != null) fields.Objectives = input.objectives
  return fields
}

function toTaskUpdateFields(input) {
  const fields = {}
  if (input.taskName != null) fields['Task Name'] = input.taskName
  if (input.status != null) fields.Status = input.status
  if (input.description != null) fields.Description = input.description
  if (input.dueDate != null) fields['Due Date'] = input.dueDate
  if (input.priority != null) fields.Priority = input.priority
  if (input.assignee != null) fields.Assignee = input.assignee
  if (input.category != null) fields.Category = input.category
  if (input.keyResults != null) fields['Key Results'] = input.keyResults
  if (input.objectives != null) fields.Objectives = input.objectives
  if (input.clientLastModified != null) fields.clientLastModified = input.clientLastModified
  return fields
}

export function tasksResolvers(repos) {
  const tasks = repos.tasks
  return {
    Query: {
      async tasks() {
        const list = await tasks.list()
        return list.map(taskFromRecord)
      },
      async task(_, { id }) {
        const r = await tasks.getById(id)
        return taskFromRecord(r)
      },
    },
    Mutation: {
      async createTask(_, { input }) {
        const fields = toTaskCreateFields(input)
        const r = await tasks.create(fields)
        return taskFromRecord(r)
      },
      async updateTask(_, { id, input }) {
        const { clientLastModified, ...update } = toTaskUpdateFields(input)
        const r = await tasks.update(id, update, { clientLastModified })
        return taskFromRecord(r)
      },
      async deleteTask(_, { id }) {
        await tasks.delete(id)
        return true
      },
    },
  }
}
