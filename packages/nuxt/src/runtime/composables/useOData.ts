import type { ODataAsyncDataPromise, ODataEntitySet, ODataKey, ODataQuery, ODataService, ODataServiceRegistry, RegisteredServiceNames } from '@bc8-odx/core'
import { useFetch } from '#imports'
import { $odata, stringifyQuery } from '@bc8-odx/core'
import { useODataBasePath } from './useODataBasePath'

/**
 * Composable for interacting with OData services.
 * Provides autocomplete for registered services and their entity sets.
 */
export function useOData<T extends RegisteredServiceNames>(
  service: T,
): T extends keyof ODataServiceRegistry ? ODataServiceRegistry[T] : ODataService {
  const basePath = useODataBasePath(service as string)
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

  const createMethods = <TModel = unknown>(entitySet?: string): ODataEntitySet<TModel> => {
    const isDirect = basePath.startsWith('http')

    let fullPath = ''
    if (isDirect) {
      fullPath = entitySet ? `${basePath}/${entitySet}` : basePath
    }
    else {
      const path = entitySet ? `${service as string}/${entitySet}` : (service as string)
      fullPath = `${basePath}/${path}`
    }

    return {
      list: (query?: ODataQuery<TModel>, options?: unknown): ODataAsyncDataPromise<TModel[]> => {
        return useFetch(fullPath, { ...(options as any), query: stringifyQuery(query || {}) }) as unknown as ODataAsyncDataPromise<TModel[]>
      },

      get: (key: ODataKey, query?: ODataQuery<TModel>, options?: unknown): ODataAsyncDataPromise<TModel> => {
        const itemPath = `${fullPath}(${formatKey(key)})`
        return useFetch(itemPath, { ...(options as any), query: stringifyQuery(query || {}) }) as unknown as ODataAsyncDataPromise<TModel>
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

  const serviceMethods = {
    ...createMethods(),
    entities: (name: string): ODataEntitySet<any> => createMethods(name),
  }

  return serviceMethods as unknown as (T extends keyof ODataServiceRegistry ? ODataServiceRegistry[T] : ODataService)
}
