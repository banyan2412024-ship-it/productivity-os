import { useEffect, useState } from 'react'
import { useSyncStore } from '../../stores/syncStore'
import { Cloud, CloudOff, RefreshCw, Check } from 'lucide-react'

export default function SyncStatus() {
  const connected = useSyncStore((s) => s.connected)
  const syncing = useSyncStore((s) => s.syncing)
  const pendingOps = useSyncStore((s) => s.pendingOps)
  const lastSync = useSyncStore((s) => s.lastSync)
  const error = useSyncStore((s) => s.error)
  const checkConnection = useSyncStore((s) => s.checkConnection)
  const syncAllFn = useSyncStore((s) => s.syncAll)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [checkConnection])

  const isBusy = syncing || pendingOps > 0

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
          color: connected ? (isBusy ? 'var(--neon-dim)' : 'var(--neon)') : 'var(--text-ghost)',
          minWidth: 0,
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {connected ? (
          isBusy ? <span className="loader-hourglass" /> : <Cloud size={12} />
        ) : (
          <CloudOff size={12} />
        )}
        <span>
          {connected
            ? isBusy
              ? `SYNC${pendingOps > 0 ? `(${pendingOps})` : ''}...`
              : 'NOTION'
            : 'OFFLINE'}
        </span>
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
            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{ width: '6px', height: '6px', background: connected ? 'var(--neon)' : 'var(--text-ghost)', boxShadow: connected ? '0 0 4px var(--neon)' : 'none' }} />
              <span style={{ fontSize: '11px', color: 'var(--text)' }}>
                {connected ? '> connected to Notion' : '> not connected'}
              </span>
            </div>

            {error && (
              <p style={{ fontSize: '10px', color: 'var(--danger)', padding: '4px', background: 'rgba(255,0,51,0.1)', marginBottom: '6px', border: '1px solid rgba(255,0,51,0.3)' }}>{error}</p>
            )}

            {lastSync && (
              <p style={{ fontSize: '9px', color: 'var(--text-ghost)', marginBottom: '6px' }}>
                last sync: {new Date(lastSync).toLocaleTimeString()}
              </p>
            )}

            {pendingOps > 0 && (
              <p style={{ fontSize: '9px', color: 'var(--neon-dim)', marginBottom: '6px' }}>{pendingOps} ops in flight...</p>
            )}

            {/* Actions */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                onClick={async () => { await syncAllFn(); setShowMenu(false) }}
                disabled={!connected || syncing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 6px',
                  fontSize: '10px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: connected ? 'var(--neon)' : 'var(--text-ghost)',
                  cursor: connected ? 'pointer' : 'not-allowed',
                  opacity: connected && !syncing ? 1 : 0.4,
                  minWidth: 0,
                  fontFamily: 'var(--font-mono)',
                  width: '100%',
                }}
              >
                <RefreshCw size={11} />
                {syncing ? '[ SYNCING... ]' : '[ FULL SYNC ]'}
              </button>
              <button
                onClick={async () => { await checkConnection(); setShowMenu(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 6px',
                  fontSize: '10px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  minWidth: 0,
                  fontFamily: 'var(--font-mono)',
                  width: '100%',
                }}
              >
                <Check size={11} />
                [ TEST CONNECTION ]
              </button>
            </div>

            <p style={{ fontSize: '8px', color: 'var(--text-ghost)', marginTop: '6px', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
              auto-push on change. full sync pushes all data.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
