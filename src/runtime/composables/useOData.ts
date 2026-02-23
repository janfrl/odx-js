import { useFetch, useODataBasePath } from '#imports'
import { $odata } from '../utils/odata'

type ODataQuery = Record<string, string | number | boolean | null | undefined>
type ODataBody = Record<string, unknown> | FormData | Blob | ArrayBufferView | ArrayBuffer | null

export function useOData(service: string) {
  const basePath = useODataBasePath()

  const createMethods = (entitySet?: string) => {
    const path = entitySet ? `${service}/${entitySet}` : service
    const fullPath = `${basePath}/${path}`

    return {
      list: <T = unknown>(query?: ODataQuery) =>
        useFetch<T[]>(fullPath, { query }),

      get: <T = unknown>(key: string | number, query?: ODataQuery) => {
        const itemPath = `${fullPath}(${typeof key === 'string' ? `'${key}'` : key})`
        return useFetch<T>(itemPath, { query })
      },

      create: <T = unknown>(body: ODataBody) =>
        $odata<T>(service, 'POST', { body, entitySet }),

      update: <T = unknown>(key: string | number, body: ODataBody) =>
        $odata<T>(`${service}/${entitySet}(${typeof key === 'string' ? `'${key}'` : key})`, 'PATCH', {
          body,
        }),

      remove: <T = unknown>(key: string | number) =>
        $odata<T>(`${service}/${entitySet}(${typeof key === 'string' ? `'${key}'` : key})`, 'DELETE'),
    }
  }

  return {
    ...createMethods(),
    entities: (name: string) => createMethods(name),
  }
}
