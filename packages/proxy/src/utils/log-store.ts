import type { ODataProxyConfig } from '@me-tools/odx-core'
import type { Connector } from 'db0'
import process from 'node:process'
import { resetOdxLogStore, setOdxLogStore } from '@me-tools/odx-core'
import { createDatabase } from 'db0'
import { OdxDb0LogStore } from './db0-log-store'

export interface ResolvedOdxLogStoreConfig {
  provider: 'memory' | 'sql'
  sql?: {
    connector: 'postgresql' | 'sqlite'
    url?: string
    path?: string
  }
}

let activeSignature = JSON.stringify({ provider: 'memory' })

function env(name: string): string | undefined {
  const value = process.env[name]
  return value && value.length > 0 ? value : undefined
}

export function resolveOdxLogStoreConfig(config?: ODataProxyConfig): ResolvedOdxLogStoreConfig {
  const configured = config?.devtools?.logStore
  const provider = (env('NUXT_ODATA_DEVTOOLS_LOG_STORE') || configured?.provider || 'memory').toLowerCase()
  const url = env('NUXT_ODATA_DEVTOOLS_LOG_DB_URL') || configured?.sql?.url
  const path = env('NUXT_ODATA_DEVTOOLS_LOG_DB_PATH') || configured?.sql?.path
  const rawConnector = env('NUXT_ODATA_DEVTOOLS_LOG_DB_CONNECTOR') || configured?.sql?.connector
  const connector = rawConnector || (url ? 'postgresql' : path ? 'sqlite' : undefined)

  if (provider !== 'sql') {
    return { provider: 'memory' }
  }

  if (connector !== 'postgresql' && connector !== 'sqlite') {
    throw new Error('ODX persistent log storage requires NUXT_ODATA_DEVTOOLS_LOG_DB_CONNECTOR=postgresql or sqlite')
  }

  if (connector === 'postgresql' && !url) {
    throw new Error('ODX PostgreSQL log storage requires NUXT_ODATA_DEVTOOLS_LOG_DB_URL')
  }

  if (connector === 'sqlite' && !path) {
    throw new Error('ODX SQLite log storage requires NUXT_ODATA_DEVTOOLS_LOG_DB_PATH')
  }

  return {
    provider: 'sql',
    sql: {
      connector,
      url,
      path,
    },
  }
}

export function isPersistentOdxLogStoreConfigured(config?: ODataProxyConfig): boolean {
  return resolveOdxLogStoreConfig(config).provider === 'sql'
}

export async function configureOdxLogStore(config?: ODataProxyConfig, factory = createSqlLogStore): Promise<void> {
  const resolved = resolveOdxLogStoreConfig(config)
  const signature = JSON.stringify(resolved)

  if (signature === activeSignature)
    return

  if (resolved.provider === 'memory') {
    resetOdxLogStore()
    activeSignature = signature
    return
  }

  const store = await factory(resolved)
  setOdxLogStore(store)
  activeSignature = signature
}

async function createSqlLogStore(config: ResolvedOdxLogStoreConfig): Promise<OdxDb0LogStore> {
  const connector = await createDb0Connector(config)
  const db = createDatabase(connector)
  const store = new OdxDb0LogStore(db)
  await store.init()
  return store
}

async function createDb0Connector(config: ResolvedOdxLogStoreConfig): Promise<Connector> {
  if (config.sql?.connector === 'postgresql') {
    const moduleName = 'db0/connectors/postgresql'
    const { default: postgresqlConnector } = await import(moduleName)
    return postgresqlConnector({ url: config.sql.url })
  }

  const moduleName = 'db0/connectors/node-sqlite'
  const { default: sqliteConnector } = await import(moduleName)
  return sqliteConnector({ path: config.sql?.path })
}
