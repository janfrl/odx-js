import type { ODataRule } from '@bc8-odx/core'
import type { H3Event } from 'h3'
import type { FetchOptions } from 'ofetch'
import process from 'node:process'
import { createError } from 'h3'

export interface ODataRuleContext {
  event: H3Event
  serviceName: string
  fetchOptions: FetchOptions
  url?: string
}

/**
 * A standard utility to apply security rules and access policies to OData requests.
 * Automatically handles telemetry tracing for the ODX Explorer.
 */
export class ODataGuard {
  constructor(public ctx: ODataRuleContext) {}

  private addTrace(label: string, message: string, details?: any, status: 'success' | 'error' | 'info' = 'info'): void {
    const trace = (this.ctx.event.context as any).proxyTrace
    if (typeof trace === 'function') {
      trace(label, message, details, status)
    }
  }

  /**
   * Restricts the service to an explicit list of methods.
   */
  allowOnlyMethods(methods: string[], reason?: string): this {
    this.addTrace('Rules', `Checking method restriction: [${methods.join(', ')}]`, { methods, policy: 'MethodGuard' })

    if (!methods.includes(this.ctx.event.method)) {
      const message = reason || `Method ${this.ctx.event.method} is not allowed. Only [${methods.join(', ')}] are permitted.`
      this.addTrace('Rules', `Access DENIED: ${message}`, { action: 'REJECT', method: this.ctx.event.method }, 'error')
      throw createError({
        statusCode: 405,
        statusMessage: message,
      })
    }
    return this
  }

  /**
   * Specifically blocks certain methods.
   */
  denyMethods(methods: string[], reason?: string): this {
    this.addTrace('Rules', `Checking method blocklist: [${methods.join(', ')}]`, { methods, policy: 'MethodGuard' })

    if (methods.includes(this.ctx.event.method)) {
      const message = reason || `Method ${this.ctx.event.method} is explicitly denied.`
      this.addTrace('Rules', `Access DENIED: ${message}`, { action: 'REJECT', method: this.ctx.event.method }, 'error')
      throw createError({
        statusCode: 405,
        statusMessage: message,
      })
    }
    return this
  }

  /**
   * Verifies that the current user has the specified XSUAA scope.
   */
  requireScope(scope: string, reason?: string): this {
    this.addTrace('Rules', `Verifying XSUAA scope: "${scope}"`, { scope, policy: 'SecurityGuard' })

    const secContext = this.ctx.event.context.securityContext
    if (!secContext) {
      if (process.env.NODE_ENV === 'production') {
        const message = 'Security context missing. Authentication required.'
        this.addTrace('Rules', `Access DENIED: ${message}`, { action: 'REJECT' }, 'error')
        throw createError({ statusCode: 401, statusMessage: message })
      }
      return this
    }

    if (typeof secContext.checkLocalScope === 'function' && !secContext.checkLocalScope(scope)) {
      const message = reason || `User lacks required scope: "${scope}"`
      this.addTrace('Rules', `Access DENIED: ${message}`, { action: 'REJECT', scope }, 'error')
      throw createError({
        statusCode: 403,
        statusMessage: message,
      })
    }

    return this
  }

  /**
   * Ensures a specific user attribute matches the required value.
   */
  requireAttribute(name: string, value: string, reason?: string): this {
    this.addTrace('Rules', `Verifying user attribute: "${name}" = "${value}"`, { name, value, policy: 'SecurityGuard' })

    const secContext = this.ctx.event.context.securityContext
    if (!secContext) {
      if (process.env.NODE_ENV === 'production') {
        const message = 'Security context missing. Authentication required.'
        this.addTrace('Rules', `Access DENIED: ${message}`, { action: 'REJECT' }, 'error')
        throw createError({ statusCode: 401, statusMessage: message })
      }
      return this
    }

    const attrValue = typeof secContext.getAttribute === 'function' ? secContext.getAttribute(name) : null
    const matches = Array.isArray(attrValue) ? attrValue.includes(value) : attrValue === value

    if (!matches) {
      const message = reason || `User attribute "${name}" does not match required value.`
      this.addTrace('Rules', `Access DENIED: ${message}`, { action: 'REJECT', attribute: name, expected: value, actual: attrValue }, 'error')
      throw createError({
        statusCode: 403,
        statusMessage: message,
      })
    }

    return this
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
        statusMessage: message,
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
        statusMessage: message,
      })
    }
    return this
  }

  /**
   * Inject a custom header into the outgoing request.
   */
  injectHeader(name: string, value: string): this {
    this.addTrace('Rules', `Injecting custom header: "${name}"`, { name, value, policy: 'HeaderInjection' })
    const headers = (this.ctx.fetchOptions.headers as any) || {}
    headers[name] = value
    this.ctx.fetchOptions.headers = headers
    return this
  }

  /**
   * Dynamically modifies the target URL path.
   */
  rewritePath(pattern: string | RegExp, replacement: string): this {
    if (!this.ctx.url)
      return this

    const oldUrl = this.ctx.url
    const newUrl = oldUrl.replace(pattern, replacement)

    if (oldUrl !== newUrl) {
      this.addTrace('Rules', `Rewriting path`, { from: oldUrl, to: newUrl, policy: 'PathRewrite' })
      this.ctx.url = newUrl
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
        statusMessage: message,
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

  /**
   * Applies a single rule object (usually from configuration).
   */
  applyRule(rule: ODataRule): this {
    switch (rule.type) {
      case 'allowOnlyMethods':
        return this.allowOnlyMethods(rule.value, rule.reason)
      case 'denyMethods':
        return this.denyMethods(rule.value, rule.reason)
      case 'requireScope':
        return this.requireScope(rule.value, rule.reason)
      case 'requireAttribute':
        return this.requireAttribute(rule.value.name, rule.value.value, rule.reason)
      case 'denyPath':
        return this.denyIfPathIncludes(rule.value, rule.reason)
      case 'denyIfHeader':
        return this.denyIfHeader(rule.value.name, rule.value.value, rule.reason)
      case 'injectHeader':
        return this.injectHeader(rule.value.name, rule.value.value)
      case 'rewritePath':
        return this.rewritePath(rule.value.pattern, rule.value.replacement)
      default:
        return this
    }
  }
}

/**
 * Creates a new ODataGuard instance for the given request context.
 */
export function odataGuard(ctx: any): ODataGuard {
  return new ODataGuard(ctx as ODataRuleContext)
}
