import { useFetch, useODataBasePath } from '#imports'
import { $odata } from '@bc8-odx/core'
import type { ODataService, ODataEntitySet, ODataServiceRegistry } from '@bc8-odx/core'

type ODataQuery = Record<string, string | number | boolean | null | undefined>
type ODataBody = Record<string, unknown> | FormData | Blob | ArrayBufferView | ArrayBuffer | null

export function useOData<T extends keyof ODataServiceRegistry | string>(
  service: T,
): T extends keyof ODataServiceRegistry ? ODataServiceRegistry[T] : ODataService {
  const basePath = useODataBasePath()
  const client = globalThis.$fetch

  const createMethods = (entitySet?: string): ODataEntitySet => {
    const path = entitySet ? `${service}/${entitySet}` : service
    const fullPath = `${basePath}/${path}`

    return {
      list: <T = unknown>(query?: ODataQuery): any =>
        useFetch<T[]>(fullPath, { query }),

      get: <T = unknown>(key: string | number, query?: ODataQuery): any => {
        const itemPath = `${fullPath}(${typeof key === 'string' ? `'${key}'` : key})`
        return useFetch<T>(itemPath, { query })
      },

      create: <T = unknown>(body: ODataBody): Promise<T> =>
        $odata<T>(client, fullPath, 'POST', { body }),

      update: <T = unknown>(key: string | number, body: ODataBody): Promise<T> => {
        const itemPath = `${fullPath}(${typeof key === 'string' ? `'${key}'` : key})`
        return $odata<T>(client, itemPath, 'PATCH', { body })
      },

      remove: <T = unknown>(key: string | number): Promise<T> => {
        const itemPath = `${fullPath}(${typeof key === 'string' ? `'${key}'` : key})`
        return $odata<T>(client, itemPath, 'DELETE')
      },
    }
  }

  return {
    ...createMethods(),
    entities: (name: string): ODataEntitySet => createMethods(name),
  } as any
}
