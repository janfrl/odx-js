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

export interface OdxBoundedPayload {
  __odxPayload: 'truncated' | 'unserializable'
  originalBytes?: number
  maxBytes: number
  preview: string
}

export interface OdxLogPayloadPolicy {
  storePayloads?: boolean
  maxPayloadBytes?: number
}

export interface OdxLogAppendOptions {
  maxEntries?: number
  payload?: OdxLogPayloadPolicy
}

export interface OdxLogUpdateOptions {
  payload?: OdxLogPayloadPolicy
}

export interface OdxLogQueryOptions {
  limit?: number
  offset?: number
  service?: string
  method?: string
  status?: number | 'pending' | 'success' | 'failure'
  from?: number
  to?: number
  before?: number
  after?: number
  includePending?: boolean
  order?: 'asc' | 'desc'
}

export interface OdxLogClearOptions {
  service?: string
  before?: number
  to?: number
}

export type OdxMaybePromise<T> = T | Promise<T>

export interface OdxLogStore {
  append: (log: ODataLog, options?: OdxLogAppendOptions) => OdxMaybePromise<void>
  update: (id: string, updates: Partial<ODataLog>, options?: OdxLogUpdateOptions) => OdxMaybePromise<ODataLog | undefined>
  list: (options?: OdxLogQueryOptions) => OdxMaybePromise<ODataLog[]>
  get: (id: string) => OdxMaybePromise<ODataLog | undefined>
  clear: (options?: OdxLogClearOptions) => OdxMaybePromise<void>
}

const DEFAULT_MAX_LOGS = 100
const DEFAULT_MAX_PAYLOAD_BYTES = 32 * 1024
const REDACTED_HEADER_VALUE = '[Redacted]'

const SENSITIVE_HEADER_PATTERNS = [
  /^authorization$/i,
  /^proxy-authorization$/i,
  /^cookie$/i,
  /^set-cookie$/i,
  /^x-csrf-token$/i,
  /^x-xsrf-token$/i,
  /^csrf-token$/i,
  /^xsrf-token$/i,
  /^x-api-key$/i,
  /^api-key$/i,
  /^apikey$/i,
  /^x-subscription-key$/i,
  /^subscription-key$/i,
  /(^|[-_])token($|[-_])/i,
  /(^|[-_])secret($|[-_])/i,
  /(^|[-_])session($|[-_])/i,
  /^sap-session/i,
  /^x-sap-security-session/i,
]

function resolvePayloadPolicy(policy: OdxLogPayloadPolicy = {}): Required<OdxLogPayloadPolicy> {
  const maxPayloadBytes = Number.isFinite(policy.maxPayloadBytes) && policy.maxPayloadBytes! > 0
    ? Math.floor(policy.maxPayloadBytes!)
    : DEFAULT_MAX_PAYLOAD_BYTES

  return {
    storePayloads: policy.storePayloads !== false,
    maxPayloadBytes,
  }
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

function truncateByBytes(value: string, maxBytes: number): string {
  let preview = value
  while (byteLength(preview) > maxBytes && preview.length > 0) {
    preview = preview.slice(0, Math.max(0, Math.floor(preview.length * 0.8)))
  }
  return preview
}

function stringifyPayload(payload: any): { serialized: string, unserializable: boolean } {
  if (typeof payload === 'string') {
    return { serialized: payload, unserializable: false }
  }

  try {
    return { serialized: JSON.stringify(payload), unserializable: false }
  }
  catch {
    return { serialized: String(payload), unserializable: true }
  }
}

function cloneSerializable<T>(value: T): T {
  if (value === undefined || value === null)
    return value

  if (typeof value !== 'object')
    return value

  try {
    return JSON.parse(JSON.stringify(value)) as T
  }
  catch {
    return String(value) as T
  }
}

function cloneLog(log: ODataLog): ODataLog {
  return cloneSerializable(log)
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value! > 0
    ? Math.floor(value!)
    : fallback
}

function isSensitiveHeader(name: string): boolean {
  return SENSITIVE_HEADER_PATTERNS.some(pattern => pattern.test(name))
}

function isTraceHeaderValueKey(key: string): boolean {
  return key === 'actual' || key === 'deniedValue' || key === 'value'
}

function getTraceHeaderName(details: Record<string, any>): string | undefined {
  const headerName = details.header ?? details.name
  return typeof headerName === 'string' ? headerName : undefined
}

function sanitizeProxyTraceDetails(details: any): any {
  if (details === undefined || details === null)
    return details

  if (Array.isArray(details))
    return details.map(sanitizeProxyTraceDetails)

  if (typeof details !== 'object')
    return details

  const headerName = getTraceHeaderName(details)
  const hasSensitiveHeader = !!headerName && isSensitiveHeader(headerName)
  const isHeaderGuardTrace = details.policy === 'HeaderGuard'

  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => {
      if (isSensitiveHeader(key))
        return [key, REDACTED_HEADER_VALUE]

      if (isTraceHeaderValueKey(key) && (hasSensitiveHeader || (isHeaderGuardTrace && !headerName)))
        return [key, REDACTED_HEADER_VALUE]

      return [key, sanitizeProxyTraceDetails(value)]
    }),
  )
}

export function redactSensitiveHeaders(headers: Record<string, string> = {}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [
      name,
      isSensitiveHeader(name) ? REDACTED_HEADER_VALUE : value,
    ]),
  )
}

export function boundLogPayload(payload: any, policy: OdxLogPayloadPolicy = {}): any {
  const resolved = resolvePayloadPolicy(policy)
  if (!resolved.storePayloads || payload === undefined)
    return undefined

  const { serialized, unserializable } = stringifyPayload(payload)
  const size = byteLength(serialized)

  if (!unserializable && size <= resolved.maxPayloadBytes) {
    return cloneSerializable(payload)
  }

  return {
    __odxPayload: unserializable ? 'unserializable' : 'truncated',
    originalBytes: unserializable ? undefined : size,
    maxBytes: resolved.maxPayloadBytes,
    preview: truncateByBytes(serialized, resolved.maxPayloadBytes),
  } satisfies OdxBoundedPayload
}

export function sanitizeODataLog(log: ODataLog, policy: OdxLogPayloadPolicy = {}): ODataLog {
  return {
    ...cloneSerializable(log),
    requestHeaders: log.requestHeaders ? redactSensitiveHeaders(log.requestHeaders) : undefined,
    requestBody: boundLogPayload(log.requestBody, policy),
    responseBody: boundLogPayload(log.responseBody, policy),
    proxyTrace: log.proxyTrace?.map(entry => ({
      ...cloneSerializable(entry),
      details: boundLogPayload(sanitizeProxyTraceDetails(entry.details), policy),
    })),
  }
}

function filterLogs(logs: ODataLog[], options: OdxLogQueryOptions = {}): ODataLog[] {
  let result = [...logs]

  if (options.service) {
    const service = options.service.toLowerCase()
    result = result.filter(log => log.service.toLowerCase() === service)
  }

  if (options.method) {
    const method = options.method.toUpperCase()
    result = result.filter(log => log.method.toUpperCase() === method)
  }

  if (options.status !== undefined) {
    result = result.filter((log) => {
      if (options.status === 'pending')
        return !!log.isPending
      if (options.status === 'success')
        return !log.isPending && typeof log.status === 'number' && log.status < 400
      if (options.status === 'failure')
        return !log.isPending && typeof log.status === 'number' && log.status >= 400
      return log.status === options.status
    })
  }
  else if (options.includePending === false) {
    result = result.filter(log => !log.isPending)
  }

  if (options.from !== undefined)
    result = result.filter(log => log.timestamp >= options.from!)
  if (options.after !== undefined)
    result = result.filter(log => log.timestamp > options.after!)
  if (options.to !== undefined)
    result = result.filter(log => log.timestamp <= options.to!)
  if (options.before !== undefined)
    result = result.filter(log => log.timestamp < options.before!)

  if (options.order === 'asc') {
    result.sort((a, b) => a.timestamp - b.timestamp)
  }
  else {
    result.sort((a, b) => b.timestamp - a.timestamp)
  }

  const offset = normalizePositiveInteger(options.offset, 0)
  const limit = normalizePositiveInteger(options.limit, result.length)
  return result.slice(offset, offset + limit)
}

export class OdxMemoryLogStore implements OdxLogStore {
  private readonly logs: ODataLog[] = []

  constructor(private readonly defaults: OdxLogAppendOptions = {}) {}

  append(log: ODataLog, options: OdxLogAppendOptions = {}): void {
    const maxEntries = normalizePositiveInteger(options.maxEntries, normalizePositiveInteger(this.defaults.maxEntries, DEFAULT_MAX_LOGS))
    const payload = {
      ...this.defaults.payload,
      ...options.payload,
    }

    this.logs.unshift(sanitizeODataLog(log, payload))
    while (this.logs.length > maxEntries) {
      this.logs.pop()
    }
  }

  update(id: string, updates: Partial<ODataLog>, options: OdxLogUpdateOptions = {}): ODataLog | undefined {
    const index = this.logs.findIndex(log => log.id === id)
    if (index === -1)
      return undefined

    const payload = {
      ...this.defaults.payload,
      ...options.payload,
    }
    const updated = sanitizeODataLog({ ...this.logs[index], ...updates }, payload)
    this.logs[index] = updated
    return cloneLog(updated)
  }

  list(options: OdxLogQueryOptions = {}): ODataLog[] {
    return filterLogs(this.logs, options).map(cloneLog)
  }

  get(id: string): ODataLog | undefined {
    const log = this.logs.find(log => log.id === id)
    return log ? cloneLog(log) : undefined
  }

  clear(options: OdxLogClearOptions = {}): void {
    if (!options.service && options.before === undefined && options.to === undefined) {
      this.logs.length = 0
      return
    }

    const service = options.service?.toLowerCase()
    for (let index = this.logs.length - 1; index >= 0; index--) {
      const log = this.logs[index]!
      const matchesService = !service || log.service.toLowerCase() === service
      const matchesBefore = options.before === undefined || log.timestamp < options.before
      const matchesTo = options.to === undefined || log.timestamp <= options.to

      if (matchesService && matchesBefore && matchesTo) {
        this.logs.splice(index, 1)
      }
    }
  }
}

const defaultLogStore = new OdxMemoryLogStore()
let activeLogStore: OdxLogStore = defaultLogStore

export function getOdxLogStore(): OdxLogStore {
  return activeLogStore
}

export function setOdxLogStore(store: OdxLogStore): void {
  activeLogStore = store
}

export function resetOdxLogStore(): void {
  defaultLogStore.clear()
  activeLogStore = defaultLogStore
}

export function addODataLog(log: ODataLog, maxLogs = DEFAULT_MAX_LOGS, payload?: OdxLogPayloadPolicy): OdxMaybePromise<void> {
  return activeLogStore.append(log, { maxEntries: maxLogs, payload })
}

export function updateODataLog(id: string, updates: Partial<ODataLog>, payload?: OdxLogPayloadPolicy): OdxMaybePromise<ODataLog | undefined> {
  return activeLogStore.update(id, updates, { payload })
}

export function getODataLogs(options: OdxLogQueryOptions = {}): OdxMaybePromise<ODataLog[]> {
  return activeLogStore.list(options)
}

export function getODataLog(id: string): OdxMaybePromise<ODataLog | undefined> {
  return activeLogStore.get(id)
}

export function clearODataLogs(options: OdxLogClearOptions = {}): OdxMaybePromise<void> {
  return activeLogStore.clear(options)
}
