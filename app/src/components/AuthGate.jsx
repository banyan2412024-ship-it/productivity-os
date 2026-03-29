import { useState, useEffect, useRef } from 'react'
import { useAuthStore, AUTH_STATE } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import MatrixLoader from './MatrixLoader'

/* ── Shared styles ─────────────────────────────────────────────────────────── */

const panelStyle = {
  width: 'min(340px, calc(100vw - 32px))',
  background: 'rgba(10, 19, 10, 0.92)',
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
  outline: 'none', boxSizing: 'border-box',
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

const centeredOverlay = {
  position: 'fixed', inset: 0, background: '#060d06',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  overflowY: 'auto', padding: '16px 0',
}

/* ── SESSION GRANT FLAG ────────────────────────────────────────────────────── */
function isGranted() { return sessionStorage.getItem('auth_granted') === '1' }
function markGranted() { sessionStorage.setItem('auth_granted', '1') }

/* ── ACCESS GRANTED animation wrapper ─────────────────────────────────────── */
function AccessGrantedThenApp({ children }) {
  const [showOverlay, setShowOverlay] = useState(!isGranted())
  const [granted, setGranted] = useState(isGranted())
  const timerRef = useRef(null)

  useEffect(() => {
    if (!isGranted()) {
      markGranted()
      setGranted(true)
      timerRef.current = setTimeout(() => setShowOverlay(false), 1800)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  if (!showOverlay) return children

  return (
    <>
      {children}
      <MatrixLoader progress={100} showHud={false} granted={granted} />
    </>
  )
}

/* ── Main AuthGate ─────────────────────────────────────────────────────────── */

export default function AuthGate({ children }) {
  const authState = useAuthStore((s) => s.authState)
  const profile = useAuthStore((s) => s.profile)
  const error = useAuthStore((s) => s.error)
  const retryAuth = useAuthStore((s) => s.retryAuth)
  const signUp = useAuthStore((s) => s.signUp)
  const signOut = useAuthStore((s) => s.signOut)

  switch (authState) {
    case AUTH_STATE.BOOTING:
      return <MatrixLoader progress={15} showHud granted={false} />

    case AUTH_STATE.LOADING:
      return <MatrixLoader progress={55} showHud granted={false} />

    case AUTH_STATE.READY:
      return <AccessGrantedThenApp>{children}</AccessGrantedThenApp>

    case AUTH_STATE.PENDING_APPROVAL:
      return (
        <div style={centeredOverlay}>
          <PendingPanel username={profile?.username} onSignOut={signOut} />
        </div>
      )

    case AUTH_STATE.REJECTED:
      return (
        <div style={centeredOverlay}>
          <RejectedPanel onSignOut={signOut} />
        </div>
      )

    case AUTH_STATE.ERROR:
      return (
        <div style={centeredOverlay}>
          <ErrorPanel message={error} onRetry={retryAuth} onSignOut={signOut} />
        </div>
      )

    case AUTH_STATE.UNAUTHENTICATED:
    default:
      return (
        <div style={{ ...centeredOverlay, background: 'transparent' }}>
          <MatrixLoader progress={100} showHud={false} granted={false}>
            <LoginRegisterForm signUp={signUp} />
          </MatrixLoader>
        </div>
      )
  }
}

/* ── Login / Register ──────────────────────────────────────────────────────── */

function LoginRegisterForm({ signUp }) {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  function showErr(msg) { setError(msg); setTimeout(() => setError(''), 5000) }

  const handleLogin = async (e) => {
    e.preventDefault()
    setBusy(true); setInfo(''); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (err) showErr(err.message)
    setBusy(false)
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) return showErr('ENTER YOUR EMAIL FIRST')
    setBusy(true); setInfo(''); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim())
    if (err) showErr(err.message)
    else setInfo('PASSWORD RESET EMAIL SENT — check your inbox.')
    setBusy(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!username.trim()) return showErr('USERNAME REQUIRED')
    setBusy(true); setInfo(''); setError('')
    try {
      sessionStorage.setItem('pending_username', username.trim())
      const { needsEmailConfirm } = await signUp(email.trim(), password)
      if (needsEmailConfirm) {
        setInfo('CHECK YOUR EMAIL — confirm then log in.')
        sessionStorage.removeItem('pending_username')
        setBusy(false)
        return
      }
    } catch (err) {
      sessionStorage.removeItem('pending_username')
      const msg = err.message?.toLowerCase() ?? ''
      if (msg.includes('rate limit') || msg.includes('email_rate_limit')) {
        showErr('TOO MANY SIGNUPS — try again in a few minutes.')
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
    fontWeight: active ? 'bold' : 'normal',
  })

  return (
    <div style={panelStyle}>
      <div style={titleBarStyle}>
        <span>■ AUTHENTICATION</span>
        <span style={{ color: 'rgba(0,255,65,0.3)' }}>v3.0</span>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,255,65,0.1)' }}>
        <button style={tabBtnStyle(tab === 'login')} onClick={() => { setTab('login'); setError('') }}>[ LOGIN ]</button>
        <button style={tabBtnStyle(tab === 'register')} onClick={() => { setTab('register'); setError('') }}>[ REGISTER ]</button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
            <button type="button" onClick={handleForgotPassword} disabled={busy}
              style={{ background: 'transparent', border: 'none', color: 'rgba(0,255,65,0.4)', fontSize: '9px', fontFamily: 'monospace', cursor: 'pointer', padding: '0', letterSpacing: '1px', textAlign: 'left' }}>
              &gt; forgot password?
            </button>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ color: 'rgba(0,255,65,0.5)', fontSize: '10px', margin: 0, lineHeight: 1.6, fontFamily: 'monospace' }}>
              &gt; Register for an account.<br />&gt; An admin will approve your request.
            </p>
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
        )}

        {error && <p style={{ color: '#ff2244', fontSize: '11px', margin: 0, fontFamily: 'monospace' }}>&gt; ERROR: {error}</p>}
        {info && <p style={{ color: '#00e5cc', fontSize: '11px', margin: 0, fontFamily: 'monospace' }}>&gt; {info}</p>}
      </div>
    </div>
  )
}

/* ── Status panels ─────────────────────────────────────────────────────────── */

function PendingPanel({ username, onSignOut }) {
  return (
    <div style={panelStyle}>
      <div style={titleBarStyle}><span>■ ACCESS PENDING</span></div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ color: 'rgba(0,255,65,0.5)', fontSize: '11px', margin: 0, lineHeight: 1.7, fontFamily: 'monospace' }}>
          &gt; Account <span style={{ color: '#00ff41' }}>{username}</span> registered.<br />
          &gt; Awaiting admin approval.<br />
          &gt; You will be able to log in once approved.
        </p>
        <button onClick={onSignOut} style={{ ...btnStyle(false), marginTop: '8px' }}>[ SIGN OUT ]</button>
      </div>
    </div>
  )
}

function RejectedPanel({ onSignOut }) {
  return (
    <div style={panelStyle}>
      <div style={titleBarStyle}><span>■ ACCESS DENIED</span></div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ color: '#ff2244', fontSize: '11px', margin: 0, fontFamily: 'monospace' }}>&gt; Your account request was not approved.</p>
        <button onClick={onSignOut} style={btnStyle(false)}>[ SIGN OUT ]</button>
      </div>
    </div>
  )
}

function ErrorPanel({ message, onRetry, onSignOut }) {
  return (
    <div style={panelStyle}>
      <div style={titleBarStyle}><span>■ SYSTEM ERROR</span></div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ color: '#ff2244', fontSize: '11px', margin: 0, fontFamily: 'monospace' }}>&gt; {message ?? 'Unknown error'}</p>
        <button onClick={onRetry} style={btnStyle(false)}>[ RETRY ]</button>
        <button onClick={onSignOut} style={{ ...btnStyle(false), background: 'transparent', color: 'rgba(0,255,65,0.4)', border: '1px solid rgba(0,255,65,0.15)' }}>
          [ SIGN OUT ]
        </button>
      </div>
    </div>
  )
}
