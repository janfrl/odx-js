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
}

const MAX_LOGS = 50
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
