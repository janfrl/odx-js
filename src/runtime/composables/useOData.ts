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

      get: <T = unknown>(key: string | number, query?: ODataQuery) =>
        useFetch<T>(fullPath, {
          query: { id: key, ...query },
        }),

      create: <T = unknown>(body: ODataBody) =>
        $odata<T>(service, 'POST', { body, entitySet }),

      update: <T = unknown>(key: string | number, body: ODataBody) =>
        $odata<T>(service, 'PATCH', {
          query: { id: key },
          body,
          entitySet,
        }),

      remove: <T = unknown>(key: string | number) =>
        $odata<T>(service, 'DELETE', {
          query: { id: key },
          entitySet,
        }),
    }
  }

  return {
    ...createMethods(),
    entities: (name: string) => createMethods(name),
  }
}
