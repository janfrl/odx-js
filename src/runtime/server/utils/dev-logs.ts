import { useRuntimeConfig } from '#imports'

// Simple in-memory log storage for development
export interface ODataLog {
  id: string
  timestamp: number
  method: string
  url: string
  service: string
  entitySet?: string
  status?: number
  duration?: number
  requestBody?: any
  responseBody?: any
}

const logs: ODataLog[] = []

export function addODataLog(log: ODataLog) {
  const config = useRuntimeConfig()
  const maxLogs = config.odata?.devtools?.maxLogs ?? 100

  logs.unshift(log)
  while (logs.length > maxLogs) {
    logs.pop()
  }
}

export function getODataLogs() {
  return logs
}

export function clearODataLogs() {
  logs.length = 0
}
