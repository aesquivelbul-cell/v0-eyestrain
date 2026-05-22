'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

interface UserRow {
  userId: string | null
  email: string
  age: number | null
  gender: string | null
  yearLevel: string | null
  fieldOfStudy: string | null
  lastLogDate: string
  lastRiskLevel: string
}

interface UserListResponse {
  users: UserRow[]
  page: number
  totalPages: number
  totalCount: number
}

const riskColors: Record<string, string> = {
  Low: 'text-green-600',
  Moderate: 'text-yellow-600',
  High: 'text-orange-600',
  Critical: 'text-red-600',
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [data, setData] = useState<UserListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  // Debounce search input — 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
    } catch {
      setError('Failed to load respondents.')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleRowClick = (userId: string | null, email: string) => {
    const id = userId ?? encodeURIComponent(email)
    router.push(`/admin/users/${id}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Respondents</h1>
        <p className="text-muted-foreground mt-1">All users and survey respondents</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search by email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search respondents by email"
          className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Error */}
      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Respondents list</caption>
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground">Email</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground">Age</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground">Gender</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground">Year Level</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground">Field of Study</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground">Last Log</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground" aria-busy="true">
                    Loading…
                  </td>
                </tr>
              ) : !data || data.users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No respondents found.
                  </td>
                </tr>
              ) : (
                data.users.map((user, idx) => (
                  <tr
                    key={user.userId ?? `${user.email}-${idx}`}
                    onClick={() => handleRowClick(user.userId, user.email)}
                    className="border-t border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    tabIndex={0}
                    role="button"
                    aria-label={`View details for ${user.email}`}
                    onKeyDown={(e) => e.key === 'Enter' && handleRowClick(user.userId, user.email)}
                  >
                    <td className="px-4 py-3 text-foreground">{user.email || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.age ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.gender ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.yearLevel ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.fieldOfStudy ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.lastLogDate}</td>
                    <td className={`px-4 py-3 font-medium ${riskColors[user.lastRiskLevel] ?? 'text-foreground'}`}>
                      {user.lastRiskLevel || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.page} of {data.totalPages} ({data.totalCount} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
              className="p-2 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              aria-label="Next page"
              className="p-2 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
