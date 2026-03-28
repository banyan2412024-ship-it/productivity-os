import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useProfileStore } from '../stores/profileStore'
import { supabase } from '../lib/supabase'
import MatrixLoader from './MatrixLoader'

/* ── Shared styles ─────────────────────────────────────────────────────────── */

const panelStyle = {
  width: 'min(340px, calc(100vw - 32px))',
  background: 'rgba(10, 19, 10, 0.85)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(0, 255, 65, 0.2)',
  boxShadow: '0 0 30px rgba(0, 255, 65, 0.1), inset 0 0 20px rgba(0, 0, 0, 0.5)',
}

const btnStyle = (disabled) => ({
  width: '100%', marginTop: '4px', opacity: disabled ? 0.5 : 1,
  fontFamily: 'monospace', fontSize: '11px', letterSpacing: '1px',
  padding: '10px', cursor: disabled ? 'default' : 'pointer',
  background: 'rgba(0, 255, 65, 0.08)', color: '#00ff41',
  border: '1px solid rgba(0, 255, 65, 0.3)',
  transition: 'all 0.2s',
})

const inputStyle = {
  width: '100%', fontFamily: 'monospace', fontSize: '12px',
  padding: '8px 10px', background: 'rgba(0, 0, 0, 0.6)',
  border: '1px solid rgba(0, 255, 65, 0.2)', color: '#00ff41',
  outline: 'none',
}

const labelStyle = {
  fontSize: '9px', color: 'rgba(0, 255, 65, 0.4)', fontFamily: 'monospace',
  textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px', display: 'block',
}

const titleBarStyle = {
  padding: '8px 12px', borderBottom: '1px solid rgba(0, 255, 65, 0.15)',
  fontFamily: 'monospace', fontSize: '11px', color: '#00ff41',
  letterSpacing: '2px', display: 'flex', justifyContent: 'space-between',
}

/* ── Persist via sessionStorage — survives HMR, module reload, tab sleep ──── */
function isGranted() { return sessionStorage.getItem('auth_granted') === '1' }
function markGranted() { sessionStorage.setItem('auth_granted', '1') }
function clearGranted() { sessionStorage.removeItem('auth_granted') }

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function AuthGate({ children }) {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const signUp = useAuthStore((s) => s.signUp)
  const linkEmail = useAuthStore((s) => s.linkEmail)
  const profile = useProfileStore((s) => s.profile)
  const profileLoading = useProfileStore((s) => s.profileLoading)
  const createProfile = useProfileStore((s) => s.createProfile)

  const alreadyGranted = isGranted()

  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  // Loading screen state — skip animation if already granted this session
  const [progress, setProgress] = useState(alreadyGranted ? 100 : 0)
  const [granted, setGranted] = useState(alreadyGranted)
  const [visible, setVisible] = useState(!alreadyGranted)

  const showErr = (msg, ms = 4000) => { setError(msg); setTimeout(() => setError(''), ms) }

  // Clear granted flag on sign-out so next login shows animation
  useEffect(() => {
    if (!user && !loading) clearGranted()
  }, [user, loading])

  // ── Drive progress from real states ────────────────────────────────────────
  useEffect(() => {
    if (loading) setProgress(15)
    else if (!user) setProgress(100) // no user — go straight to login (no HUD)
    else if (profileLoading) setProgress(50)
    else if (profile?.status === 'approved') setProgress(100)
    else setProgress(100) // pending/rejected/no-profile — show form
  }, [loading, user, profileLoading, profile])

  // ── ACCESS GRANTED sequence (only once per session) ────────────────────────
  useEffect(() => {
    if (progress >= 100 && user && profile?.status === 'approved' && !granted) {
      markGranted()
      setGranted(true)
      setTimeout(() => setVisible(false), 1800)
    }
  }, [progress, user, profile, granted])

  // ── Already granted this session — NEVER show ACCESS GRANTED animation again ──
  if (alreadyGranted) {
    // Silently wait while auth resolves (avoids ACCESS GRANTED flash on page load/navigate)
    if (loading || (user && profileLoading)) return null
    // App ready — straight to app
    if (user && profile?.status === 'approved') return children
    // Auth degraded (signed out / rejected) — show login directly, no matrix
    // The clearGranted() useEffect will fire on next tick
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a130a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!user && <LoginRegisterForm
          tab={tab} setTab={setTab} email={email} setEmail={setEmail}
          password={password} setPassword={setPassword} username={username}
          setUsername={setUsername} error={error} info={info} busy={busy}
          setBusy={setBusy} showErr={showErr} setInfo={setInfo} signUp={signUp}
        />}
        {user && !profile && <SetupForm
          user={user} username={username} setUsername={setUsername}
          email={email} setEmail={setEmail} password={password} setPassword={setPassword}
          error={error} busy={busy} setBusy={setBusy} showErr={showErr}
          linkEmail={linkEmail} createProfile={createProfile}
        />}
        {user && profile?.status === 'pending' && <PendingPanel username={profile.username} />}
        {user && profile?.status === 'rejected' && <RejectedPanel />}
      </div>
    )
  }

  // ── Fresh session (no prior grant) — show Matrix rain + auth UI ───────────
  const isReady = user && profile?.status === 'approved'
  const showLoadingHud = loading || (user && profileLoading)
  const showForm = !loading && !profileLoading && !granted

  if (isReady && !visible) return children
  if (isReady && visible) {
    return (
      <>
        {children}
        <MatrixLoader progress={100} showHud={false} granted={granted} />
      </>
    )
  }

  return (
    <MatrixLoader progress={progress} showHud={showLoadingHud} granted={granted}>
      {showForm && !user && <LoginRegisterForm
        tab={tab} setTab={setTab} email={email} setEmail={setEmail}
        password={password} setPassword={setPassword} username={username}
        setUsername={setUsername} error={error} info={info} busy={busy}
        setBusy={setBusy} showErr={showErr} setInfo={setInfo} signUp={signUp}
      />}
      {showForm && user && !profile && <SetupForm
        user={user} username={username} setUsername={setUsername}
        email={email} setEmail={setEmail} password={password} setPassword={setPassword}
        error={error} busy={busy} setBusy={setBusy} showErr={showErr}
        linkEmail={linkEmail} createProfile={createProfile}
      />}
      {showForm && user && profile?.status === 'pending' && <PendingPanel username={profile.username} />}
      {showForm && user && profile?.status === 'rejected' && <RejectedPanel />}
    </MatrixLoader>
  )
}

/* ── Login / Register ──────────────────────────────────────────────────────── */

function LoginRegisterForm({ tab, setTab, email, setEmail, password, setPassword, username, setUsername, error, info, busy, setBusy, showErr, setInfo, signUp }) {
  const handleLogin = async (e) => {
    e.preventDefault()
    setBusy(true); setInfo('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (err) showErr(err.message)
    setBusy(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!username.trim()) return showErr('USERNAME REQUIRED')
    setBusy(true); setInfo('')
    try {
      const { needsEmailConfirm } = await signUp(email.trim(), password, username.trim())
      if (needsEmailConfirm) { setInfo('CHECK YOUR EMAIL — confirm then log in.'); setBusy(false); return }
      sessionStorage.setItem('pending_username', username.trim())
    } catch (err) {
      const msg = err.message?.toLowerCase() ?? ''
      if (msg.includes('rate limit') || msg.includes('email_rate_limit')) {
        showErr('TOO MANY SIGNUPS — try again in a few minutes, or contact the admin.')
      } else {
        showErr(err.message)
      }
    }
    setBusy(false)
  }

  const tabBtnStyle = (active) => ({
    flex: 1, padding: '10px 8px', fontSize: '11px', fontFamily: 'monospace',
    background: active ? 'rgba(0,255,65,0.1)' : 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid #00ff41' : '2px solid rgba(0,255,65,0.15)',
    color: active ? '#00ff41' : 'rgba(0,255,65,0.6)',
    cursor: 'pointer', letterSpacing: '1px',
    transition: 'all 0.2s',
    fontWeight: active ? 'bold' : 'normal',
  })

  return (
    <div style={panelStyle}>
      <div style={titleBarStyle}>
        <span>■ AUTHENTICATION</span>
        <span style={{ color: 'rgba(0,255,65,0.3)' }}>v2.0</span>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,255,65,0.1)' }}>
        <button style={tabBtnStyle(tab === 'login')} onClick={() => { setTab('login'); showErr('') }}>[ LOGIN ]</button>
        <button style={tabBtnStyle(tab === 'register')} onClick={() => { setTab('register'); showErr('') }}>[ REGISTER ]</button>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {tab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div><label style={labelStyle}>&gt; Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} autoFocus /></div>
            <div><label style={labelStyle}>&gt; Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} /></div>
            <button type="submit" disabled={busy} style={btnStyle(busy)}>
              {busy ? '[ CONNECTING... ]' : '[ AUTHENTICATE ]'}
            </button>
          </form>
        )}

        {tab === 'register' && (
          <>
            <p style={{ color: 'rgba(0,255,65,0.5)', fontSize: '10px', margin: 0, lineHeight: 1.6, fontFamily: 'monospace' }}>
              &gt; Register for an account.<br />&gt; An admin will approve your request.
            </p>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div><label style={labelStyle}>&gt; Username</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_handle" style={inputStyle} autoFocus /></div>
              <div><label style={labelStyle}>&gt; Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} /></div>
              <div><label style={labelStyle}>&gt; Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} /></div>
              <button type="submit" disabled={busy} style={btnStyle(busy)}>
                {busy ? '[ REGISTERING... ]' : '[ REGISTER ]'}
              </button>
            </form>
          </>
        )}

        {error && <p style={{ color: '#ff2244', fontSize: '11px', margin: 0, fontFamily: 'monospace' }}>&gt; {error}</p>}
        {info && <p style={{ color: '#00e5cc', fontSize: '11px', margin: 0, fontFamily: 'monospace' }}>&gt; {info}</p>}
      </div>
    </div>
  )
}

/* ── Profile Setup ─────────────────────────────────────────────────────────── */

function SetupForm({ user, username, setUsername, email, setEmail, password, setPassword, error, busy, setBusy, showErr, linkEmail, createProfile }) {
  const isAnon = user.is_anonymous
  const handleSetup = async (e) => {
    e.preventDefault()
    if (!username.trim()) return showErr('USERNAME REQUIRED')
    setBusy(true)
    try {
      if (isAnon && email && password) await linkEmail(email.trim(), password)
      const p = await createProfile(user.id, username.trim())
      if (!p) showErr('FAILED — try a different username or refresh')
    } catch (err) { showErr(err.message || 'UNKNOWN ERROR') }
    finally { setBusy(false) }
  }

  return (
    <div style={panelStyle}>
      <div style={titleBarStyle}><span>■ INITIALIZE PROFILE</span></div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ color: 'rgba(0,255,65,0.5)', fontSize: '10px', margin: 0, lineHeight: 1.6, fontFamily: 'monospace' }}>
          &gt; Set your username to continue.
          {isAnon && <><br />&gt; Optionally link an email to secure your account.</>}
        </p>
        <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div><label style={labelStyle}>&gt; Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_handle" style={inputStyle} autoFocus /></div>
          {isAnon && (
            <>
              <div><label style={labelStyle}>&gt; Email (optional)</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} /></div>
              {email && <div><label style={labelStyle}>&gt; Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} /></div>}
            </>
          )}
          <button type="submit" disabled={busy} style={btnStyle(busy)}>
            {busy ? '[ SAVING... ]' : '[ CONFIRM ]'}
          </button>
        </form>
        {error && <p style={{ color: '#ff2244', fontSize: '11px', margin: 0, fontFamily: 'monospace' }}>&gt; {error}</p>}
      </div>
    </div>
  )
}

/* ── Pending / Rejected ────────────────────────────────────────────────────── */

function PendingPanel({ username }) {
  return (
    <div style={panelStyle}>
      <div style={titleBarStyle}><span>■ ACCESS PENDING</span></div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ color: 'rgba(0,255,65,0.5)', fontSize: '11px', margin: 0, lineHeight: 1.7, fontFamily: 'monospace' }}>
          &gt; Account <span style={{ color: '#00ff41' }}>{username}</span> registered.<br />
          &gt; Awaiting admin approval.<br />
          &gt; You will be able to log in once approved.
        </p>
        <button onClick={() => supabase.auth.signOut()} style={{ ...btnStyle(false), marginTop: '8px' }}>[ SIGN OUT ]</button>
      </div>
    </div>
  )
}

function RejectedPanel() {
  return (
    <div style={panelStyle}>
      <div style={titleBarStyle}><span>■ ACCESS DENIED</span></div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ color: '#ff2244', fontSize: '11px', margin: 0, fontFamily: 'monospace' }}>&gt; Your account request was not approved.</p>
        <button onClick={() => supabase.auth.signOut()} style={btnStyle(false)}>[ SIGN OUT ]</button>
      </div>
    </div>
  )
}
