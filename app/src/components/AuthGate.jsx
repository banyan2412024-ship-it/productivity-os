import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useProfileStore } from '../stores/profileStore'
import { supabase } from '../lib/supabase'

const btnStyle = (disabled) => ({
  width: '100%',
  marginTop: '4px',
  opacity: disabled ? 0.5 : 1,
  fontFamily: 'var(--font-mono)',
})

const inputStyle = { width: '100%', fontFamily: 'var(--font-mono)' }

const labelStyle = {
  fontSize: '9px',
  color: 'var(--text-ghost)',
  fontFamily: 'var(--font-mono)',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: '2px',
  display: 'block',
}

export default function AuthGate({ children }) {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const signUp = useAuthStore((s) => s.signUp)
  const linkEmail = useAuthStore((s) => s.linkEmail)
  const profile = useProfileStore((s) => s.profile)
  const profileLoading = useProfileStore((s) => s.profileLoading)
  const createProfile = useProfileStore((s) => s.createProfile)

  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const showErr = (msg, ms = 4000) => {
    setError(msg)
    setTimeout(() => setError(''), ms)
  }

  // ── Loading — only block on auth, not profile (profile loads lazily) ─────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', color: 'var(--neon-dim)', fontSize: '11px' }}>
        &gt; INITIALIZING...
      </div>
    )
  }

  // ── Authenticated + profile exists ───────────────────────────────────────────
  if (user && profile) {
    // Pending approval
    if (profile.status === 'pending') {
      return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>
          <div style={{ width: '340px', background: 'var(--bg-surface)', border: '1px solid var(--border-mid)' }}>
            <div className="title-bar">
              <span>■ ACCESS PENDING</span>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ color: 'var(--text-dim)', fontSize: '11px', margin: 0, lineHeight: 1.7 }}>
                &gt; Account <span style={{ color: 'var(--neon)' }}>{profile.username}</span> registered.<br />
                &gt; Awaiting admin approval.<br />
                &gt; You will be able to log in once approved.
              </p>
              <button onClick={() => supabase.auth.signOut()} style={{ ...btnStyle(false), marginTop: '8px' }}>
                [ SIGN OUT ]
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (profile.status === 'rejected') {
      return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>
          <div style={{ width: '340px', background: 'var(--bg-surface)', border: '1px solid var(--border-mid)' }}>
            <div className="title-bar">
              <span>■ ACCESS DENIED</span>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ color: 'var(--danger)', fontSize: '11px', margin: 0 }}>
                &gt; Your account request was not approved.
              </p>
              <button onClick={() => supabase.auth.signOut()} style={btnStyle(false)}>
                [ SIGN OUT ]
              </button>
            </div>
          </div>
        </div>
      )
    }

    return children
  }

  // ── Authenticated but no profile yet (existing anonymous user or post-signup) ─
  if (user && !profile) {
    const isAnon = user.is_anonymous
    const handleSetup = async (e) => {
      e.preventDefault()
      if (!username.trim()) return showErr('USERNAME REQUIRED')
      setBusy(true)
      try {
        if (isAnon && email && password) {
          await linkEmail(email.trim(), password)
        }
        const p = await createProfile(user.id, username.trim())
        if (!p) showErr('FAILED — try a different username or refresh')
      } catch (err) {
        showErr(err.message || 'UNKNOWN ERROR')
      } finally {
        setBusy(false)
      }
    }

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>
        <div style={{ width: '340px', background: 'var(--bg-surface)', border: '1px solid var(--border-mid)' }}>
          <div className="title-bar">
            <span>■ INITIALIZE PROFILE</span>
          </div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '10px', margin: 0, lineHeight: 1.6 }}>
              &gt; Set your username to continue.
              {isAnon && <><br />&gt; Optionally link an email to secure your account.</>}
            </p>
            <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={labelStyle}>&gt; Username</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_handle" style={inputStyle} autoFocus />
              </div>
              {isAnon && (
                <>
                  <div>
                    <label style={labelStyle}>&gt; Email (optional)</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
                  </div>
                  {email && (
                    <div>
                      <label style={labelStyle}>&gt; Password</label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                    </div>
                  )}
                </>
              )}
              <button type="submit" disabled={busy} style={btnStyle(busy)}>
                {busy ? '[ SAVING... ]' : '[ CONFIRM ]'}
              </button>
            </form>
            {error && <p style={{ color: 'var(--danger)', fontSize: '11px', margin: 0 }}>&gt; {error}</p>}
          </div>
        </div>
      </div>
    )
  }

  // ── Not authenticated ─────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setBusy(true)
    setInfo('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (err) showErr(err.message)
    setBusy(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!username.trim()) return showErr('USERNAME REQUIRED')
    setBusy(true)
    setInfo('')
    try {
      const { needsEmailConfirm } = await signUp(email.trim(), password, username.trim())
      // Profile will be created after auth state resolves in onAuthStateChange
      // We need to create it after user object is available
      if (needsEmailConfirm) {
        setInfo('CHECK YOUR EMAIL — confirm then log in.')
        setBusy(false)
        return
      }
      // If no email confirm needed, onAuthStateChange fires and we handle profile creation there
      // But we need the username — store it temporarily
      sessionStorage.setItem('pending_username', username.trim())
    } catch (err) {
      showErr(err.message)
    }
    setBusy(false)
  }

  const tabStyle = (active) => ({
    flex: 1,
    padding: '6px',
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    background: active ? 'var(--neon-ghost)' : 'transparent',
    borderBottom: active ? '2px solid var(--neon)' : '2px solid transparent',
    color: active ? 'var(--neon)' : 'var(--text-ghost)',
    cursor: 'pointer',
    border: 'none',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>
      <div style={{ width: '340px', background: 'var(--bg-surface)', border: '1px solid var(--border-mid)' }}>
        <div className="title-bar" style={{ justifyContent: 'space-between' }}>
          <span>■ AUTHENTICATION</span>
          <span style={{ color: 'var(--text-ghost)' }}>v2.0</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-mid)' }}>
          <button style={tabStyle(tab === 'login')} onClick={() => { setTab('login'); setError(''); setInfo('') }}>
            [ LOGIN ]
          </button>
          <button style={tabStyle(tab === 'register')} onClick={() => { setTab('register'); setError(''); setInfo('') }}>
            [ REGISTER ]
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={labelStyle}>&gt; Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} autoFocus />
              </div>
              <div>
                <label style={labelStyle}>&gt; Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
              </div>
              <button type="submit" disabled={busy} style={btnStyle(busy)}>
                {busy ? '[ CONNECTING... ]' : '[ AUTHENTICATE ]'}
              </button>
            </form>
          )}

          {tab === 'register' && (
            <>
              <p style={{ color: 'var(--text-dim)', fontSize: '10px', margin: 0, lineHeight: 1.6 }}>
                &gt; Register for an account.<br />
                &gt; An admin will approve your request.
              </p>
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>&gt; Username</label>
                  <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_handle" style={inputStyle} autoFocus />
                </div>
                <div>
                  <label style={labelStyle}>&gt; Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>&gt; Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                </div>
                <button type="submit" disabled={busy} style={btnStyle(busy)}>
                  {busy ? '[ REGISTERING... ]' : '[ REGISTER ]'}
                </button>
              </form>
            </>
          )}

          {error && <p style={{ color: 'var(--danger)', fontSize: '11px', margin: 0 }}>&gt; {error}</p>}
          {info  && <p style={{ color: 'var(--cyan)',   fontSize: '11px', margin: 0 }}>&gt; {info}</p>}
        </div>
      </div>
    </div>
  )
}
