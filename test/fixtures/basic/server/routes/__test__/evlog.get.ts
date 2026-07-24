import { readMemoryLogs } from 'evlog/memory'
import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  return readMemoryLogs({
    store: 'odx-integration',
    limit: 100,
  })
})
