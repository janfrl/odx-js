import type {
  ODataLog,
  OdxLogAppendOptions,
  OdxLogClearOptions,
  OdxLogPayloadPolicy,
  OdxLogQueryOptions,
  OdxLogStore,
  OdxLogUpdateOptions,
} from '@me-tools/odx-core'
import type { Database } from 'db0'
import { sanitizeODataLog } from '@me-tools/odx-core'

interface StoredLogRow {
  id: string
  timestamp: number
  service: string
  method: string
  status: number | null
  is_pending: number
  data: string
}

const DEFAULT_MAX_LOGS = 100

function cloneLog(log: ODataLog): ODataLog {
  return JSON.parse(JSON.stringify(log)) as ODataLog
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value! > 0
    ? Math.floor(value!)
    : fallback
}

function serializeLog(log: ODataLog): string {
  return JSON.stringify(log)
}

function parseRow(row: unknown): ODataLog | undefined {
  const data = (row as Partial<StoredLogRow> | undefined)?.data
  if (typeof data !== 'string')
    return undefined

  try {
    return JSON.parse(data) as ODataLog
  }
  catch {
    return undefined
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

function mergePayloadPolicy(defaults: OdxLogPayloadPolicy | undefined, override: OdxLogPayloadPolicy | undefined): OdxLogPayloadPolicy {
  return {
    ...defaults,
    ...override,
  }
}

export class OdxDb0LogStore implements OdxLogStore {
  constructor(
    private readonly db: Pick<Database, 'sql' | 'dispose'>,
    private readonly defaults: OdxLogAppendOptions = {},
  ) {}

  async init(): Promise<void> {
    await this.db.sql`
      CREATE TABLE IF NOT EXISTS odx_explorer_logs (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        service TEXT NOT NULL,
        method TEXT NOT NULL,
        status INTEGER,
        is_pending INTEGER NOT NULL,
        data TEXT NOT NULL
      )
    `
  }

  async append(log: ODataLog, options: OdxLogAppendOptions = {}): Promise<void> {
    const payload = mergePayloadPolicy(this.defaults.payload, options.payload)
    const stored = sanitizeODataLog(log, payload)

    await this.replace(stored)
    await this.enforceRetention(normalizePositiveInteger(options.maxEntries, normalizePositiveInteger(this.defaults.maxEntries, DEFAULT_MAX_LOGS)))
  }

  async update(id: string, updates: Partial<ODataLog>, options: OdxLogUpdateOptions = {}): Promise<ODataLog | undefined> {
    const existing = await this.get(id)
    if (!existing)
      return undefined

    const payload = mergePayloadPolicy(this.defaults.payload, options.payload)
    const updated = sanitizeODataLog({ ...existing, ...updates }, payload)
    await this.replace(updated)
    return cloneLog(updated)
  }

  async list(options: OdxLogQueryOptions = {}): Promise<ODataLog[]> {
    const rows = await this.db.sql<StoredLogRow[]>`
      SELECT data
      FROM odx_explorer_logs
      ORDER BY timestamp DESC, id DESC
    `

    return filterLogs(rows.map(parseRow).filter((log): log is ODataLog => !!log), options).map(cloneLog)
  }

  async get(id: string): Promise<ODataLog | undefined> {
    const row = await this.db.sql<StoredLogRow | undefined>`
      SELECT data
      FROM odx_explorer_logs
      WHERE id = ${id}
    `
    const log = parseRow(row)
    return log ? cloneLog(log) : undefined
  }

  async clear(options: OdxLogClearOptions = {}): Promise<void> {
    if (!options.service && options.before === undefined && options.to === undefined) {
      await this.db.sql`DELETE FROM odx_explorer_logs`
      return
    }

    const logs = await this.list()
    const service = options.service?.toLowerCase()
    const ids = logs
      .filter((log) => {
        const matchesService = !service || log.service.toLowerCase() === service
        const matchesBefore = options.before === undefined || log.timestamp < options.before
        const matchesTo = options.to === undefined || log.timestamp <= options.to
        return matchesService && matchesBefore && matchesTo
      })
      .map(log => log.id)

    for (const id of ids) {
      await this.db.sql`
        DELETE FROM odx_explorer_logs
        WHERE id = ${id}
      `
    }
  }

  async dispose(): Promise<void> {
    await this.db.dispose()
  }

  private async replace(log: ODataLog): Promise<void> {
    await this.db.sql`
      DELETE FROM odx_explorer_logs
      WHERE id = ${log.id}
    `
    await this.db.sql`
      INSERT INTO odx_explorer_logs (
        id,
        timestamp,
        service,
        method,
        status,
        is_pending,
        data
      )
      VALUES (
        ${log.id},
        ${log.timestamp},
        ${log.service},
        ${log.method},
        ${log.status ?? null},
        ${log.isPending ? 1 : 0},
        ${serializeLog(log)}
      )
    `
  }

  private async enforceRetention(maxEntries: number): Promise<void> {
    const rows = await this.db.sql<Array<{ id: string }>>`
      SELECT id
      FROM odx_explorer_logs
      ORDER BY timestamp DESC, id DESC
      LIMIT 1000000 OFFSET ${maxEntries}
    `

    for (const row of rows) {
      await this.db.sql`
        DELETE FROM odx_explorer_logs
        WHERE id = ${row.id}
      `
    }
  }
}
