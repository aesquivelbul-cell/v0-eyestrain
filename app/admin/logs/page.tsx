'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface LogEntry {
  id: string
  date: string
  email: string | null
  screen_time: number | null
  sleep_hours: number | null
  brightness: number | null
  eye_strain: number | null
  headaches: number | null
  blurry_vision: number | null
  dry_eyes: number | null
  risk_level: string | null
}

interface LogsResponse {
  logs: LogEntry[]
  page: number
  totalPages: number
  totalCount: number
}

type DateRange = 'today' | '7days' | '30days' | 'all'

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  '7days': 'Last 7 days',
  '30days': 'Last 30 days',
  all: 'All time',
}

const riskBadge: Record<string, string> = {
  Low: 'bg-green-500/10 text-green-700 dark:text-green-400',
  Moderate: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  High: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  Critical: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

function YesNoBadge({ value }: { value: number | null }) {
  const isYes = value === 1
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isYes ? 'bg-red-500/10 text-red-700 dark:text-red-400' : 'bg-muted text-muted-foreground'}`}>
      {isYes ? 'Yes' : 'No'}
    </span>
  )
}

export default function AdminLogsPage() {
  const [data, setData] = useState<LogsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [dateRange, setDateRange] = useState<DateRange>('all')

  const fetchLogs = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '25', dateRange })
      const res = await fetch(`/api/admin/logs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      setData(await res.json())
    } catch { setError('Failed to load activity logs.') }
    finally { setLoading(false) }
  }, [page, dateRange])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const handleDateRangeChange = (range: DateRange) => { setDateRange(range); setPage(1) }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Activity Logs</h1>
        <p className="text-muted-foreground mt-1">
          {data ? `${data.totalCount.toLocaleString()} individual daily log ${data.totalCount === 1 ? 'entry' : 'entries'}` : 'Individual daily log submissions'}
        </p>
      </div>

      {/* Date range filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
        {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((range) => (
          <button key={range} onClick={() => handleDateRangeChange(range)} aria-pressed={dateRange === range} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${dateRange === range ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
            {DATE_RANGE_LABELS[range]}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Daily log entries</caption>
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Date</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground">Email</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Screen Time</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Sleep (hrs)</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground">Brightness</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Eye Strain</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground">Headaches</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Dry Eyes</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Blurry Vision</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground" aria-busy="true">Loading…</td></tr>
              ) : !data || data.logs.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">No log entries found.</td></tr>
              ) : (
                data.logs.map((log) => (
                  <tr key={log.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{log.date}</td>
                    <td className="px-4 py-3 text-foreground font-medium">{log.email || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.screen_time != null ? `${log.screen_time}h` : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.sleep_hours != null ? `${log.sleep_hours}h` : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.brightness != null ? `${log.brightness}%` : '—'}</td>
                    <td className="px-4 py-3"><YesNoBadge value={log.eye_strain} /></td>
                    <td className="px-4 py-3"><YesNoBadge value={log.headaches} /></td>
                    <td className="px-4 py-3"><YesNoBadge value={log.dry_eyes} /></td>
                    <td className="px-4 py-3"><YesNoBadge value={log.blurry_vision} /></td>
                    <td className="px-4 py-3">
                      {log.risk_level ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${riskBadge[log.risk_level] ?? 'bg-muted text-muted-foreground'}`}>{log.risk_level}</span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {data.page} of {Math.max(1, data.totalPages)} ({data.totalCount.toLocaleString()} total)</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Previous page" className="p-2 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages} aria-label="Next page" className="p-2 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  )
}
