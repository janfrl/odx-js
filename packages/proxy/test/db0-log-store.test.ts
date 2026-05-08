import type { ODataProxyConfig } from '@bc8-odx/core'
import type { ResolvedOdxLogStoreConfig } from '../src/utils/log-store'
import { addODataLog, clearODataLogs, getODataLog, getODataLogs, updateODataLog } from '@bc8-odx/core'
import { afterEach, describe, expect, it } from 'vitest'
import logsHandler from '../src/api/logs'
import { OdxDb0LogStore } from '../src/utils/db0-log-store'
import { configureOdxLogStore, resolveOdxLogStoreConfig } from '../src/utils/log-store'
import { DevToolsTracer } from '../src/utils/trace'

interface FakeRow {
  id: string
  timestamp: number
  service: string
  method: string
  status: number | null
  is_pending: number
  data: string
}

const originalNodeEnv = process.env.NODE_ENV

class FakeDb0Database {
  readonly rows = new Map<string, FakeRow>()
  readonly statements: string[] = []

  async sql<T = unknown>(strings: TemplateStringsArray, ...values: any[]): Promise<T> {
    const statement = strings.join('?').replace(/\s+/g, ' ').trim()
    const normalized = statement.toUpperCase()
    this.statements.push(statement)

    if (normalized.startsWith('CREATE TABLE')) {
      return { success: true } as T
    }

    if (normalized === 'DELETE FROM ODX_EXPLORER_LOGS') {
      this.rows.clear()
      return { success: true } as T
    }

    if (normalized.startsWith('DELETE FROM ODX_EXPLORER_LOGS WHERE ID =')) {
      this.rows.delete(String(values[0]))
      return { success: true } as T
    }

    if (normalized.startsWith('INSERT INTO ODX_EXPLORER_LOGS')) {
      const [id, timestamp, service, method, status, isPending, data] = values
      this.rows.set(String(id), {
        id: String(id),
        timestamp: Number(timestamp),
        service: String(service),
        method: String(method),
        status: status === null ? null : Number(status),
        is_pending: Number(isPending),
        data: String(data),
      })
      return { success: true } as T
    }

    if (normalized.startsWith('SELECT DATA FROM ODX_EXPLORER_LOGS WHERE ID =')) {
      return this.rows.get(String(values[0])) as T
    }

    if (normalized.startsWith('SELECT DATA FROM ODX_EXPLORER_LOGS')) {
      return this.sortedRows() as T
    }

    if (normalized.startsWith('SELECT ID FROM ODX_EXPLORER_LOGS')) {
      const offset = Number(values[0])
      return this.sortedRows().slice(offset).map(row => ({ id: row.id })) as T
    }

    throw new Error(`Unexpected SQL in fake db0 database: ${statement}`)
  }

  async dispose(): Promise<void> {}

  private sortedRows(): FakeRow[] {
    return [...this.rows.values()].sort((a, b) => b.timestamp - a.timestamp || b.id.localeCompare(a.id))
  }
}

function createConfig(id: string): ODataProxyConfig {
  return {
    basePath: '/api/odx',
    buildDir: '',
    rootDir: '',
    mode: 'sdk',
    services: [],
    devtools: {
      enabled: true,
      maxLogs: 2,
      logPayloads: true,
      maxPayloadBytes: 32,
      logStore: {
        provider: 'sql',
        sql: {
          connector: 'postgresql',
          url: `postgres://example.invalid/${id}`,
        },
      },
    },
  }
}

async function configureFakeStore(config: ODataProxyConfig, db = new FakeDb0Database()): Promise<FakeDb0Database> {
  await configureOdxLogStore(config, async (_resolved: ResolvedOdxLogStoreConfig) => {
    const store = new OdxDb0LogStore(db as any)
    await store.init()
    return store
  })
  return db
}

function createLogsEvent(method: string, config: ODataProxyConfig): any {
  return {
    method,
    path: '/__odx__/logs',
    context: {
      odataConfig: config,
      securityContext: {
        getLogonName: () => 'JDOE',
      },
    },
    node: {
      req: {
        url: '/__odx__/logs',
      },
    },
  }
}

describe('db0-backed Explorer log store', () => {
  afterEach(async () => {
    process.env.NODE_ENV = originalNodeEnv
    delete process.env.NUXT_ODATA_DEVTOOLS_LOG_STORE
    delete process.env.NUXT_ODATA_DEVTOOLS_LOG_DB_CONNECTOR
    delete process.env.NUXT_ODATA_DEVTOOLS_LOG_DB_URL
    delete process.env.NUXT_ODATA_DEVTOOLS_LOG_DB_PATH
    await configureOdxLogStore({ basePath: '/api/odx', buildDir: '', rootDir: '', mode: 'sdk', services: [] })
    await clearODataLogs()
  })

  it('keeps memory storage as the default and resolves SQL storage only when configured', () => {
    expect(resolveOdxLogStoreConfig().provider).toBe('memory')

    process.env.NUXT_ODATA_DEVTOOLS_LOG_STORE = 'sql'
    process.env.NUXT_ODATA_DEVTOOLS_LOG_DB_CONNECTOR = 'postgresql'
    process.env.NUXT_ODATA_DEVTOOLS_LOG_DB_URL = 'postgres://example.invalid/odx'

    expect(resolveOdxLogStoreConfig()).toEqual({
      provider: 'sql',
      sql: {
        connector: 'postgresql',
        url: 'postgres://example.invalid/odx',
        path: undefined,
      },
    })
  })

  it('initializes the db0 table and stores only sanitized bounded logs', async () => {
    const db = await configureFakeStore(createConfig('sanitize'))

    await addODataLog({
      id: 'secret-log',
      timestamp: 1,
      method: 'POST',
      url: '/api/odx/S/Products',
      service: 'S',
      requestHeaders: {
        'authorization': 'Bearer secret',
        'x-visible': 'visible',
      },
      requestBody: { value: 'x'.repeat(64) },
      responseBody: { ok: true },
      proxyTrace: [
        {
          timestamp: 1,
          duration: 0,
          label: 'Rules',
          message: 'Inject header',
          status: 'info',
          details: {
            name: 'x-api-key',
            value: 'api-secret',
          },
        },
      ],
    }, 10, { maxPayloadBytes: 16 })

    expect(db.statements[0]).toContain('CREATE TABLE IF NOT EXISTS odx_explorer_logs')
    const serialized = [...db.rows.values()][0]?.data || ''
    expect(serialized).not.toContain('Bearer secret')
    expect(serialized).not.toContain('api-secret')

    const [log] = await getODataLogs()
    expect(log?.requestHeaders?.authorization).toBe('[Redacted]')
    expect(log?.requestBody).toMatchObject({
      __odxPayload: 'truncated',
      maxBytes: 16,
    })
    expect(JSON.stringify(log?.proxyTrace?.[0]?.details)).not.toContain('api-secret')
  })

  it('supports persistent list, update, get, retention, and clear flows', async () => {
    await configureFakeStore(createConfig('flows'))

    await addODataLog({ id: 'old-a', timestamp: 10, method: 'GET', url: '/a', service: 'A', status: 200 }, 10)
    await addODataLog({ id: 'new-a', timestamp: 20, method: 'POST', url: '/a', service: 'A', status: 500 }, 10)
    await addODataLog({ id: 'pending-b', timestamp: 30, method: 'GET', url: '/b', service: 'B', isPending: true }, 2)

    expect((await getODataLogs()).map(log => log.id)).toEqual(['pending-b', 'new-a'])
    expect((await getODataLogs({ service: 'A', status: 'failure' })).map(log => log.id)).toEqual(['new-a'])

    await updateODataLog('pending-b', { status: 204, isPending: false })
    expect(await getODataLog('pending-b')).toMatchObject({
      id: 'pending-b',
      status: 204,
      isPending: false,
    })

    await clearODataLogs({ service: 'A' })

    expect((await getODataLogs()).map(log => log.id)).toEqual(['pending-b'])
  })

  it('allows production Explorer list and clear when persistent storage is configured', async () => {
    process.env.NODE_ENV = 'production'
    const config = createConfig('production-api')
    await configureFakeStore(config)
    await addODataLog({
      id: 'production-log',
      timestamp: 1,
      method: 'GET',
      url: '/api/odx/S/Products',
      service: 'S',
    })

    const logs: any = await logsHandler(createLogsEvent('GET', config))
    expect(logs.map((log: any) => log.id)).toEqual(['production-log'])

    await logsHandler(createLogsEvent('DELETE', config))
    expect(await getODataLogs()).toEqual([])
  })

  it('enables production trace logging only for persistent storage and omits payload bodies', async () => {
    process.env.NODE_ENV = 'production'
    const config = createConfig('production-trace')
    await configureFakeStore(config)

    const event: any = {
      context: {
        odataConfig: config,
      },
      method: 'POST',
      path: '/api/odx/S/Products',
    }
    const tracer = new DevToolsTracer(event)

    expect(tracer.enabled).toBe(true)

    await tracer.initLog(
      event,
      'https://backend.example.test/Products',
      'S',
      'Products',
      { secret: 'request-payload' },
      { 'authorization': 'Bearer secret', 'x-visible': 'visible' },
    )
    await tracer.updateLog(200, { secret: 'response-payload' })

    const [log] = await getODataLogs()
    expect(log?.requestHeaders).toEqual({
      'authorization': '[Redacted]',
      'x-visible': 'visible',
    })
    expect(log?.requestBody).toBeUndefined()
    expect(log?.responseBody).toBeUndefined()
    expect(JSON.stringify(log)).not.toContain('request-payload')
    expect(JSON.stringify(log)).not.toContain('response-payload')
    expect(JSON.stringify(log)).not.toContain('Bearer secret')
  })
})
