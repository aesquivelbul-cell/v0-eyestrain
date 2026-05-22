/**
 * Integration tests: Admin API routes return 401 when called without admin credentials.
 *
 * Each route handler is imported directly and called with a mock Request.
 * The Supabase server client is mocked to return a non-admin user.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Mock non-admin Supabase client ──────────────────────────────────────────

const mockGetUser = vi.fn().mockResolvedValue({
  data: {
    user: {
      id: 'user-123',
      email: 'regular@example.com',
      user_metadata: { role: 'user' },
    },
  },
  error: null,
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}))

// Mock admin client (should not be reached for 401 cases)
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({}),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(url = 'http://localhost/api/admin/test', method = 'GET') {
  return new NextRequest(url, { method })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Admin API routes — 401 for non-admin users', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'regular@example.com',
          user_metadata: { role: 'user' },
        },
      },
      error: null,
    })
  })

  it('GET /api/admin/stats returns 401', async () => {
    const { GET } = await import('../stats/route')
    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('GET /api/admin/users returns 401', async () => {
    const { GET } = await import('../users/route')
    const res = await GET(makeRequest('http://localhost/api/admin/users'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('GET /api/admin/users/[userId] returns 401', async () => {
    const { GET } = await import('../users/[userId]/route')
    const res = await GET(
      makeRequest('http://localhost/api/admin/users/test-id'),
      { params: Promise.resolve({ userId: 'test-id' }) },
    )
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('GET /api/admin/export-csv returns 401', async () => {
    const { GET } = await import('../export-csv/route')
    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('GET /api/admin/ml-status returns 401', async () => {
    const { GET } = await import('../ml-status/route')
    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('POST /api/admin/ml-retrain returns 401', async () => {
    const { POST } = await import('../ml-retrain/route')
    const res = await POST()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })
})

describe('Admin API routes — 401 for unauthenticated requests (no user)', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })
  })

  it('GET /api/admin/stats returns 401 when unauthenticated', async () => {
    const { GET } = await import('../stats/route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('GET /api/admin/ml-status returns 401 when unauthenticated', async () => {
    const { GET } = await import('../ml-status/route')
    const res = await GET()
    expect(res.status).toBe(401)
  })
})
