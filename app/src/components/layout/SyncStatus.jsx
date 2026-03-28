import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Cloud } from 'lucide-react'

export default function SyncStatus() {
  const user = useAuthStore((s) => s.user)
  const [showMenu, setShowMenu] = useState(false)

  if (!user) return null

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
        <Cloud size={12} />
        <span>SYNCED</span>
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
              <span style={{ fontSize: '11px', color: 'var(--text)' }}>&gt; connected to supabase</span>
            </div>

            <p style={{ fontSize: '8px', color: 'var(--text-ghost)', marginTop: '6px', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
              data synced to supabase
            </p>
          </div>
        </>
      )}
    </div>
  )
}
