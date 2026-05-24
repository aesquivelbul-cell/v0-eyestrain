'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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

const RISK_LEVELS = ['All', 'Low', 'Moderate', 'High', 'Critical'] as const
type RiskFilter = (typeof RISK_LEVELS)[number]

const riskColors: Record<string, string> = {
  Low: 'text-green-600',
  Moderate: 'text-yellow-600',
  High: 'text-orange-600',
  Critical: 'text-red-600',
}

const riskBadgeColors: Record<string, string> = {
  Low: 'bg-green-100 text-green-700 hover:bg-green-200',
  Moderate: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
  High: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  Critical: 'bg-red-100 text-red-700 hover:bg-red-200',
}

const PAGE_SIZE = 20

export default function AdminUsersPage() {
  const router = useRouter()
  const [allUsers, setAllUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('All')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => { setPage(1) }, [riskFilter])

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/users?page=1&pageSize=10000')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setAllUsers(json.users ?? [])
    } catch { setError('Failed to load respondents.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const riskCounts = useMemo(() => {
    const counts: Record<string, number> = { Low: 0, Moderate: 0, High: 0, Critical: 0 }
    for (const u of allUsers) { if (u.lastRiskLevel in counts) counts[u.lastRiskLevel]++ }
    return counts
  }, [allUsers])

  const filteredUsers = useMemo(() => allUsers.filter((u) => {
    const matchesSearch = !debouncedSearch || u.email.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesRisk = riskFilter === 'All' || u.lastRiskLevel === riskFilter
    return matchesSearch && matchesRisk
  }), [allUsers, debouncedSearch, riskFilter])

  const totalCount = filteredUsers.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleRowClick = (userId: string | null, email: string) => {
    router.push(`/admin/users/${userId ?? encodeURIComponent(email)}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Respondents</h1>
        <p className="text-muted-foreground mt-1">All users and survey respondents</p>
      </div>

      {/* Search + Risk filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="search" placeholder="Search by email…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search respondents by email" className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="risk-filter" className="text-sm text-muted-foreground whitespace-nowrap">Risk Level:</label>
          <select id="risk-filter" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as RiskFilter)} className="py-2 px-3 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {RISK_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        </div>
      </div>

      {/* Summary bar */}
      {!loading && !error && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button onClick={() => setRiskFilter('All')} className={`px-3 py-1 rounded-full border transition-colors ${riskFilter === 'All' ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:bg-muted'}`} aria-pressed={riskFilter === 'All'}>
            Total: {allUsers.length}
          </button>
          {(['Low', 'Moderate', 'High', 'Critical'] as const).map((level) => (
            <button key={level} onClick={() => setRiskFilter((prev) => prev === level ? 'All' : level)} className={`px-3 py-1 rounded-full border transition-colors font-medium ${riskFilter === level ? 'ring-2 ring-offset-1 ring-current ' + riskBadgeColors[level] : riskBadgeColors[level] + ' border-transparent'}`} aria-pressed={riskFilter === level}>
              {level}: {riskCounts[level]}
            </button>
          ))}
        </div>
      )}

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
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground" aria-busy="true">Loading…</td></tr>
              ) : pageUsers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No respondents found.</td></tr>
              ) : (
                pageUsers.map((user, idx) => (
                  <tr key={user.userId ?? `${user.email}-${idx}`} onClick={() => handleRowClick(user.userId, user.email)} className="border-t border-border hover:bg-muted/50 cursor-pointer transition-colors" tabIndex={0} role="button" aria-label={`View details for ${user.email}`} onKeyDown={(e) => e.key === 'Enter' && handleRowClick(user.userId, user.email)}>
                    <td className="px-4 py-3 text-foreground">{user.email || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.age ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.gender ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.yearLevel ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.fieldOfStudy ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.lastLogDate}</td>
                    <td className={`px-4 py-3 font-medium ${riskColors[user.lastRiskLevel] ?? 'text-foreground'}`}>{user.lastRiskLevel || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {safePage} of {totalPages} ({totalCount} total)</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} aria-label="Previous page" className="p-2 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} aria-label="Next page" className="p-2 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  )
}
