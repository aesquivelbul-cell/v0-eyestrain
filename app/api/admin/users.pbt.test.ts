/**
 * Property-based test for user log date ordering.
 *
 * Tag: Feature: admin-and-recommendations
 * Property 12: user logs ordered by date descending
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ─── Pure sort logic (mirrors the route's .order('date', { ascending: false })) ─

function sortLogsByDateDesc(logs: Array<{ date: string }>): Array<{ date: string }> {
  return [...logs].sort((a, b) => {
    if (a.date > b.date) return -1
    if (a.date < b.date) return 1
    return 0
  })
}

// ─── Arbitrary ───────────────────────────────────────────────────────────────

const arbitraryDateString = fc
  .date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
  .map((d) => d.toISOString().split('T')[0])

const arbitraryLogs = fc.array(
  fc.record({ date: arbitraryDateString }),
  { minLength: 0, maxLength: 100 },
)

// ─── Property ────────────────────────────────────────────────────────────────

describe('User Detail — Property-Based Tests', () => {
  it(
    'Property 12: user logs ordered by date descending — each log date >= next log date',
    () => {
      fc.assert(
        fc.property(arbitraryLogs, (logs) => {
          const sorted = sortLogsByDateDesc(logs)
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].date >= sorted[i + 1].date).toBe(true)
          }
        }),
        { numRuns: 200 },
      )
    },
  )
})
