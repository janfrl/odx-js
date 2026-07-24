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

export type OdxProxyTargetKind = 'url' | 'destination' | 'mock'
export type OdxProxyOutcome = 'success' | 'failure' | 'cancelled'

/**
 * Privacy-safe operational facts for one completed ODX proxy request.
 * Payloads, query values, entity keys, and unrestricted URLs are deliberately
 * absent. Hosts may project this object into their observability backend.
 */
export interface OdxProxyTelemetrySummary {
  schemaVersion: 1
  requestId: string
  operationId?: string
  serviceId: string
  entitySetId?: string
  method: string
  proxyMode: 'buffer' | 'stream'
  targetKind: OdxProxyTargetKind
  status: number
  outcome: OdxProxyOutcome
  durationMs: number
}

export interface OdxProxyTelemetryContext {
  event: H3Event
  summary: Readonly<OdxProxyTelemetrySummary>
}

export interface ODataProxyHooks {
  'odx:proxy:request': (ctx: ODataProxyRequestContext) => void | Promise<void>
  'odx:proxy:response': (ctx: ODataProxyResponseContext) => void | Promise<void>
  'odx:proxy:telemetry': (ctx: OdxProxyTelemetryContext) => void | Promise<void>
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
    odxOperationId?: string
    odxRequestId?: string
    odxTelemetrySummary?: Readonly<OdxProxyTelemetrySummary>
    proxyTarget?: ResolvedProxyTarget | null
    proxyTrace?: unknown
    securityContext?: SapSecurityContext
  }
}
