import type { H3Event } from 'h3'
import type { Hookable } from 'hookable'
import type {
  ODataProxyHooks,
  OdxProxyOutcome,
  OdxProxyTargetKind,
  OdxProxyTelemetrySummary,
} from '../types'

const MAX_OPERATION_ID_LENGTH = 128
const SAFE_OPERATION_ID = /^[\w.:-]+$/

export interface OdxProxyTelemetryInput {
  serviceId: string
  requestId?: string
  entitySetId?: string
  method: string
  proxyMode: 'buffer' | 'stream'
  targetKind: OdxProxyTargetKind
}

function sanitizeOperationId(value: unknown): string | undefined {
  if (typeof value !== 'string')
    return undefined

  const normalized = value.trim()
  if (!normalized || normalized.length > MAX_OPERATION_ID_LENGTH || !SAFE_OPERATION_ID.test(normalized))
    return undefined

  return normalized
}

function resolveOutcome(status: number): OdxProxyOutcome {
  if (status === 499)
    return 'cancelled'
  return status >= 400 ? 'failure' : 'success'
}

function now(): number {
  return performance.now()
}

/**
 * Builds and publishes one allowlisted summary for a proxy request. Completion
 * is idempotent so nested error paths and response-finish callbacks cannot
 * emit duplicates.
 */
export class OdxProxyTelemetry {
  readonly requestId: string
  private readonly startedAt = now()
  private completed = false

  constructor(
    private readonly event: H3Event,
    private readonly hooks: Hookable<ODataProxyHooks> | undefined,
    private readonly input: OdxProxyTelemetryInput,
  ) {
    this.requestId = input.requestId ?? globalThis.crypto.randomUUID()
    event.context.odxRequestId = this.requestId
  }

  async complete(status: number): Promise<Readonly<OdxProxyTelemetrySummary> | undefined> {
    if (this.completed)
      return undefined

    this.completed = true
    const operationId = sanitizeOperationId(this.event.context.odxOperationId)
    const summary = Object.freeze({
      schemaVersion: 1,
      requestId: this.requestId,
      ...(operationId ? { operationId } : {}),
      serviceId: this.input.serviceId,
      ...(this.input.entitySetId ? { entitySetId: this.input.entitySetId } : {}),
      method: this.input.method.toUpperCase(),
      proxyMode: this.input.proxyMode,
      targetKind: this.input.targetKind,
      status,
      outcome: resolveOutcome(status),
      durationMs: Math.max(0, now() - this.startedAt),
    } satisfies OdxProxyTelemetrySummary)

    this.event.context.odxTelemetrySummary = summary
    if (this.hooks) {
      try {
        await this.hooks.callHook('odx:proxy:telemetry', { event: this.event, summary })
      }
      catch {
        // Observability must never fail or delay the proxied request contract.
      }
    }

    return summary
  }
}

export function resolveOdxProxyTargetKind(input: {
  destination?: string
  isRelative: boolean
}): OdxProxyTargetKind {
  if (input.destination)
    return 'destination'
  return input.isRelative ? 'mock' : 'url'
}
