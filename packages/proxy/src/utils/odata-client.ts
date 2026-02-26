import type { NitroRuntimeConfig } from '../api/config'
import { useRequestHeaders, useRuntimeConfig } from 'nitropack/runtime'
import { ofetch } from 'ofetch'

export function createODataClient(): any {
  const config = useRuntimeConfig() as unknown as NitroRuntimeConfig
  const baseURL = config.public.odata?.basePath || '/api/sap-odata'

  return ofetch.create({
    baseURL,
    onRequest({ options }) {
      if (config.odata?.forwardAuthHeader) {
        const reqHeaders = useRequestHeaders(['authorization'])
        const auth = reqHeaders.authorization
        if (auth) {
          if (!(options.headers instanceof Headers)) {
            options.headers = new Headers(options.headers as HeadersInit)
          }
          options.headers.append('authorization', auth)
        }
      }
    },
    onResponseError({ response }) {
      console.error('[nuxt-sap-odata] request failed', response?._data || response)
    },
  })
}
