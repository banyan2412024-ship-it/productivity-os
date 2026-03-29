import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import QuickCapture from '../dashboard/QuickCapture'
import ToastContainer from './ToastContainer'
import { WifiOff } from 'lucide-react'

function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  if (!offline) return null
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#ff2244', color: '#000', fontFamily: 'var(--font-mono)',
      fontSize: '10px', letterSpacing: '1px', padding: '4px 12px',
      display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
    }}>
      <WifiOff size={11} /> OFFLINE — changes will sync when connection is restored
    </div>
  )
}

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)', position: 'relative', zIndex: 1 }}>
      <OfflineBanner />
      <Sidebar />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <Outlet />
      </main>
      <QuickCapture />
      <ToastContainer />
    </div>
  )
}
