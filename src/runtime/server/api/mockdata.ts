import { defineEventHandler, readBody, useStorage, getQuery } from '#imports'

export default defineEventHandler(async (event) => {
  const storage = useStorage('odata:mockdata')
  const method = event.method
  const query = getQuery(event)
  const service = query.service as string
  const entitySet = query.entitySet as string

  if (!service || !entitySet) {
    throw new Error('Missing service or entitySet query parameters')
  }

  // Use colons for consistent unstorage keys (Service:EntitySet.json)
  const key = `${service}:${entitySet}.json`

  if (method === 'GET') {
    if (await storage.hasItem(key)) {
      return await storage.getItem(key)
    }
    return null
  }

  if (method === 'POST') {
    const body = await readBody(event)
    await storage.setItem(key, body)
    return { success: true }
  }

  if (method === 'DELETE') {
    await storage.removeItem(key)
    return { success: true }
  }
})
