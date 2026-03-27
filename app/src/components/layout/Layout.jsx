import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import QuickCapture from '../dashboard/QuickCapture'
import ToastContainer from './ToastContainer'
import SyncStatus from './SyncStatus'

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)', position: 'relative', zIndex: 1 }}>
      <Sidebar />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <Outlet />
      </main>
      <div className="fixed bottom-3 right-3 z-30 hidden md:block">
        <SyncStatus />
      </div>
      <QuickCapture />
      <ToastContainer />
    </div>
  )
}
