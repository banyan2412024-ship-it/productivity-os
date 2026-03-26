import { useEffect, useState } from 'react'
import { useSyncStore } from '../../stores/syncStore'
import { Cloud, CloudOff, RefreshCw, Check, Loader2 } from 'lucide-react'

export default function SyncStatus() {
  const connected = useSyncStore((s) => s.connected)
  const syncing = useSyncStore((s) => s.syncing)
  const pendingOps = useSyncStore((s) => s.pendingOps)
  const lastSync = useSyncStore((s) => s.lastSync)
  const error = useSyncStore((s) => s.error)
  const checkConnection = useSyncStore((s) => s.checkConnection)
  const syncAllFn = useSyncStore((s) => s.syncAll)
  const [showMenu, setShowMenu] = useState(false)

  // Check connection on mount and every 30s
  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [checkConnection])

  const isBusy = syncing || pendingOps > 0

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
          connected
            ? isBusy
              ? 'bg-blue-50 text-blue-600'
              : 'bg-green-50 text-green-600'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        {connected ? (
          isBusy ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Cloud size={13} />
          )
        ) : (
          <CloudOff size={13} />
        )}
        <span className="hidden sm:inline">
          {connected
            ? isBusy
              ? `Syncing${pendingOps > 0 ? ` (${pendingOps})` : ''}...`
              : 'Notion'
            : 'Offline'}
        </span>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-white rounded-xl border border-gray-200 shadow-lg p-3 space-y-2.5">
            {/* Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm font-medium text-gray-700">
                {connected ? 'Connected to Notion' : 'Not connected'}
              </span>
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>
            )}

            {lastSync && (
              <p className="text-xs text-gray-400">
                Last full sync: {new Date(lastSync).toLocaleTimeString()}
              </p>
            )}

            {pendingOps > 0 && (
              <p className="text-xs text-blue-500">{pendingOps} operations in flight...</p>
            )}

            {/* Actions */}
            <div className="border-t pt-2 space-y-1">
              <button
                onClick={async () => {
                  await syncAllFn()
                  setShowMenu(false)
                }}
                disabled={!connected || syncing}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
              >
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Full Sync Now'}
              </button>
              <button
                onClick={async () => {
                  await checkConnection()
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <Check size={14} />
                Test Connection
              </button>
            </div>

            <p className="text-[10px] text-gray-400 pt-1 border-t">
              Changes auto-push to Notion when connected. Use Full Sync to push all existing data.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
