import { describe, expect, it } from 'vitest'
import { formatComparison, parseBenchmarkReport } from '../../../scripts/compare-proxy-benchmarks'

describe('proxy benchmark comparison helper', () => {
  it('formats matching scenario average timing deltas', () => {
    const output = formatComparison(
      {
        scenarios: [
          { label: 'small seq direct', path: '/Products', avgMs: 1 },
          { label: 'small seq buffer', path: '/api/odx/BufferService/Products', avgMs: 2 },
        ],
      },
      {
        scenarios: [
          { label: 'small seq direct', path: '/Products', avgMs: 1.5 },
          { label: 'small seq buffer', path: '/api/odx/BufferService/Products', avgMs: 1 },
        ],
      },
    )

    expect(output).toContain('ODX proxy benchmark comparison')
    expect(output).toContain('small seq direct')
    expect(output).toContain('+0.50ms')
    expect(output).toContain('+50.0%')
    expect(output).toContain('-1.00ms')
    expect(output).toContain('-50.0%')
  })

  it('rejects missing candidate scenario labels', () => {
    expect(() => formatComparison(
      { scenarios: [{ label: 'small seq direct', avgMs: 1 }] },
      { scenarios: [] },
    )).toThrow('Candidate report is missing scenario(s): small seq direct')
  })

  it('rejects malformed report shapes', () => {
    expect(() => parseBenchmarkReport('{}', 'baseline')).toThrow('baseline report is missing scenarios array')
  })

  it('rejects scenarios without finite average timings', () => {
    expect(() => formatComparison(
      { scenarios: [{ label: 'small seq direct', avgMs: Number.NaN }] },
      { scenarios: [{ label: 'small seq direct', avgMs: 1 }] },
    )).toThrow('baseline scenario "small seq direct" is missing a finite avgMs value')
  })
})
