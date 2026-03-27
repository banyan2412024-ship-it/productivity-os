import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

const CORRECT = import.meta.env.VITE_APP_PASSWORD || 'admin'

export default function AuthGate({ children }) {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)

  const [input, setInput] = useState('')
  const [error, setError] = useState('')
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
    if (input.trim() !== CORRECT.trim()) {
      setError('ACCESS DENIED — incorrect password')
      setInput('')
      setTimeout(() => setError(''), 1200)
      return
    }
    setBusy(true)
    const { error: err } = await supabase.auth.signInAnonymously()
    if (err) {
      setError(`Supabase error: ${err.message}`)
      setTimeout(() => setError(''), 4000)
    }
    setBusy(false)
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
      <div style={{ width: '320px', background: 'var(--bg-surface)', border: '1px solid var(--border-mid)' }}>
        <div className="title-bar" style={{ justifyContent: 'space-between' }}>
          <span>■ AUTHENTICATION REQUIRED</span>
          <span style={{ color: 'var(--text-ghost)' }}>v1.0</span>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '11px', margin: 0, lineHeight: 1.6 }}>
            &gt; Private system. Authorized users only.<br />
            &gt; Enter password to continue.
          </p>
          <form onSubmit={attempt} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="_ _ _ _ _ _ _ _"
              autoFocus
              style={{ width: '100%', letterSpacing: '4px', textAlign: 'center' }}
              className={error ? 'shake' : ''}

            />
            <button type="submit" disabled={busy} style={{ width: '100%', marginTop: '4px', opacity: busy ? 0.5 : 1 }}>
              {busy ? '[ CONNECTING... ]' : '[ AUTHENTICATE ]'}
            </button>
          </form>
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '11px', margin: 0 }}>
              &gt; {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
