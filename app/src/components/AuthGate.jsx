import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'

export default function AuthGate({ children }) {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)

  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', color: 'var(--neon-dim)', fontSize: '11px' }}>
        &gt; INITIALIZING...
      </div>
    )
  }

  if (user) return children

  const attempt = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error: err } = await signIn(email, password)
        if (err) setError(err.message)
      } else {
        const { error: err } = await signUp(email, password)
        if (err) setError(err.message)
        else setInfo('Check your email to confirm your account, then sign in.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-mono)',
    }}>
      <div style={{ width: '340px', background: 'var(--bg-surface)', border: '1px solid var(--border-mid)' }}>
        <div className="title-bar" style={{ justifyContent: 'space-between' }}>
          <span>■ {mode === 'signin' ? 'AUTHENTICATION REQUIRED' : 'CREATE ACCOUNT'}</span>
          <span style={{ color: 'var(--text-ghost)' }}>v2.0</span>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '11px', margin: 0, lineHeight: 1.6 }}>
            &gt; ProductivityOS — private system.<br />
            &gt; {mode === 'signin' ? 'Enter credentials to access.' : 'Register a new account.'}
          </p>

          <form onSubmit={attempt} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@domain.com"
              required
              autoFocus
              style={{ width: '100%' }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              required
              style={{ width: '100%' }}
            />
            <button type="submit" disabled={busy} style={{ width: '100%', marginTop: '4px', opacity: busy ? 0.5 : 1 }}>
              {busy ? '[ CONNECTING... ]' : mode === 'signin' ? '[ AUTHENTICATE ]' : '[ CREATE ACCOUNT ]'}
            </button>
          </form>

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '11px', margin: 0 }}>
              &gt; ERROR: {error}
            </p>
          )}
          {info && (
            <p style={{ color: 'var(--neon)', fontSize: '11px', margin: 0 }}>
              &gt; {info}
            </p>
          )}

          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo('') }}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '10px', cursor: 'pointer', textAlign: 'left', padding: 0 }}
          >
            &gt; {mode === 'signin' ? 'New here? Create an account →' : 'Already have an account? Sign in →'}
          </button>
        </div>
      </div>
    </div>
  )
}
