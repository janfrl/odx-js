import type { ODataProxyConfig } from '@me-tools/odx-core'
import type { H3Event } from 'h3'
import type { FetchOptions, FetchResponse } from 'ofetch'
import type { ResolvedProxyTarget } from './utils/target'

export interface ODataProxyRequestContext {
  event: H3Event
  serviceName: string
  fetchOptions: FetchOptions
  url?: string
}

export interface ODataProxyResponseContext {
  event: H3Event
  serviceName: string
  response: FetchResponse<unknown>
}

export interface ODataProxyHooks {
  'odx:proxy:request': (ctx: ODataProxyRequestContext) => void | Promise<void>
  'odx:proxy:response': (ctx: ODataProxyResponseContext) => void | Promise<void>
  [key: `odx:proxy:request:${string}`]: (ctx: ODataProxyRequestContext) => void | Promise<void>
  [key: `odx:proxy:response:${string}`]: (ctx: ODataProxyResponseContext) => void | Promise<void>
}

export interface SapSecurityContext {
  checkLocalScope?: (scope: string) => boolean
  getAttribute: (name: string) => unknown
  getEmail?: () => string | undefined
  getLogonName?: () => string | undefined
  getTokenInfo?: () => unknown
}

export type ODataTypeGenerator = (
  inputPath: string,
  outputDirectory: string,
  serviceName: string,
) => Promise<void>

declare module 'nitropack' {
  interface NitroRuntimeHooks extends ODataProxyHooks {}
}

declare module 'h3' {
  interface H3EventContext {
    odataConfig: ODataProxyConfig
    odataAuth?: string
    odataGenerator?: ODataTypeGenerator
    odataHooks?: unknown
    proxyTarget?: ResolvedProxyTarget | null
    proxyTrace?: unknown
    securityContext?: SapSecurityContext
  }
}
