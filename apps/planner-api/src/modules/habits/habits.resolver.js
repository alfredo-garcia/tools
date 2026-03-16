import { habitFromRecord, habitTrackingFromRecord } from '../../shared/mappers.js'

export function habitsResolvers(repos) {
  const habits = repos.habits
  const habitTracking = repos.habitTracking
  return {
    Query: {
      async habits() {
        const list = await habits.list()
        return list.map(habitFromRecord)
      },
      async habit(_, { id }) {
        const list = await habits.list()
        const r = list.find((x) => x.id === id) ?? null
        return habitFromRecord(r)
      },
      async habitTracking() {
        const list = await habitTracking.list()
        return list.map(habitTrackingFromRecord)
      },
    },
    Mutation: {
      async toggleHabit(_, { input }) {
        const r = await habitTracking.create({ habitId: input.habitId, date: input.date })
        return habitTrackingFromRecord(r)
      },
      async updateHabitTracking(_, { id, input }) {
        const opts = input.clientLastModified ? { clientLastModified: input.clientLastModified } : {}
        const r = await habitTracking.update(id, { wasSuccessful: input.wasSuccessful }, opts)
        return habitTrackingFromRecord(r)
      },
      async deleteHabitTracking(_, { id }) {
        await habitTracking.delete(id)
        return true
      },
    },
  }
}
