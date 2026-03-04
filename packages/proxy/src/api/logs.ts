import { clearODataLogs, getODataLogs } from '@bc8-odx/core'
import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
  if (event.method === 'DELETE') {
    return clearODataLogs()
  }
  return getODataLogs()
})
