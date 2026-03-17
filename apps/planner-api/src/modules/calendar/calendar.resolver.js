import { listEventsFromAllCalendars } from './googleCalendar.js'

export function calendarResolvers(_repos, deps = { listEventsFromAllCalendars }) {
  return {
    Query: {
      async calendarEvents(_, { timeMin, timeMax }) {
        return await deps.listEventsFromAllCalendars(timeMin, timeMax)
      },
    },
  }
}

