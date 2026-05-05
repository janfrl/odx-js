import type { MeasurementSummary } from './benchmark-report'

export function summarizeBenchmarkTimings(
  timings: number[],
  roundAvgMs: number[],
): Omit<MeasurementSummary, 'label' | 'path' | 'iterations' | 'rounds' | 'concurrency' | 'overheadAvgMs' | 'overheadAvgPercent'> {
  const sorted = [...timings].sort((a, b) => a - b)
  const sortedRoundAverages = [...roundAvgMs].sort((a, b) => a - b)

  return {
    minMs: sorted[0] ?? 0,
    avgMs: mean(timings),
    medianRoundAvgMs: percentile(sortedRoundAverages, 50),
    roundStdDevMs: standardDeviation(roundAvgMs),
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    maxMs: sorted.at(-1) ?? 0,
  }
}

function mean(values: number[]): number {
  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0
}

function standardDeviation(values: number[]): number {
  if (values.length < 2)
    return 0

  const average = mean(values)
  const variance = mean(values.map(value => (value - average) ** 2))
  return Math.sqrt(variance)
}

function percentile(sortedTimings: number[], percentileRank: number): number {
  const index = Math.min(
    sortedTimings.length - 1,
    Math.max(0, Math.ceil((percentileRank / 100) * sortedTimings.length) - 1),
  )
  return sortedTimings[index] ?? 0
}
