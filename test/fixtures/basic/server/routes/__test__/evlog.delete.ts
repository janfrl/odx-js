import { clearMemoryLogs } from 'evlog/memory'
import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  clearMemoryLogs('odx-integration')
  return { cleared: true }
})
