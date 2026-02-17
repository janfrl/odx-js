import { useFetch, useODataBasePath } from '#imports'
import { $odata } from '../utils/odata'

type ODataQuery = Record<string, string | number | boolean | null | undefined>
type ODataBody = Record<string, unknown> | FormData | Blob | ArrayBufferView | ArrayBuffer | null

export function useOData(service: string) {
  const basePath = useODataBasePath()
  return {
    list: <T = unknown>(query?: ODataQuery) =>
      useFetch<T[]>(`${basePath}/${service}`, { query }),

    get: <T = unknown>(key: string | number, query?: ODataQuery) =>
      useFetch<T>(`${basePath}/${service}`, {
        query: { id: key, ...query },
      }),

    create: <T = unknown>(body: ODataBody) =>
      $odata<T>(service, 'POST', { body }),

    update: <T = unknown>(key: string | number, body: ODataBody) =>
      $odata<T>(service, 'PATCH', {
        query: { id: key },
        body,
      }),

    remove: <T = unknown>(key: string | number) =>
      $odata<T>(service, 'DELETE', {
        query: { id: key },
      }),
  }
}
