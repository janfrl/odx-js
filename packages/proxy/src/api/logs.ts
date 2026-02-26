import { defineEventHandler } from 'h3'
import { clearODataLogs, getODataLogs } from '../utils/dev-logs'

export default defineEventHandler((event) => {
  if (event.node.req.method === 'DELETE') {
    clearODataLogs()
    return { success: true }
  }
  return getODataLogs()
})
