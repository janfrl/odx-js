import type { ODataAsyncDataPromise, ODataEntitySet, ODataKey, ODataPublicConfig, ODataQuery, ODataService, ODataServiceRegistry, RegisteredServiceNames } from '@me-tools/odx-core'
import { useFetch, useRuntimeConfig } from '#imports'
import { $odata, flattenOData, stringifyQuery } from '@me-tools/odx-core'
import { useODataBasePath } from './useODataBasePath'

const RE_SINGLE_QUOTE = /'/g
const RE_LEADING_SLASHES = /^\/+/
const RE_TRAILING_SLASHES = /\/+$/
interface ODataFetchClient {
  <T>(path: string, options?: any): Promise<T>
}

/**
 * Composable for interacting with OData services.
 * Provides autocomplete for registered services and their entity sets via dot notation
 * or standard method calls.
 */
export function useOData(): ODataServiceRegistry
export function useOData<T extends RegisteredServiceNames>(service: T): T extends keyof ODataServiceRegistry ? ODataServiceRegistry[T] : ODataService
export function useOData(service?: string): any {
  const client = globalThis.$fetch as unknown as ODataFetchClient

  const formatStringKeyLiteral = (value: string): string => `'${encodeURIComponent(value).replace(RE_SINGLE_QUOTE, '\'\'')}'`

  const resolveServiceRoute = (serviceName: string): string => {
    const config = useRuntimeConfig()
    const publicConfig = config.public.odata as unknown as ODataPublicConfig
    const serviceConfig = publicConfig?.services?.find(s => s.name === serviceName)
    return serviceConfig?.route || serviceName
  }

  const normalizeUrlBase = (value: string): string => value.replace(RE_TRAILING_SLASHES, '')

  const joinUrlSegments = (base: string, ...segments: string[]): string => {
    const normalizedBase = normalizeUrlBase(base)
    const normalizedSegments = segments
      .filter(Boolean)
      .map(segment => segment.replace(RE_LEADING_SLASHES, '').replace(RE_TRAILING_SLASHES, ''))
      .filter(Boolean)

    return normalizedSegments.length > 0
      ? [normalizedBase, ...normalizedSegments].join('/')
      : normalizedBase
  }

  /**
   * Formats a single or composite key for OData URLs.
   */
  const formatKey = (key: ODataKey): string => {
    if (typeof key !== 'object') {
      return typeof key === 'string' ? formatStringKeyLiteral(key) : String(key)
    }
    return Object.entries(key)
      .map(([k, v]) => `${k}=${typeof v === 'string' ? formatStringKeyLiteral(v) : v}`)
      .join(',')
  }

  const createMethods = <TModel = unknown>(serviceName: string, entitySet?: string): ODataEntitySet<TModel> => {
    const basePath = useODataBasePath(serviceName)
    const isDirect = basePath.startsWith('http')

    let fullPath = ''
    if (isDirect) {
      fullPath = entitySet ? joinUrlSegments(basePath, entitySet) : normalizeUrlBase(basePath)
    }
    else {
      const route = resolveServiceRoute(serviceName)
      fullPath = entitySet ? joinUrlSegments(basePath, route, entitySet) : joinUrlSegments(basePath, route)
    }

    return {
      list: (query?: ODataQuery<TModel>, options?: unknown): ODataAsyncDataPromise<TModel[]> => {
        return useFetch(fullPath, {
          ...(options as any),
          query: stringifyQuery(query || {}),
          transform: (data: any) => flattenOData(data),
        }) as unknown as ODataAsyncDataPromise<TModel[]>
      },
      fetchList: (
        query?: ODataQuery<TModel>,
        options?: unknown,
      ): Promise<TModel[]> => $odata<TModel[]>(client, fullPath, 'GET', {
        ...(options as any),
        query: stringifyQuery(query || {}),
      }),

      fetchOne: (
        key: ODataKey,
        query?: ODataQuery<TModel>,
        options?: unknown,
      ): Promise<TModel> => {
        const itemPath = `${fullPath}(${formatKey(key)})`
        return $odata<TModel>(client, itemPath, 'GET', {
          ...(options as any),
          query: stringifyQuery(query || {}),
        })
      },

      get: (key: ODataKey, query?: ODataQuery<TModel>, options?: unknown): ODataAsyncDataPromise<TModel> => {
        const itemPath = `${fullPath}(${formatKey(key)})`
        return useFetch(itemPath, {
          ...(options as any),
          query: stringifyQuery(query || {}),
          transform: (data: any) => flattenOData(data),
        }) as unknown as ODataAsyncDataPromise<TModel>
      },

      create: (body: Partial<TModel>): Promise<TModel> =>
        $odata<TModel>(client, fullPath, 'POST', { body }),

      update: (key: ODataKey, body: Partial<TModel>): Promise<TModel> => {
        const itemPath = `${fullPath}(${formatKey(key)})`
        return $odata<TModel>(client, itemPath, 'PATCH', { body })
      },

      remove: (key: ODataKey): Promise<unknown> => {
        const itemPath = `${fullPath}(${formatKey(key)})`
        return $odata<unknown>(client, itemPath, 'DELETE')
      },
    }
  }

  const createServiceProxy = (serviceName: string): ODataService => {
    const rootMethods = createMethods(serviceName)
    return new Proxy(rootMethods as any, {
      get(target, prop) {
        if (prop === 'entitySet') {
          return (name: string) => createMethods(serviceName, name)
        }

        if (typeof prop === 'symbol' || prop === 'toJSON' || prop === 'then') {
          return undefined
        }

        if (prop in target) {
          return target[prop]
        }

        return createMethods(serviceName, prop as string)
      },
    })
  }

  // Handle useOData('MyService')
  if (service) {
    return createServiceProxy(service)
  }

  // Handle useOData().MyService.MyEntitySet
  return new Proxy({} as any, {
    get(target, prop) {
      if (typeof prop === 'symbol' || prop === 'toJSON' || prop === 'then') {
        return target[prop]
      }
      return createServiceProxy(prop as string)
    },
  })
}
