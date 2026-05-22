'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface LogEntry {
  userId: string | null
  email: string
  age: number | null
  gender: string | null
  yearLevel: string | null
  fieldOfStudy: string | null
  lastLogDate: string
  lastRiskLevel: string
}

const riskColors: Record<string, string> = {
  Low: 'text-green-600',
  Moderate: 'text-yellow-600',
  High: 'text-orange-600',
  Critical: 'text-red-600',
}

const riskBadge: Record<string, string> = {
  Low: 'bg-green-500/10 text-green-700',
  Moderate: 'bg-yellow-500/10 text-yellow-700',
  High: 'bg-orange-500/10 text-orange-700',
  Critical: 'bg-red-500/10 text-red-700',
}

export default function AdminLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users?page=${page}&pageSize=25`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setLogs(data.users ?? [])
      setTotalPages(data.totalPages ?? 1)
      setTotalCount(data.totalCount ?? 0)
    } catch {
      setError('Failed to load activity logs.')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Activity Logs</h1>
        <p className="text-muted-foreground mt-1">
          Recent respondent submissions — {totalCount} total entries
        </p>
      </div>

      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}

      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Activity log entries</caption>
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
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr
                    key={log.userId ?? `${log.email}-${idx}`}
                    onClick={() => router.push(`/admin/users/${log.userId ?? encodeURIComponent(log.email)}`)}
                    className="border-t border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    tabIndex={0}
                    role="button"
                    aria-label={`View details for ${log.email}`}
                    onKeyDown={(e) => e.key === 'Enter' && router.push(`/admin/users/${log.userId ?? encodeURIComponent(log.email)}`)}
                  >
                    <td className="px-4 py-3 text-foreground font-medium">{log.email || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.age ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.gender ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.yearLevel ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.fieldOfStudy ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.lastLogDate}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${riskBadge[log.lastRiskLevel] ?? 'bg-muted text-muted-foreground'}`}>
                        {log.lastRiskLevel || '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
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
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
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
