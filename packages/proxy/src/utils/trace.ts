import type { OdxLogPayloadPolicy } from '@me-tools/odx-core'
import type { H3Event } from 'h3'
import process from 'node:process'
import { addODataLog, updateODataLog } from '@me-tools/odx-core'
import { configureOdxLogStore, isPersistentOdxLogStoreConfigured } from './log-store'

function resolvePayloadPolicy(event: H3Event): OdxLogPayloadPolicy {
  const devtools = event.context.odataConfig?.devtools
  return {
    storePayloads: !!devtools?.enabled && devtools.logPayloads !== false && process.env.NODE_ENV !== 'production',
    maxPayloadBytes: devtools?.maxPayloadBytes,
  }
}

function shouldEnableTraceLogging(event: H3Event): boolean {
  const config = event.context.odataConfig
  if (!config?.devtools?.enabled)
    return false

  if (process.env.NODE_ENV !== 'production')
    return true

  return isPersistentOdxLogStoreConfigured(config)
}

/**
 * Encapsulates the tracing and logging state for a single proxy request.
 */
export class DevToolsTracer {
  readonly id = Math.random().toString(36).substring(7)
  readonly startTime = Date.now()
  readonly trace: any[]
  readonly enabled: boolean
  readonly payloadPolicy: OdxLogPayloadPolicy

  constructor(event: H3Event) {
    this.enabled = shouldEnableTraceLogging(event)
    this.payloadPolicy = resolvePayloadPolicy(event)
    this.trace = []
    event.context.proxyTrace = this.addTrace.bind(this)
  }

  /**
   * Adds a new trace entry for the current request.
   */
  addTrace(label: string, message: string, details?: any, status: 'success' | 'error' | 'info' = 'info'): void {
    if (!this.enabled)
      return

    this.trace.push({
      timestamp: Date.now(),
      duration: Date.now() - this.startTime,
      label,
      message,
      details,
      status,
    })
  }

  /**
   * Creates an initial log entry for the request.
   */
  async initLog(event: H3Event, targetUrl: string, serviceName: string, entitySet: string, requestBody?: any, requestHeaders?: any): Promise<void> {
    if (!this.enabled)
      return

    const config = event.context.odataConfig
    await configureOdxLogStore(config)
    await addODataLog({
      id: this.id,
      timestamp: Date.now(),
      method: event.method,
      url: event.path,
      targetUrl,
      service: serviceName,
      entitySet,
      status: 0, // Pending
      duration: 0,
      isPending: true,
      requestBody,
      requestHeaders,
      proxyTrace: this.trace,
    }, config?.devtools?.maxLogs, this.payloadPolicy)
  }

  /**
   * Updates the existing log entry with final response data.
   */
  async updateLog(status: number, responseBody?: any): Promise<void> {
    if (!this.enabled)
      return

    await updateODataLog(this.id, {
      status,
      duration: Date.now() - this.startTime,
      isPending: false,
      responseBody,
      proxyTrace: [...this.trace],
    }, this.payloadPolicy)
  }

  async updateLogContext(updates: { targetUrl?: string, requestHeaders?: any }): Promise<void> {
    if (!this.enabled)
      return

    await updateODataLog(this.id, updates, this.payloadPolicy)
  }

  /**
   * Registers a callback to update the log when the response is finished (for streaming).
   */
  registerStreamFinish(event: H3Event): void {
    if (!this.enabled)
      return

    event.node.res.on('finish', () => {
      void this.updateLog(event.node.res.statusCode, '[Streamed Response]')
    })
  }
}
