import { useRequestHeaders, useRuntimeConfig } from '#imports'
import { ofetch } from 'ofetch'

export function createODataClient() {
  const config = useRuntimeConfig()
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
          options.headers?.append('authorization', auth)
        }
      }
    },
    onResponseError({ response }) {
      console.error('[nuxt-sap-odata] request failed', response?._data || response)
    },
  })
}
