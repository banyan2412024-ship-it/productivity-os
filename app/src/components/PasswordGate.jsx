import { useState } from 'react'

const CORRECT = import.meta.env.VITE_APP_PASSWORD || 'admin'
const KEY = 'prodos_auth'

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(() => localStorage.getItem(KEY) === CORRECT)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  if (authed) return children

  const attempt = (e) => {
    e.preventDefault()
    if (input === CORRECT) {
      localStorage.setItem(KEY, CORRECT)
      setAuthed(true)
    } else {
      setError(true)
      setInput('')
      setTimeout(() => setError(false), 1200)
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
              onChange={e => setInput(e.target.value)}
              placeholder="_ _ _ _ _ _ _ _"
              autoFocus
              style={{ width: '100%', letterSpacing: '4px', textAlign: 'center' }}
              className={error ? 'shake' : ''}
            />
            <button type="submit" style={{ width: '100%', marginTop: '4px' }}>
              [ AUTHENTICATE ]
            </button>
          </form>
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '11px', margin: 0 }}>
              &gt; ACCESS DENIED — incorrect password
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
