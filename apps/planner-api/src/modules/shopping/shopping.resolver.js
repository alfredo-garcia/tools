import { shoppingItemFromRecord } from '../../shared/mappers.js'

function toShoppingFields(input, forCreate) {
  const fields = {}
  if (input.name != null) fields.Name = input.name
  if (input.category != null) fields.Category = input.category
  if (input.description != null) fields.Description = input.description
  if (input.imageWeb != null) fields['Image (Web)'] = input.imageWeb
  if (input.nameES != null) fields['Name ES'] = input.nameES
  if (input.notes != null) fields.Notes = input.notes
  if (input.priority != null) fields.Priority = input.priority
  if (input.quantity != null) fields.Quantity = input.quantity
  if (input.status != null) fields.Status = input.status
  if (input.store != null) fields.Store = input.store
  if (input.unit != null) fields.Unit = input.unit
  if (input.clientLastModified != null && !forCreate) fields.clientLastModified = input.clientLastModified
  return fields
}

export function shoppingResolvers(repos) {
  const shopping = repos.shopping
  return {
    Query: {
      async shopping() {
        const list = await shopping.list()
        return list.map(shoppingItemFromRecord)
      },
      async shoppingItem(_, { id }) {
        const r = await shopping.getById(id)
        return shoppingItemFromRecord(r)
      },
    },
    Mutation: {
      async createShoppingItem(_, { input }) {
        const { clientLastModified, ...rest } = toShoppingFields(input, true)
        const r = await shopping.create(rest)
        return shoppingItemFromRecord(r)
      },
      async updateShoppingItem(_, { id, input }) {
        const { clientLastModified, ...update } = toShoppingFields(input, false)
        const r = await shopping.update(id, update, { clientLastModified })
        return shoppingItemFromRecord(r)
      },
      async deleteShoppingItem(_, { id }) {
        await shopping.delete(id)
        return true
      },
    },
  }
}
