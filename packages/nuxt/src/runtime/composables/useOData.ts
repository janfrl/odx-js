import type { ODataEntitySet, ODataKey, ODataService, ODataServiceRegistry, RegisteredServiceNames } from '@bc8-odx/core'
import { $odata } from '@bc8-odx/core'
import { useFetch } from 'nuxt/app'
import { useODataBasePath } from './useODataBasePath'

type ODataQuery = Record<string, string | number | boolean | null | undefined>
type ODataBody = Record<string, unknown> | FormData | Blob | ArrayBufferView | ArrayBuffer | null

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

  const createMethods = (entitySet?: string): ODataEntitySet => {
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
      list: (query?: ODataQuery, options?: any): any =>
        useFetch(fullPath, { ...options, query }),

      get: (key: ODataKey, query?: ODataQuery, options?: any): any => {
        const itemPath = `${fullPath}(${formatKey(key)})`
        return useFetch(itemPath, { ...options, query })
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
