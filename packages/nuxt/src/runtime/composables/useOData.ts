import { useFetch, useODataBasePath } from '#imports'
import { $odata } from '@bc8-odx/core'
import type { ODataService, ODataEntitySet, ODataServiceRegistry } from '@bc8-odx/core'

type ODataQuery = Record<string, string | number | boolean | null | undefined>
type ODataBody = Record<string, unknown> | FormData | Blob | ArrayBufferView | ArrayBuffer | null

/**
 * Composable for interacting with OData services.
 * Provides autocomplete for registered services and their entity sets.
 */
export function useOData<T extends keyof ODataServiceRegistry | (string & Record<never, never>)>(
  service: T,
): T extends keyof ODataServiceRegistry ? ODataServiceRegistry[T] : ODataService {
  const basePath = useODataBasePath()
  const client = globalThis.$fetch

  const createMethods = (entitySet?: string): ODataEntitySet => {
    const path = entitySet ? `${service}/${entitySet}` : service
    const fullPath = `${basePath}/${path}`

    return {
      list: <R = any>(query?: ODataQuery): any =>
        useFetch<R[]>(fullPath, { query }),

      get: <R = any>(key: string | number, query?: ODataQuery): any => {
        const itemPath = `${fullPath}(${typeof key === 'string' ? `'${key}'` : key})`
        return useFetch<R>(itemPath, { query })
      },

      create: <R = any>(body: ODataBody): Promise<R> =>
        $odata<R>(client, fullPath, 'POST', { body }),

      update: <R = any>(key: string | number, body: ODataBody): Promise<R> => {
        const itemPath = `${fullPath}(${typeof key === 'string' ? `'${key}'` : key})`
        return $odata<R>(client, itemPath, 'PATCH', { body })
      },

      remove: <R = any>(key: string | number): Promise<R> => {
        const itemPath = `${fullPath}(${typeof key === 'string' ? `'${key}'` : key})`
        return $odata<R>(client, itemPath, 'DELETE')
      },
    }
  }

  const serviceMethods = {
    ...createMethods(),
    entities: (name: string): ODataEntitySet => createMethods(name),
  }

  return serviceMethods as any
}
