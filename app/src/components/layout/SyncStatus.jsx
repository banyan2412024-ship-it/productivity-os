import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { User, LogOut, Database } from 'lucide-react'

export default function SyncStatus() {
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const [showMenu, setShowMenu] = useState(false)

  if (!user) return null

  const email = user.email ?? ''
  const short = email.split('@')[0].toUpperCase().slice(0, 10)

  return (
    <div style={{ position: 'relative', fontFamily: 'var(--font-mono)' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          fontSize: '9px',
          background: 'var(--bg-surface)',
          borderTop: '2px solid #1a6b1a',
          borderLeft: '2px solid #1a6b1a',
          borderRight: '2px solid #003300',
          borderBottom: '2px solid #003300',
          color: 'var(--neon)',
          minWidth: 0,
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <User size={12} />
        <span>{short}</span>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div
            style={{
              position: 'absolute',
              right: 0,
              bottom: '100%',
              marginBottom: '4px',
              zIndex: 50,
              width: '240px',
              background: 'var(--bg-surface)',
              borderTop: '2px solid #1a6b1a',
              borderLeft: '2px solid #1a6b1a',
              borderRight: '2px solid #003300',
              borderBottom: '2px solid #003300',
              boxShadow: '0 0 12px rgba(0,255,65,0.3)',
              padding: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{ width: '6px', height: '6px', background: 'var(--neon)', boxShadow: '0 0 4px var(--neon)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text)' }}>&gt; {email}</span>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <a
                href="/app/migrate"
                onClick={() => setShowMenu(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px 6px', fontSize: '10px',
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--neon-dim)', cursor: 'pointer',
                  textDecoration: 'none', fontFamily: 'var(--font-mono)',
                }}
              >
                <Database size={11} />
                [ MIGRATE DATA ]
              </a>
              <button
                onClick={async () => { await signOut(); setShowMenu(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px 6px', fontSize: '10px',
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--danger)', cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', width: '100%',
                }}
              >
                <LogOut size={11} />
                [ SIGN OUT ]
              </button>
            </div>

            <p style={{ fontSize: '8px', color: 'var(--text-ghost)', marginTop: '6px', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
              supabase — data synced per user
            </p>
          </div>
        </>
      )}
    </div>
  )
}
