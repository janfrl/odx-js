import type { Dispatcher, ProxyAgent } from 'undici'
import type { ResolvedProxyTarget } from './target'
import { createHash } from 'node:crypto'

type Connectivity = NonNullable<ResolvedProxyTarget['connectivity']>

interface CachedDispatcher {
  dispatcher: ProxyAgent
  evictionTimer: ReturnType<typeof setTimeout>
}

const DISPATCHER_TTL_MS = 60_000
const dispatcherCache = new Map<string, CachedDispatcher>()

function createCacheKey(connectivity: Connectivity): string {
  const tokenHash = createHash('sha256').update(connectivity.token).digest('hex')
  return `${connectivity.host}:${connectivity.port}:${tokenHash}`
}

export async function resolveConnectivityRequest(connectivity: Connectivity | undefined): Promise<{
  dispatcher?: Dispatcher
  headers?: Record<string, string>
  fetch?: typeof globalThis.fetch
}> {
  if (!connectivity)
    return {}

  const { ProxyAgent, fetch: undiciFetch } = await import('undici')

  const cacheKey = createCacheKey(connectivity)
  let cached = dispatcherCache.get(cacheKey)
  if (!cached) {
    const dispatcher = new ProxyAgent({
      uri: `http://${connectivity.host}:${connectivity.port}`,
      token: `Bearer ${connectivity.token}`,
    })
    const evictionTimer = setTimeout(() => {
      const entry = dispatcherCache.get(cacheKey)
      if (entry?.dispatcher === dispatcher) {
        dispatcherCache.delete(cacheKey)
        void dispatcher.close()
      }
    }, DISPATCHER_TTL_MS)
    evictionTimer.unref?.()
    cached = { dispatcher, evictionTimer }
    dispatcherCache.set(cacheKey, cached)
  }

  const headers = connectivity.userToken
    ? { 'sap-connectivity-authentication': `Bearer ${connectivity.userToken}` }
    : undefined

  return {
    dispatcher: cached.dispatcher,
    headers,
    fetch: undiciFetch as unknown as typeof globalThis.fetch,
  }
}
