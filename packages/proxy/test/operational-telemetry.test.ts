import type { H3Event } from 'h3'
import type { ODataProxyHooks } from '../src/types'
import { createHooks } from 'hookable'
import { describe, expect, it, vi } from 'vitest'
import { OdxProxyTelemetry, resolveOdxProxyTargetKind } from '../src/utils/operational-telemetry'

function createEvent(operationId?: string): H3Event {
  return {
    context: {
      odxOperationId: operationId,
    },
  } as unknown as H3Event
}

describe('proxy operational telemetry', () => {
  it('publishes one frozen allowlisted summary', async () => {
    const event = createEvent('list-report.load:products')
    const hooks = createHooks<ODataProxyHooks>()
    const listener = vi.fn()
    hooks.hook('odx:proxy:telemetry', listener)

    const telemetry = new OdxProxyTelemetry(event, hooks, {
      requestId: 'request-1',
      serviceId: 'Catalog',
      entitySetId: 'Products',
      method: 'get',
      proxyMode: 'buffer',
      targetKind: 'url',
    })

    const summary = await telemetry.complete(200)

    expect(summary).toMatchObject({
      schemaVersion: 1,
      requestId: 'request-1',
      operationId: 'list-report.load:products',
      serviceId: 'Catalog',
      entitySetId: 'Products',
      method: 'GET',
      proxyMode: 'buffer',
      targetKind: 'url',
      status: 200,
      outcome: 'success',
    })
    expect(summary?.durationMs).toBeGreaterThanOrEqual(0)
    expect(Object.isFrozen(summary)).toBe(true)
    expect(event.context.odxRequestId).toBe('request-1')
    expect(event.context.odxTelemetrySummary).toBe(summary)
    expect(listener).toHaveBeenCalledOnce()
    expect(await telemetry.complete(500)).toBeUndefined()
    expect(listener).toHaveBeenCalledOnce()
  })

  it('drops unsafe operation identifiers and contains no payload fields', async () => {
    const event = createEvent('Products?$filter=Secret eq true')
    const telemetry = new OdxProxyTelemetry(event, undefined, {
      requestId: 'request-2',
      serviceId: 'Catalog',
      method: 'POST',
      proxyMode: 'stream',
      targetKind: 'destination',
    })

    const summary = await telemetry.complete(403)

    expect(summary).toEqual({
      schemaVersion: 1,
      requestId: 'request-2',
      serviceId: 'Catalog',
      method: 'POST',
      proxyMode: 'stream',
      targetKind: 'destination',
      status: 403,
      outcome: 'failure',
      durationMs: expect.any(Number),
    })
    expect(JSON.stringify(summary)).not.toContain('Secret')
  })

  it('isolates telemetry hook failures from request completion', async () => {
    const hooks = createHooks<ODataProxyHooks>()
    hooks.hook('odx:proxy:telemetry', () => {
      throw new Error('drain unavailable')
    })
    const telemetry = new OdxProxyTelemetry(createEvent(), hooks, {
      serviceId: 'Catalog',
      method: 'GET',
      proxyMode: 'buffer',
      targetKind: 'mock',
    })

    await expect(telemetry.complete(499)).resolves.toMatchObject({
      outcome: 'cancelled',
      status: 499,
    })
  })

  it('classifies targets without exposing target URLs', () => {
    expect(resolveOdxProxyTargetKind({ destination: 'ERP', isRelative: false })).toBe('destination')
    expect(resolveOdxProxyTargetKind({ isRelative: true })).toBe('mock')
    expect(resolveOdxProxyTargetKind({ isRelative: false })).toBe('url')
  })
})
