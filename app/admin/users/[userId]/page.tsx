'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Lock, Send, Copy, Check } from 'lucide-react'

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

interface AuditEventData {
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  changedFields?: string[]
  [key: string]: unknown
}

interface AuditEvent {
  id: string
  event_type: string
  description: string
  actor_email: string | null
  actor_id?: string | null
  created_at: string
  event_data?: AuditEventData | null
}

interface ProfileForm {
  first_name?: string
  last_name?: string
  age?: number | string
  gender?: string
  year_level?: string
  field_of_study?: string
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
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [auditLoading, setAuditLoading] = useState(true)
  const [auditError, setAuditError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [profileForm, setProfileForm] = useState<ProfileForm>({})
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')

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

  useEffect(() => {
    if (!userId) return
    setAuditLoading(true)
    setAuditError('')

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
    const queryParam = isUuid ? `userId=${encodeURIComponent(userId)}` : `userEmail=${encodeURIComponent(data?.profile?.email || decodeURIComponent(userId))}`

    fetch(`/api/admin/audit?${queryParam}&limit=50`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json?.error || 'Failed to load audit history')
        }
        setAuditEvents(json.events || [])
      })
      .catch((err) => {
        if (err instanceof Error) {
          setAuditError(err.message)
        } else if (typeof err === 'string') {
          setAuditError(err)
        } else {
          setAuditError(JSON.stringify(err))
        }
      })
      .finally(() => setAuditLoading(false))
  }, [userId, data?.profile?.email])

  useEffect(() => {
    if (!data?.profile) return

    setProfileForm({
      first_name: data.profile.first_name ?? '',
      last_name: data.profile.last_name ?? '',
      age: data.profile.age ?? '',
      gender: data.profile.gender ?? '',
      year_level: data.profile.year_level ?? '',
      field_of_study: data.profile.field_of_study ?? '',
    })
  }, [data?.profile])

  const displayName = data?.profile
    ? [data.profile.first_name, data.profile.last_name].filter(Boolean).join(' ')
    : null

  const isRegistered = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
  const canGenerateTempPassword = isRegistered

  const handleSendResetEmail = async () => {
    const email = data?.profile?.email || decodeURIComponent(userId)
    setResetLoading(true)
    setResetMessage('')
    try {
      const res = await fetch('/api/admin/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: email, action: 'send-reset-email' }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to send email')
      setResetMessage('Password reset email sent successfully!')
      setTimeout(() => setShowPasswordModal(false), 2000)
    } catch (err) {
      setResetMessage(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setResetLoading(false)
    }
  }

  const handleGenerateTempPassword = async () => {
    setResetLoading(true)
    setResetMessage('')
    setTempPassword('')
    try {
      const res = await fetch('/api/admin/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'generate-temp-password' }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to generate password')
      setTempPassword(result.tempPassword)
      setResetMessage(result.message)
    } catch (err) {
      setResetMessage(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setResetLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInputChange = (field: keyof ProfileForm, value: string | number) => {
    setProfileForm((current) => ({ ...current, [field]: value }))
  }

  const handleToggleEdit = () => {
    setIsEditing((value) => !value)
    setSaveMessage('')
    setSaveError('')
  }

  const handleSaveProfile = async () => {
    if (!userId) return
    setSaveLoading(true)
    setSaveMessage('')
    setSaveError('')

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileForm }),
      })

      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.error || 'Failed to save profile')
      }

      setSaveMessage('Profile updated successfully.')
      setIsEditing(false)
      setData((current) => current ? { ...current, profile: { ...current.profile, ...profileForm } } : current)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaveLoading(false)
    }
  }

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 id="profile-heading" className="text-lg font-semibold text-foreground">Profile</h2>
                <p className="text-sm text-muted-foreground mt-1">Update registered user profile details and review account metadata.</p>
              </div>
              {isRegistered && (
                <button
                  onClick={handleToggleEdit}
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </button>
              )}
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="mt-1 text-sm font-medium text-foreground">{data.profile?.email ?? decodeURIComponent(userId)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="mt-1 text-sm font-medium text-foreground">{displayName || '—'}</p>
                </div>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="text-sm font-medium text-muted-foreground">First name</label>
                    <input
                      id="firstName"
                      value={profileForm.first_name}
                      onChange={(event) => handleInputChange('first_name', event.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="text-sm font-medium text-muted-foreground">Last name</label>
                    <input
                      id="lastName"
                      value={profileForm.last_name}
                      onChange={(event) => handleInputChange('last_name', event.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label htmlFor="age" className="text-sm font-medium text-muted-foreground">Age</label>
                    <input
                      id="age"
                      type="number"
                      value={profileForm.age}
                      onChange={(event) => handleInputChange('age', event.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label htmlFor="gender" className="text-sm font-medium text-muted-foreground">Gender</label>
                    <input
                      id="gender"
                      value={profileForm.gender}
                      onChange={(event) => handleInputChange('gender', event.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label htmlFor="yearLevel" className="text-sm font-medium text-muted-foreground">Year level</label>
                    <input
                      id="yearLevel"
                      value={profileForm.year_level}
                      onChange={(event) => handleInputChange('year_level', event.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label htmlFor="fieldOfStudy" className="text-sm font-medium text-muted-foreground">Field of study</label>
                    <input
                      id="fieldOfStudy"
                      value={profileForm.field_of_study}
                      onChange={(event) => handleInputChange('field_of_study', event.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              ) : (
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
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
              )}

              {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
              {saveMessage && <p className="text-sm text-foreground">{saveMessage}</p>}

              {isEditing && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={handleToggleEdit}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saveLoading}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    {saveLoading ? 'Saving…' : 'Save Profile'}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                <Lock className="w-4 h-4" />
                Reset Password
              </button>
            </div>
          </section>

          <section aria-labelledby="audit-heading" className="border border-border rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 id="audit-heading" className="text-lg font-semibold text-foreground">Audit History</h2>
                <p className="text-sm text-muted-foreground mt-1">Recent admin actions involving this user.</p>
              </div>
            </div>
            {auditLoading ? (
              <p className="text-sm text-muted-foreground">Loading audit history…</p>
            ) : auditError ? (
              <p role="alert" className="text-sm text-destructive">{auditError}</p>
            ) : auditEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No admin audit events found for this user.</p>
            ) : (
              <div className="space-y-3">
                {auditEvents.map((event) => {
                  const fieldLabels: Record<string, string> = {
                    first_name: 'First Name',
                    last_name: 'Last Name',
                    age: 'Age',
                    gender: 'Gender',
                    year_level: 'Year Level',
                    field_of_study: 'Field of Study',
                  }

                  const hasStructuredData =
                    event.event_data &&
                    Array.isArray(event.event_data.changedFields) &&
                    event.event_data.changedFields.length > 0 &&
                    event.event_data.before !== undefined &&
                    event.event_data.after !== undefined

                  return (
                    <div key={event.id} className="rounded-lg border border-border bg-background p-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-foreground">{event.event_type}</p>
                        <p className="text-sm text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>

                        {hasStructuredData ? (
                          <div className="mt-2 space-y-2">
                            {event.event_data!.changedFields!.map((field) => {
                              const label = fieldLabels[field] ?? field.replace(/_/g, ' ').replace(/(^|\s)\S/g, (c) => c.toUpperCase())
                              const before = event.event_data!.before?.[field]
                              const after = event.event_data!.after?.[field]
                              return (
                                <div key={field} className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                                  <span className="font-medium text-foreground">{label}:</span>{' '}
                                  <span className="text-muted-foreground line-through">{before != null && before !== '' ? String(before) : '—'}</span>
                                  {' → '}
                                  <span className="text-foreground font-medium">{after != null && after !== '' ? String(after) : '—'}</span>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-foreground">{event.description}</p>
                        )}

                        {(event.actor_email || event.actor_id) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Performed by {event.actor_email ?? event.actor_id}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Password Reset Modal */}
          {showPasswordModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Reset User Password</h2>
                
                {tempPassword ? (
                  // Show temp password
                  <div className="space-y-4">
                    <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 space-y-3">
                      <p className="text-sm text-foreground">
                        Temporary password generated. Share this with the user:
                      </p>
                      <div className="flex items-center gap-2 bg-background border border-border rounded px-3 py-2">
                        <code className="flex-1 font-mono text-sm font-semibold text-foreground">
                          {tempPassword}
                        </code>
                        <button
                          onClick={copyToClipboard}
                          className="p-1.5 hover:bg-muted rounded transition-colors"
                          title="Copy to clipboard"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ⚠️ The user should change this password immediately upon login.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowPasswordModal(false)
                          setTempPassword('')
                          setResetMessage('')
                        }}
                        className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  // Show options
                  <div className="space-y-4">
                    {resetMessage && (
                      <p className={`text-sm p-3 rounded-lg ${resetMessage.includes('Error') ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'}`}>
                        {resetMessage}
                      </p>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      Choose how to help the user reset their password:
                    </p>

                    <button
                      onClick={handleSendResetEmail}
                      disabled={resetLoading}
                      className="w-full flex items-center gap-2 px-4 py-3 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left text-sm"
                    >
                      <Send className="w-4 h-4 flex-shrink-0 text-blue-600" />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">Send Reset Email</div>
                        <div className="text-xs text-muted-foreground">User receives email to reset their password</div>
                      </div>
                    </button>

                    {!canGenerateTempPassword && (
                      <p className="text-xs text-muted-foreground">Temporary password generation is only available for registered users with a valid account.</p>
                    )}
                    <button
                      onClick={handleGenerateTempPassword}
                      disabled={resetLoading || !canGenerateTempPassword}
                      className="w-full flex items-center gap-2 px-4 py-3 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left text-sm"
                    >
                      <Lock className="w-4 h-4 flex-shrink-0 text-orange-600" />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">Generate Temp Password</div>
                        <div className="text-xs text-muted-foreground">You'll share a temporary password directly</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setShowPasswordModal(false)}
                      className="w-full px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

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
