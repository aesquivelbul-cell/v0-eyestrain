'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface DailyLog {
  id: string
  date: string
  screen_time: number
  sleep_hours: number
  brightness: number
  eye_strain: number
  headaches: number
  blurry_vision: number
  dry_eyes: number
  risk_level: string
}

interface UserProfile {
  first_name?: string
  last_name?: string
  email?: string
  age?: number | string
  gender?: string
  year_level?: string
  field_of_study?: string
}

interface UserDetailResponse {
  profile: UserProfile | null
  logs: DailyLog[]
}

const riskColors: Record<string, string> = {
  Low: 'text-green-600',
  Moderate: 'text-yellow-600',
  High: 'text-orange-600',
  Critical: 'text-red-600',
}

function activeSymptoms(log: DailyLog): string {
  const s: string[] = []
  if (log.eye_strain === 1) s.push('Eye Strain')
  if (log.headaches === 1) s.push('Headaches')
  if (log.blurry_vision === 1) s.push('Blurry Vision')
  if (log.dry_eyes === 1) s.push('Dry Eyes')
  return s.length > 0 ? s.join(', ') : 'None'
}

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const router = useRouter()
  const [data, setData] = useState<UserDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return
    fetch(`/api/admin/users/${userId}`)
      .then(async (res) => {
        if (res.status === 404) throw new Error('not_found')
        if (!res.ok) throw new Error('fetch_error')
        return res.json()
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message === 'not_found' ? 'No logs found for this user.' : 'Failed to load user data.'))
      .finally(() => setLoading(false))
  }, [userId])

  const displayName = data?.profile
    ? [data.profile.first_name, data.profile.last_name].filter(Boolean).join(' ')
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Detail</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{decodeURIComponent(userId)}</p>
        </div>
      </div>

      {loading && <p aria-busy="true" className="text-muted-foreground">Loading…</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}

      {data && (
        <>
          {/* Profile */}
          <section aria-labelledby="profile-heading" className="border border-border rounded-xl p-6">
            <h2 id="profile-heading" className="text-lg font-semibold text-foreground mb-4">Profile</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div className="col-span-2 sm:col-span-3">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium text-foreground mt-0.5">
                  {data.profile?.email ?? decodeURIComponent(userId)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Age</dt>
                <dd className="font-medium text-foreground mt-0.5">{data.profile?.age ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Gender</dt>
                <dd className="font-medium text-foreground mt-0.5">{data.profile?.gender ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Year Level</dt>
                <dd className="font-medium text-foreground mt-0.5">{data.profile?.year_level ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Field of Study</dt>
                <dd className="font-medium text-foreground mt-0.5">{data.profile?.field_of_study ?? '—'}</dd>
              </div>
            </dl>
          </section>

          {/* Log history */}
          <section aria-labelledby="logs-heading">
            <h2 id="logs-heading" className="text-lg font-semibold text-foreground mb-4">
              Log History ({data.logs.length})
            </h2>

            {data.logs.length === 0 ? (
              <p className="text-muted-foreground">No logs found for this user.</p>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <caption className="sr-only">Daily log history</caption>
                    <thead className="bg-muted">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground">Date</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground">Screen Time</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground">Sleep Hours</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground">Brightness</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground">Symptoms</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-foreground">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.logs.map((log) => (
                        <tr key={log.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-foreground">{log.date}</td>
                          <td className="px-4 py-3 text-muted-foreground">{log.screen_time}h</td>
                          <td className="px-4 py-3 text-muted-foreground">{log.sleep_hours}h</td>
                          <td className="px-4 py-3 text-muted-foreground">{log.brightness}%</td>
                          <td className="px-4 py-3 text-muted-foreground">{activeSymptoms(log)}</td>
                          <td className={`px-4 py-3 font-medium ${riskColors[log.risk_level] ?? 'text-foreground'}`}>
                            {log.risk_level || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
