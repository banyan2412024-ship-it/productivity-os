import { useEffect, useState } from 'react'
import { useProfileStore } from '../stores/profileStore'
import { Navigate } from 'react-router-dom'

const ALL_MODULES = ['tasks', 'notes', 'ideas', 'habits', 'pomodoro', 'money', 'smoking']

export default function AdminPage() {
  const myProfile = useProfileStore((s) => s.profile)
  const getAllProfiles = useProfileStore((s) => s.getAllProfiles)
  const adminUpdate = useProfileStore((s) => s.adminUpdateProfile)
  const adminReset = useProfileStore((s) => s.adminResetUserData)

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)
  const [resetConfirm, setResetConfirm] = useState(null)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    getAllProfiles().then((data) => { setUsers(data); setLoading(false) })
  }, [])

  if (!myProfile) return null
  if (!myProfile.is_admin) return <Navigate to="/app" replace />

  const refresh = () => getAllProfiles().then(setUsers)

  const approve = async (id) => {
    setBusy(id); setActionError(null)
    const ok = await adminUpdate(id, { status: 'approved' })
    if (!ok) setActionError('APPROVE FAILED — check console')
    await refresh()
    setBusy(null)
  }

  const reject = async (id) => {
    setBusy(id); setActionError(null)
    const ok = await adminUpdate(id, { status: 'rejected' })
    if (!ok) setActionError('REJECT FAILED — check console')
    await refresh()
    setBusy(null)
  }

  const toggleAdmin = async (id, current) => {
    setBusy(id)
    await adminUpdate(id, { is_admin: !current })
    await refresh()
    setBusy(null)
  }

  const toggleModule = async (id, modules, key) => {
    const next = modules.includes(key) ? modules.filter((k) => k !== key) : [...modules, key]
    await adminUpdate(id, { enabled_modules: next })
    await refresh()
  }

  const resetData = async (id) => {
    setBusy(id)
    await adminReset(id)
    setResetConfirm(null)
    setBusy(null)
  }

  const pending = users.filter((u) => u.status === 'pending')
  const others  = users.filter((u) => u.status !== 'pending')

  const statusColor = (s) => s === 'approved' ? 'var(--neon)' : s === 'pending' ? 'var(--amber)' : 'var(--danger)'

  return (
    <div style={{ padding: '28px', fontFamily: 'var(--font-mono)', color: 'var(--text)', maxWidth: '700px' }}>
      <h1 style={{ fontSize: '13px', color: 'var(--neon)', marginBottom: '24px', letterSpacing: '3px' }}>
        &gt; ADMIN PANEL
      </h1>

      {loading && <p style={{ color: 'var(--text-ghost)', fontSize: '11px' }}>&gt; loading...</p>}
      {actionError && <p style={{ color: 'var(--danger)', fontSize: '10px', marginBottom: '12px' }}>&gt; {actionError}</p>}

      {/* ─── Pending approvals ─────────────────────────────────── */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '10px', color: 'var(--amber)', letterSpacing: '2px', marginBottom: '10px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '4px' }}>
            PENDING APPROVAL ({pending.length})
          </div>
          {pending.map((u) => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--border-dark)' }}>
              <span style={{ fontSize: '12px', color: 'var(--neon)', flex: 1 }}>{u.username}</span>
              <span style={{ fontSize: '9px', color: 'var(--text-ghost)' }}>{new Date(u.created_at).toLocaleDateString()}</span>
              <button
                onClick={() => approve(u.id)}
                disabled={busy === u.id}
                style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', padding: '3px 10px', border: '1px solid var(--neon)', color: 'var(--neon)', background: 'transparent', cursor: 'pointer' }}
              >
                [ APPROVE ]
              </button>
              <button
                onClick={() => reject(u.id)}
                disabled={busy === u.id}
                style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', padding: '3px 10px', border: '1px solid var(--danger)', color: 'var(--danger)', background: 'transparent', cursor: 'pointer' }}
              >
                [ REJECT ]
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ─── All users ─────────────────────────────────────────── */}
      <div style={{ fontSize: '10px', color: 'var(--text-ghost)', letterSpacing: '2px', marginBottom: '10px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '4px' }}>
        ALL USERS ({others.length})
      </div>
      {others.map((u) => (
        <div key={u.id} style={{ marginBottom: '16px', padding: '12px', border: '1px solid var(--border-dark)', background: 'var(--bg-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--neon)', fontWeight: 'bold' }}>{u.username}</span>
            <span style={{ fontSize: '9px', color: statusColor(u.status) }}>[{u.status.toUpperCase()}]</span>
            <span style={{ fontSize: '9px', color: 'var(--text-ghost)', marginLeft: 'auto' }}>
              {new Date(u.created_at).toLocaleDateString()}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {ALL_MODULES.map((mod) => {
              const on = (u.enabled_modules ?? []).includes(mod)
              return (
                <button
                  key={mod}
                  onClick={() => toggleModule(u.id, u.enabled_modules ?? [], mod)}
                  style={{
                    fontSize: '8px', fontFamily: 'var(--font-mono)', padding: '2px 7px',
                    border: `1px solid ${on ? 'var(--neon)' : 'var(--border-mid)'}`,
                    color: on ? 'var(--neon)' : 'var(--text-ghost)',
                    background: 'transparent', cursor: 'pointer',
                  }}
                >
                  {mod}
                </button>
              )
            })}
            <button
              onClick={async () => { await adminUpdate(u.id, { pg13_mode: !u.pg13_mode }); refresh() }}
              style={{
                fontSize: '8px', fontFamily: 'var(--font-mono)', padding: '2px 7px',
                border: `1px solid ${u.pg13_mode ? 'var(--amber)' : 'var(--border-mid)'}`,
                color: u.pg13_mode ? 'var(--amber)' : 'var(--text-ghost)',
                background: 'transparent', cursor: 'pointer',
              }}
            >
              PG-13
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {u.status !== 'approved' && (
              <button onClick={() => approve(u.id)} disabled={busy === u.id}
                style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', padding: '2px 8px', border: '1px solid var(--neon)', color: 'var(--neon)', background: 'transparent', cursor: 'pointer' }}>
                [ APPROVE ]
              </button>
            )}
            {u.status === 'approved' && (
              <button onClick={() => reject(u.id)} disabled={busy === u.id}
                style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', padding: '2px 8px', border: '1px solid var(--danger)', color: 'var(--danger)', background: 'transparent', cursor: 'pointer' }}>
                [ REVOKE ]
              </button>
            )}
            {u.id !== myProfile.id && (
              <button onClick={() => toggleAdmin(u.id, u.is_admin)} disabled={busy === u.id}
                style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', padding: '2px 8px', border: '1px solid var(--cyan)', color: u.is_admin ? 'var(--cyan)' : 'var(--text-ghost)', background: 'transparent', cursor: 'pointer' }}>
                {u.is_admin ? '[ REMOVE ADMIN ]' : '[ MAKE ADMIN ]'}
              </button>
            )}
            {u.id !== myProfile.id && (
              resetConfirm === u.id ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--danger)' }}>sure?</span>
                  <button onClick={() => resetData(u.id)} disabled={busy === u.id}
                    style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', padding: '2px 8px', border: '1px solid var(--danger-bright)', color: 'var(--danger-bright)', background: 'transparent', cursor: 'pointer' }}>
                    [ YES, WIPE ]
                  </button>
                  <button onClick={() => setResetConfirm(null)}
                    style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', padding: '2px 8px', border: '1px solid var(--border-mid)', color: 'var(--text-ghost)', background: 'transparent', cursor: 'pointer' }}>
                    [ CANCEL ]
                  </button>
                </span>
              ) : (
                <button onClick={() => setResetConfirm(u.id)}
                  style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', padding: '2px 8px', border: '1px solid var(--danger)', color: 'var(--danger)', background: 'transparent', cursor: 'pointer' }}>
                  [ RESET DATA ]
                </button>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
