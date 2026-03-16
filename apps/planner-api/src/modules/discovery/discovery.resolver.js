import { discoveryFromRecord } from '../../shared/mappers.js'

function toDiscoveryFields(input, forCreate) {
  const fields = {}
  if (input.ideaName != null) fields['Idea Name'] = input.ideaName
  if (input.ideaDescription != null) fields['Idea Description'] = input.ideaDescription
  if (input.category != null) fields.Category = input.category
  if (input.status != null) fields.Status = input.status
  if (input.priority != null) fields.Priority = input.priority
  if (input.dateAdded != null) fields['Date Added'] = input.dateAdded
  if (input.objectives != null) fields.Objetives = Array.isArray(input.objectives) ? input.objectives : [input.objectives]
  if (input.clientLastModified != null && !forCreate) fields.clientLastModified = input.clientLastModified
  return fields
}

export function discoveryResolvers(repos) {
  const discovery = repos.discovery
  if (!discovery) {
    return {
      Query: {
        discovery: () => [],
        discoveryIdea: () => null,
      },
      Mutation: {},
    }
  }
  return {
    Query: {
      async discovery() {
        const list = await discovery.list()
        return list.map(discoveryFromRecord)
      },
      async discoveryIdea(_, { id }) {
        const r = await discovery.getById(id)
        return discoveryFromRecord(r)
      },
    },
    Mutation: {
      async createDiscoveryIdea(_, { input }) {
        const { clientLastModified, ...rest } = toDiscoveryFields(input, true)
        const r = await discovery.create(rest)
        return discoveryFromRecord(r)
      },
      async updateDiscoveryIdea(_, { id, input }) {
        const { clientLastModified, ...update } = toDiscoveryFields(input, false)
        const r = await discovery.update(id, update, { clientLastModified })
        return discoveryFromRecord(r)
      },
      async deleteDiscoveryIdea(_, { id }) {
        await discovery.delete(id)
        return true
      },
    },
  }
}
