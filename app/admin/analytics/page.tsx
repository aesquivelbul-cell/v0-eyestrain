'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Eye, Moon, AlertTriangle, Brain } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface StatsData {
  totalRespondents: number
  riskDistribution: { Low: number; Moderate: number; High: number; Critical: number }
  averageScreenTime: number
  topSymptoms: Array<{ symptom: string; count: number }>
}

interface UserRecord {
  userId: string | null
  email: string
  age: number | null
  gender: string | null
  yearLevel: string | null
  fieldOfStudy: string | null
  lastLogDate: string
  lastRiskLevel: string
}

interface DemographicsData {
  fieldOfStudy: Array<{ name: string; count: number }>
  yearLevel: Array<{ name: string; count: number }>
  gender: { Male: number; Female: number; Other: number; total: number }
  highRiskCount: number
  totalUsers: number
}

const riskColors: Record<string, string> = {
  Low: 'bg-green-500', Moderate: 'bg-yellow-500', High: 'bg-orange-500', Critical: 'bg-red-500',
}
const riskTextColors: Record<string, string> = {
  Low: 'text-green-600', Moderate: 'text-yellow-600', High: 'text-orange-600', Critical: 'text-red-600',
}
const symptomLabels: Record<string, string> = {
  eye_strain: 'Eye Strain', headaches: 'Headaches', blurry_vision: 'Blurry Vision', dry_eyes: 'Dry Eyes',
}
const YEAR_ORDER = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']
const BAR_COLOR = '#6366f1'

function computeDemographics(users: UserRecord[]): DemographicsData {
  const fieldMap = new Map<string, number>()
  const yearMap = new Map<string, number>()
  const genderCounts = { Male: 0, Female: 0, Other: 0 }
  let highRiskCount = 0

  for (const u of users) {
    const field = u.fieldOfStudy?.trim() || 'Unknown'
    fieldMap.set(field, (fieldMap.get(field) ?? 0) + 1)
    const year = u.yearLevel?.trim() || 'Unknown'
    yearMap.set(year, (yearMap.get(year) ?? 0) + 1)
    const g = u.gender?.trim().toLowerCase()
    if (g === 'male') genderCounts.Male++
    else if (g === 'female') genderCounts.Female++
    else genderCounts.Other++
    if (u.lastRiskLevel === 'High' || u.lastRiskLevel === 'Critical') highRiskCount++
  }

  const fieldOfStudy = Array.from(fieldMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const yearLevel = Array.from(yearMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      const ai = YEAR_ORDER.indexOf(a.name), bi = YEAR_ORDER.indexOf(b.name)
      if (ai === -1 && bi === -1) return a.name.localeCompare(b.name)
      if (ai === -1) return 1; if (bi === -1) return -1
      return ai - bi
    })

  return { fieldOfStudy, yearLevel, gender: { ...genderCounts, total: users.length }, highRiskCount, totalUsers: users.length }
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [demographics, setDemographics] = useState<DemographicsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [demoLoading, setDemoLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats).catch(() => setError('Failed to load analytics data.')).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/admin/users?pageSize=1000').then(r => r.json()).then((data: { users?: UserRecord[] }) => {
      if (data.users) setDemographics(computeDemographics(data.users))
    }).catch(() => {}).finally(() => setDemoLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div aria-busy="true" className="text-muted-foreground">Loading analytics…</div></div>
  if (error || !stats) return <p role="alert" className="text-destructive">{error || 'No data available.'}</p>

  const riskLevels = ['Low', 'Moderate', 'High', 'Critical'] as const
  const maxRiskPct = Math.max(...riskLevels.map(l => stats.riskDistribution[l]))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">System-wide eye health trends across all respondents</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><BarChart3 className="w-5 h-5 text-primary" /></div>
          <div><p className="text-sm text-muted-foreground">Total Respondents</p><p className="text-2xl font-bold text-foreground">{stats.totalRespondents}</p></div>
        </div>
        <div className="border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0"><TrendingUp className="w-5 h-5 text-blue-500" /></div>
          <div><p className="text-sm text-muted-foreground">Avg Screen Time</p><p className="text-2xl font-bold text-foreground">{stats.averageScreenTime}h</p></div>
        </div>
        <div className="border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0"><Eye className="w-5 h-5 text-orange-500" /></div>
          <div><p className="text-sm text-muted-foreground">Top Symptom</p><p className="text-2xl font-bold text-foreground capitalize">{stats.topSymptoms[0] ? (symptomLabels[stats.topSymptoms[0].symptom] ?? stats.topSymptoms[0].symptom) : '—'}</p></div>
        </div>
      </div>

      {/* Risk distribution */}
      <div className="border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Risk Level Distribution</h2>
        <div className="space-y-4">
          {riskLevels.map(level => {
            const pct = stats.riskDistribution[level]
            const barWidth = maxRiskPct > 0 ? (pct / maxRiskPct) * 100 : 0
            return (
              <div key={level} className="flex items-center gap-4">
                <span className={`w-20 text-sm font-medium text-right flex-shrink-0 ${riskTextColors[level]}`}>{level}</span>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${riskColors[level]}`} style={{ width: `${barWidth}%` }} />
                </div>
                <span className="w-12 text-sm text-muted-foreground text-right flex-shrink-0">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Symptom frequency */}
      <div className="border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Symptom Frequency</h2>
        {stats.topSymptoms.length === 0 ? <p className="text-muted-foreground text-sm">No symptom data available.</p> : (
          <div className="space-y-4">
            {stats.topSymptoms.map(s => (
              <div key={s.symptom} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" /><span className="text-sm font-medium text-foreground">{symptomLabels[s.symptom] ?? s.symptom}</span></div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-muted rounded-full h-2 overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${stats.totalRespondents > 0 ? Math.min((s.count / stats.totalRespondents) * 100, 100) : 0}%` }} /></div>
                  <span className="text-sm text-muted-foreground w-16 text-right">{s.count} users</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Screen time insight */}
      <div className="border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Moon className="w-5 h-5" /> Screen Time Insight</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-green-500/10 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.averageScreenTime <= 6 ? '✓' : stats.averageScreenTime <= 8 ? '~' : '✗'}</p>
            <p className="text-sm text-muted-foreground mt-1">{stats.averageScreenTime <= 6 ? 'Healthy range (≤6h)' : stats.averageScreenTime <= 8 ? 'Moderate (6–8h)' : 'High risk (>8h)'}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg"><p className="text-2xl font-bold text-foreground">{stats.averageScreenTime}h</p><p className="text-sm text-muted-foreground mt-1">Average daily screen time</p></div>
          <div className="p-4 bg-muted rounded-lg"><p className="text-2xl font-bold text-foreground">8h</p><p className="text-sm text-muted-foreground mt-1">Recommended maximum</p></div>
        </div>
      </div>

      {demoLoading && <p aria-busy="true" className="text-muted-foreground text-sm">Loading demographic data…</p>}

      {!demoLoading && demographics && (
        <>
          {/* Field of Study */}
          <div className="border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Field of Study Breakdown</h2>
            {demographics.fieldOfStudy.length === 0 ? <p className="text-muted-foreground text-sm">No data available.</p> : (
              <ResponsiveContainer width="100%" height={Math.max(200, demographics.fieldOfStudy.length * 40)}>
                <BarChart data={demographics.fieldOfStudy} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12 }} tickLine={false} />
                  <Tooltip formatter={(v: number) => [v, 'Respondents']} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                    {demographics.fieldOfStudy.map((_, i) => <Cell key={i} fill={BAR_COLOR} fillOpacity={1 - i * 0.06} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Year Level */}
          <div className="border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Year Level Distribution</h2>
            {demographics.yearLevel.length === 0 ? <p className="text-muted-foreground text-sm">No data available.</p> : (
              <ResponsiveContainer width="100%" height={Math.max(200, demographics.yearLevel.length * 48)}>
                <BarChart data={demographics.yearLevel} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} tickLine={false} />
                  <Tooltip formatter={(v: number) => [v, 'Respondents']} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                  <Bar dataKey="count" fill={BAR_COLOR} radius={[0, 4, 4, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Gender */}
          <div className="border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Gender Distribution</h2>
            {demographics.gender.total === 0 ? <p className="text-muted-foreground text-sm">No data available.</p> : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {([{ label: 'Male', key: 'Male' as const, color: 'bg-blue-500/10', text: 'text-blue-600' }, { label: 'Female', key: 'Female' as const, color: 'bg-pink-500/10', text: 'text-pink-600' }, { label: 'Other / Not specified', key: 'Other' as const, color: 'bg-purple-500/10', text: 'text-purple-600' }]).map(({ label, key, color, text }) => {
                  const count = demographics.gender[key]
                  const pct = demographics.gender.total > 0 ? Math.round((count / demographics.gender.total) * 1000) / 10 : 0
                  return (
                    <div key={key} className={`rounded-xl p-5 ${color} flex flex-col gap-1`}>
                      <p className={`text-3xl font-bold ${text}`}>{count}</p>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{pct}% of respondents</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* High Risk Alert */}
          {(() => {
            const pct = demographics.totalUsers > 0 ? Math.round((demographics.highRiskCount / demographics.totalUsers) * 1000) / 10 : 0
            return (
              <div className="border-2 border-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                  <div className="flex-1 space-y-3">
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">High Risk Alert Summary</h2>
                    <div className="flex flex-wrap gap-6">
                      <div><p className="text-3xl font-bold text-red-600 dark:text-red-400">{demographics.highRiskCount}</p><p className="text-sm text-muted-foreground">High / Critical respondents</p></div>
                      <div><p className="text-3xl font-bold text-red-600 dark:text-red-400">{pct}%</p><p className="text-sm text-muted-foreground">of total respondents</p></div>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 rounded-lg px-4 py-2 inline-block">⚠ These respondents may need immediate attention.</p>
                  </div>
                </div>
              </div>
            )
          })()}
        </>
      )}

      {/* AI Analytics Section */}
      <div className="border-2 border-primary/50 bg-primary/5 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">AI Analytics Assistant</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Dive deeper into your data with AI-powered analysis. Ask questions about specific users, identify trends, and get actionable insights.
            </p>
            <Link
              href="/admin/analytics/ai"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Brain className="w-4 h-4" />
              Launch AI Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
