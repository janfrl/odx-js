import { useFetch, useODataBasePath } from '#imports'
import { $odata } from '@bc8-odx/core'
import type { ODataService, ODataEntitySet, ODataServiceRegistry, RegisteredServiceNames, ODataKey } from '@bc8-odx/core'

type ODataQuery = Record<string, string | number | boolean | null | undefined>
type ODataBody = Record<string, unknown> | FormData | Blob | ArrayBufferView | ArrayBuffer | null

/**
 * Composable for interacting with OData services.
 * Provides autocomplete for registered services and their entity sets.
 */
export function useOData<T extends RegisteredServiceNames>(
  service: T,
): T extends keyof ODataServiceRegistry ? ODataServiceRegistry[T] : ODataService {
  const basePath = useODataBasePath()
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

  const createMethods = (entitySet?: string): ODataEntitySet => {
    const path = entitySet ? `${service as string}/${entitySet}` : (service as string)
    const fullPath = `${basePath}/${path}`

    return {
      list: (query?: ODataQuery): any =>
        useFetch(fullPath, { query }),

      get: (key: ODataKey, query?: ODataQuery): any => {
        const itemPath = `${fullPath}(${formatKey(key)})`
        return useFetch(itemPath, { query })
      },

      create: (body: ODataBody): Promise<any> =>
        $odata<any>(client, fullPath, 'POST', { body }),

      update: (key: ODataKey, body: ODataBody): Promise<any> => {
        const itemPath = `${fullPath}(${formatKey(key)})`
        return $odata<any>(client, itemPath, 'PATCH', { body })
      },

      remove: (key: ODataKey): Promise<any> => {
        const itemPath = `${fullPath}(${formatKey(key)})`
        return $odata<any>(client, itemPath, 'DELETE')
      },
    }
  }

  const serviceMethods = {
    ...createMethods(),
    entities: (name: string): ODataEntitySet => createMethods(name),
  }

  return serviceMethods as any
}
