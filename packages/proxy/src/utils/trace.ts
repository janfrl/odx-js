import type { H3Event } from 'h3'
import process from 'node:process'
import { addODataLog, updateODataLog } from '@bc8-odx/core'

/**
 * Encapsulates the tracing and logging state for a single proxy request.
 */
export class DevToolsTracer {
  readonly id = Math.random().toString(36).substring(7)
  readonly startTime = Date.now()
  readonly trace: any[] = []
  readonly enabled: boolean

  constructor(event: H3Event) {
    const config = event.context.odataConfig
    this.enabled = !!(config?.devtools?.enabled && process.env.NODE_ENV !== 'production')
    event.context.proxyTrace = this.addTrace.bind(this)
  }

  /**
   * Adds a new trace entry for the current request.
   */
  addTrace(label: string, message: string, details?: any, status: 'success' | 'error' | 'info' = 'info'): void {
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
  initLog(event: H3Event, targetUrl: string, serviceName: string, entitySet: string, requestBody?: any, requestHeaders?: any): void {
    if (!this.enabled)
      return

    const config = event.context.odataConfig
    addODataLog({
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
    }, config?.devtools?.maxLogs)
  }

  /**
   * Updates the existing log entry with final response data.
   */
  updateLog(status: number, responseBody?: any): void {
    if (!this.enabled)
      return

    updateODataLog(this.id, {
      status,
      duration: Date.now() - this.startTime,
      isPending: false,
      responseBody,
      proxyTrace: [...this.trace],
    })
  }

  /**
   * Registers a callback to update the log when the response is finished (for streaming).
   */
  registerStreamFinish(event: H3Event): void {
    if (!this.enabled)
      return

    event.node.res.on('finish', () => {
      this.updateLog(event.node.res.statusCode, '[Streamed Response]')
    })
  }
}
