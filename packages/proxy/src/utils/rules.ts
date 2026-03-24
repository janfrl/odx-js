import type { H3Event } from 'h3'
import type { FetchOptions } from 'ofetch'
import { createError } from 'h3'

export interface ODataRuleContext {
  event: H3Event
  serviceName: string
  fetchOptions: FetchOptions
}

/**
 * A standard utility to apply security rules and access policies to OData requests.
 * Automatically handles telemetry tracing for the ODX Explorer.
 */
export class ODataGuard {
  constructor(private ctx: ODataRuleContext) {}

  private addTrace(label: string, message: string, details?: any, status: 'success' | 'error' | 'info' = 'info'): void {
    const trace = (this.ctx.event.context as any).proxyTrace
    if (typeof trace === 'function') {
      trace(label, message, details, status)
    }
  }

  /**
   * Rejects the request if the URL path includes the specified string.
   */
  denyIfPathIncludes(path: string, reason?: string): this {
    this.addTrace('Rules', `Checking path restriction: "${path}"`, { path, policy: 'PathGuard' })

    if (this.ctx.event.path.includes(path)) {
      const message = reason || `Access to "${path}" is restricted`
      this.addTrace('Rules', `Access DENIED: ${message}`, { action: 'REJECT', path: this.ctx.event.path }, 'error')
      throw createError({
        statusCode: 403,
        statusMessage: `Forbidden: ${message}`,
      })
    }
    return this
  }

  /**
   * Rejects the request if a specific fetch header matches the specified value.
   */
  denyIfHeader(name: string, value: string, reason?: string): this {
    const headers = (this.ctx.fetchOptions.headers as Record<string, string>) || {}
    this.addTrace('Rules', `Checking header policy: "${name}"`, {
      actual: headers[name],
      deniedValue: value,
      policy: 'HeaderGuard',
    })

    if (headers[name] === value) {
      const message = reason || `Forbidden by header policy ("${name}")`
      this.addTrace('Rules', `Access DENIED: ${message}`, { header: name, value, action: 'REJECT' }, 'error')
      throw createError({
        statusCode: 403,
        statusMessage: `Forbidden: ${message}`,
      })
    }
    return this
  }

  /**
   * Custom validation rule. If the callback returns false, the request is rejected.
   */
  validate(name: string, cb: (ctx: ODataRuleContext) => boolean | Promise<boolean>, reason?: string): this {
    this.addTrace('Rules', `Running custom validation: "${name}"`, { policy: 'CustomValidator' })

    const result = cb(this.ctx)
    if (result === false) {
      const message = reason || `Validation failed: ${name}`
      this.addTrace('Rules', `Access DENIED: ${message}`, { validator: name, action: 'REJECT' }, 'error')
      throw createError({
        statusCode: 403,
        statusMessage: `Forbidden: ${message}`,
      })
    }
    return this
  }

  /**
   * Records a simple trace message without any validation logic.
   */
  info(message: string, details?: any): this {
    this.addTrace('Rules', message, details)
    return this
  }
}

/**
 * Creates a new ODataGuard instance for the given request context.
 */
export function odataGuard(ctx: any): ODataGuard {
  return new ODataGuard(ctx as ODataRuleContext)
}
