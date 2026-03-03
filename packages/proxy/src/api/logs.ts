import { defineEventHandler } from 'h3'
import { clearODataLogs, getODataLogs } from '../utils/dev-logs.ts'

export default defineEventHandler((event) => {
  if (event.method === 'DELETE') {
    return clearODataLogs()
  }
  return getODataLogs()
})
