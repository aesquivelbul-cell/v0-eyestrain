/**
 * Property-based test for aggregate stats risk percentage computation.
 *
 * Tag: Feature: admin-and-recommendations
 * Property 11: aggregate stats risk percentages sum to 100
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ─── Pure stats logic (extracted from the route for testability) ──────────────

function computeRiskDistribution(
  logs: Array<{ risk_level: string }>,
): { Low: number; Moderate: number; High: number; Critical: number } {
  const riskCounts: Record<string, number> = { Low: 0, Moderate: 0, High: 0, Critical: 0 }
  for (const log of logs) {
    const level = log.risk_level
    if (level in riskCounts) riskCounts[level]++
  }
  const total = logs.length
  const dist = {
    Low: Math.round((riskCounts.Low / total) * 1000) / 10,
    Moderate: Math.round((riskCounts.Moderate / total) * 1000) / 10,
    High: Math.round((riskCounts.High / total) * 1000) / 10,
    Critical: Math.round((riskCounts.Critical / total) * 1000) / 10,
  }
  // Adjust largest bucket for rounding drift
  const sum = dist.Low + dist.Moderate + dist.High + dist.Critical
  const diff = Math.round((100 - sum) * 10) / 10
  if (diff !== 0) {
    const maxKey = (Object.entries(dist).sort((a, b) => b[1] - a[1])[0][0]) as keyof typeof dist
    dist[maxKey] = Math.round((dist[maxKey] + diff) * 10) / 10
  }
  return dist
}

// ─── Arbitrary ───────────────────────────────────────────────────────────────

const arbitraryNonEmptyLogs = fc.array(
  fc.record({
    risk_level: fc.constantFrom('Low', 'Moderate', 'High', 'Critical'),
  }),
  { minLength: 1, maxLength: 200 },
)

// ─── Property ────────────────────────────────────────────────────────────────

describe('Aggregate Stats — Property-Based Tests', () => {
  it(
    'Property 11: risk percentages sum to 100 (±0.1) for any non-empty log dataset',
    () => {
      fc.assert(
        fc.property(arbitraryNonEmptyLogs, (logs) => {
          const dist = computeRiskDistribution(logs)
          const sum = dist.Low + dist.Moderate + dist.High + dist.Critical
          expect(Math.abs(sum - 100)).toBeLessThanOrEqual(0.1)
        }),
        { numRuns: 200 },
      )
    },
  )
})
