'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Activity, Users, Monitor, Brain } from 'lucide-react'

interface AggregateStats {
  totalRespondents: number
  riskDistribution: { Low: number; Moderate: number; High: number; Critical: number }
  averageScreenTime: number
  topSymptoms: Array<{ symptom: string; count: number }>
}

interface MLStatus {
  modelLoaded: boolean
  trainingRows?: number
  newLogsSinceRetrain?: number
  retrainThreshold?: number
  error?: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AggregateStats | null>(null)
  const [mlStatus, setMlStatus] = useState<MLStatus | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [mlLoading, setMlLoading] = useState(true)
  const [retraining, setRetraining] = useState(false)
  const [retrainMessage, setRetrainMessage] = useState('')
  const [retrainError, setRetrainError] = useState('')

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false))

    fetch('/api/admin/ml-status')
      .then((r) => r.json())
      .then((data) => setMlStatus(data))
      .catch(() => setMlStatus({ modelLoaded: false, error: 'ML backend unavailable' }))
      .finally(() => setMlLoading(false))
  }, [])

  const handleRetrain = async () => {
    setRetraining(true)
    setRetrainMessage('')
    setRetrainError('')
    try {
      const res = await fetch('/api/admin/ml-retrain', { method: 'POST' })
      if (res.ok) {
        setRetrainMessage('Retrain started. Check server logs for progress.')
      } else {
        const body = await res.json()
        setRetrainError(body.error ?? 'Retrain failed.')
      }
    } catch {
      setRetrainError('ML backend unavailable')
    } finally {
      setRetraining(false)
    }
  }

  const riskColors: Record<string, string> = {
    Low: 'text-green-600',
    Moderate: 'text-yellow-600',
    High: 'text-orange-600',
    Critical: 'text-red-600',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">System-wide statistics and ML model management</p>
      </div>

      {/* Aggregate Stats */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" /> Aggregate Statistics
        </h2>

        {statsLoading ? (
          <div aria-busy="true" className="text-muted-foreground">Loading statistics…</div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground">Total Respondents</p>
              <p className="text-3xl font-bold text-foreground mt-1">{stats.totalRespondents}</p>
            </div>

            <div className="border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground">Avg Screen Time</p>
              <p className="text-3xl font-bold text-foreground mt-1">{stats.averageScreenTime}h</p>
            </div>

            <div className="border border-border rounded-xl p-5 col-span-1 sm:col-span-2">
              <p className="text-sm text-muted-foreground mb-3">Risk Distribution</p>
              <div className="grid grid-cols-4 gap-2">
                {(['Low', 'Moderate', 'High', 'Critical'] as const).map((level) => (
                  <div key={level} className="text-center">
                    <p className={`text-xl font-bold ${riskColors[level]}`}>
                      {stats.riskDistribution[level]}%
                    </p>
                    <p className="text-xs text-muted-foreground">{level}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-border rounded-xl p-5 col-span-1 sm:col-span-2">
              <p className="text-sm text-muted-foreground mb-3">Top Symptoms</p>
              {stats.topSymptoms.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data</p>
              ) : (
                <ul className="space-y-2">
                  {stats.topSymptoms.map((s) => (
                    <li key={s.symptom} className="flex justify-between text-sm">
                      <span className="text-foreground capitalize">{s.symptom.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-foreground">{s.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <p role="alert" className="text-destructive">Failed to load statistics.</p>
        )}
      </section>

      {/* ML Status & Retrain */}
      <section aria-labelledby="ml-heading">
        <h2 id="ml-heading" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5" /> ML Model Status
        </h2>

        {mlLoading ? (
          <div aria-busy="true" className="text-muted-foreground">Loading ML status…</div>
        ) : mlStatus ? (
          <div className="border border-border rounded-xl p-6 space-y-4">
            {mlStatus.error ? (
              <p role="alert" className="text-destructive">{mlStatus.error}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Model Loaded</p>
                  <p className={`text-lg font-semibold mt-1 ${mlStatus.modelLoaded ? 'text-green-600' : 'text-red-600'}`}>
                    {mlStatus.modelLoaded ? 'Yes ✓' : 'No'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Training Rows</p>
                  <p className="text-lg font-semibold text-foreground mt-1">
                    {mlStatus.trainingRows ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Logs Since Retrain</p>
                  <p className="text-lg font-semibold text-foreground mt-1">
                    {mlStatus.newLogsSinceRetrain ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Retrain Threshold</p>
                  <p className="text-lg font-semibold text-foreground mt-1">
                    {mlStatus.retrainThreshold ?? '—'} logs
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={handleRetrain}
                disabled={retraining || !!mlStatus.error}
                aria-busy={retraining}
                aria-label="Retrain ML model"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
                {retraining ? 'Retraining…' : 'Retrain Model'}
              </button>

              {retrainMessage && (
                <p className="text-sm text-green-600">{retrainMessage}</p>
              )}
              {retrainError && (
                <p role="alert" className="text-sm text-destructive">{retrainError}</p>
              )}
            </div>
          </div>
        ) : (
          <p role="alert" className="text-destructive">ML backend unavailable</p>
        )}
      </section>

      {/* Quick links */}
      <section aria-labelledby="links-heading">
        <h2 id="links-heading" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" /> Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <a href="/admin/users" className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
            View Respondents
          </a>
          <a href="/admin/data" className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
            Export CSV
          </a>
        </div>
      </section>
    </div>
  )
}
