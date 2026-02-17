import { defineEventHandler } from '#imports'
// @ts-ignore
import { getODataLogs } from '../utils/dev-logs'

export default defineEventHandler(() => {
  return getODataLogs()
})
