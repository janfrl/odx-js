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

const DEFAULT_MAX_LOGS = 100
const logs: ODataLog[] = []

export function addODataLog(log: ODataLog, maxLogs = DEFAULT_MAX_LOGS): void {
  logs.unshift(log)
  if (logs.length > maxLogs) {
    logs.pop()
  }
}

export function getODataLogs(): ODataLog[] {
  return logs
}

export function clearODataLogs(): void {
  logs.length = 0
}
