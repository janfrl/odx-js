// Simple in-memory log storage for development
export interface ODataLog {
  id: string
  timestamp: number
  method: string
  url: string
  targetUrl?: string
  service: string
  entitySet?: string
  status?: number
  duration?: number
  requestBody?: any
  requestHeaders?: Record<string, string>
  responseBody?: any
}

const MAX_LOGS = 100
const logs: ODataLog[] = []

export function addODataLog(log: ODataLog) {
  logs.unshift(log)
  if (logs.length > MAX_LOGS) {
    logs.pop()
  }
}

export function getODataLogs() {
  return logs
}

export function clearODataLogs() {
  logs.length = 0
}
