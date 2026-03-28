import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

// Clean up old localStorage persistence keys (one-time migration)
;['productivity-notes', 'productivity-tasks', 'productivity-habits', 'productivity-pomodoro', 'notion-page-ids'].forEach(
  (key) => localStorage.removeItem(key)
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Unregister any lingering service workers so deploys always take effect immediately
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister())
  })
}
