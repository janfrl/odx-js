import { defineEventHandler } from '#imports'
// @ts-ignore
import { getODataLogs, clearODataLogs } from '../utils/dev-logs'

export default defineEventHandler((event) => {
  if (event.node.req.method === 'DELETE') {
    clearODataLogs()
    return { success: true }
  }
  return getODataLogs()
})
