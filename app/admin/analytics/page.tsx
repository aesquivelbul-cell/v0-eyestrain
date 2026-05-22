'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Eye, Moon } from 'lucide-react'

interface StatsData {
  totalRespondents: number
  riskDistribution: { Low: number; Moderate: number; High: number; Critical: number }
  averageScreenTime: number
  topSymptoms: Array<{ symptom: string; count: number }>
}

const riskColors: Record<string, string> = {
  Low: 'bg-green-500',
  Moderate: 'bg-yellow-500',
  High: 'bg-orange-500',
  Critical: 'bg-red-500',
}

const riskTextColors: Record<string, string> = {
  Low: 'text-green-600',
  Moderate: 'text-yellow-600',
  High: 'text-orange-600',
  Critical: 'text-red-600',
}

const symptomLabels: Record<string, string> = {
  eye_strain: 'Eye Strain',
  headaches: 'Headaches',
  blurry_vision: 'Blurry Vision',
  dry_eyes: 'Dry Eyes',
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => setError('Failed to load analytics data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div aria-busy="true" className="text-muted-foreground">Loading analytics…</div>
      </div>
    )
  }

  if (error || !stats) {
    return <p role="alert" className="text-destructive">{error || 'No data available.'}</p>
  }

  const riskLevels = ['Low', 'Moderate', 'High', 'Critical'] as const
  const maxRiskPct = Math.max(...riskLevels.map((l) => stats.riskDistribution[l]))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">System-wide eye health trends across all respondents</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Respondents</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalRespondents}</p>
          </div>
        </div>

        <div className="border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Screen Time</p>
            <p className="text-2xl font-bold text-foreground">{stats.averageScreenTime}h</p>
          </div>
        </div>

        <div className="border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <Eye className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Top Symptom</p>
            <p className="text-2xl font-bold text-foreground capitalize">
              {stats.topSymptoms[0]
                ? (symptomLabels[stats.topSymptoms[0].symptom] ?? stats.topSymptoms[0].symptom)
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Risk distribution bar chart */}
      <div className="border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Risk Level Distribution</h2>
        <div className="space-y-4">
          {riskLevels.map((level) => {
            const pct = stats.riskDistribution[level]
            const barWidth = maxRiskPct > 0 ? (pct / maxRiskPct) * 100 : 0
            return (
              <div key={level} className="flex items-center gap-4">
                <span className={`w-20 text-sm font-medium text-right flex-shrink-0 ${riskTextColors[level]}`}>
                  {level}
                </span>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${riskColors[level]}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="w-12 text-sm text-muted-foreground text-right flex-shrink-0">
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Symptom frequency */}
      <div className="border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Symptom Frequency</h2>
        {stats.topSymptoms.length === 0 ? (
          <p className="text-muted-foreground text-sm">No symptom data available.</p>
        ) : (
          <div className="space-y-4">
            {stats.topSymptoms.map((s) => (
              <div key={s.symptom} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    {symptomLabels[s.symptom] ?? s.symptom}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${stats.totalRespondents > 0 ? Math.min((s.count / stats.totalRespondents) * 100, 100) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-16 text-right">
                    {s.count} users
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Screen time insight */}
      <div className="border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Moon className="w-5 h-5" /> Screen Time Insight
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-green-500/10 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {stats.averageScreenTime <= 6 ? '✓' : stats.averageScreenTime <= 8 ? '~' : '✗'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.averageScreenTime <= 6
                ? 'Healthy range (≤6h)'
                : stats.averageScreenTime <= 8
                ? 'Moderate (6–8h)'
                : 'High risk (>8h)'}
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-foreground">{stats.averageScreenTime}h</p>
            <p className="text-sm text-muted-foreground mt-1">Average daily screen time</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-foreground">8h</p>
            <p className="text-sm text-muted-foreground mt-1">Recommended maximum</p>
          </div>
        </div>
      </div>
    </div>
  )
}
