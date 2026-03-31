// Simple in-memory log storage for development
export interface ProxyTraceEntry {
  timestamp: number
  duration: number // ms since start of request
  label: string
  message: string
  details?: any
  status?: 'success' | 'error' | 'info'
}

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
  isPending?: boolean
  requestBody?: any
  requestHeaders?: Record<string, string>
  responseBody?: any
  proxyTrace?: ProxyTraceEntry[]
}

const DEFAULT_MAX_LOGS = 100
const logs: ODataLog[] = []

export function addODataLog(log: ODataLog, maxLogs = DEFAULT_MAX_LOGS): void {
  logs.unshift(log)
  if (logs.length > maxLogs) {
    logs.pop()
  }
}

/**
 * Updates an existing OData log entry by its ID.
 */
export function updateODataLog(id: string, updates: Partial<ODataLog>): void {
  const index = logs.findIndex(l => l.id === id)
  if (index !== -1) {
    logs[index] = { ...logs[index], ...updates }
  }
}

export function getODataLogs(): ODataLog[] {
  return logs
}

export function clearODataLogs(): void {
  logs.length = 0
}
