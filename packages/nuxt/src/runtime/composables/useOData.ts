import type { ODataAsyncDataPromise, ODataEntitySet, ODataKey, ODataQuery, ODataService, ODataServiceRegistry, RegisteredServiceNames } from '@bc8-odx/core'
import { useFetch } from '#imports'
import { $odata, flattenOData, stringifyQuery } from '@bc8-odx/core'
import { useODataBasePath } from './useODataBasePath'

/**
 * Composable for interacting with OData services.
 * Provides autocomplete for registered services and their entity sets via dot notation
 * or standard method calls.
 */
export function useOData(): ODataServiceRegistry
export function useOData<T extends RegisteredServiceNames>(service: T): T extends keyof ODataServiceRegistry ? ODataServiceRegistry[T] : ODataService
export function useOData(service?: string): any {
  const client = globalThis.$fetch

  /**
   * Formats a single or composite key for OData URLs.
   */
  const formatKey = (key: ODataKey): string => {
    if (typeof key !== 'object') {
      return typeof key === 'string' ? `'${key}'` : String(key)
    }
    return Object.entries(key)
      .map(([k, v]) => `${k}=${typeof v === 'string' ? `'${v}'` : v}`)
      .join(',')
  }

  const createMethods = <TModel = unknown>(serviceName: string, entitySet?: string): ODataEntitySet<TModel> => {
    const basePath = useODataBasePath(serviceName)
    const isDirect = basePath.startsWith('http')

    let fullPath = ''
    if (isDirect) {
      fullPath = entitySet ? `${basePath}/${entitySet}` : basePath
    }
    else {
      const path = entitySet ? `${serviceName}/${entitySet}` : serviceName
      fullPath = `${basePath}/${path}`
    }

    return {
      list: (query?: ODataQuery<TModel>, options?: unknown): ODataAsyncDataPromise<TModel[]> => {
        return useFetch(fullPath, {
          ...(options as any),
          query: stringifyQuery(query || {}),
          transform: (data: any) => flattenOData(data),
        }) as unknown as ODataAsyncDataPromise<TModel[]>
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
