import { useState } from 'react'
import PomodoroTimer from '../components/pomodoro/PomodoroTimer'
import TimeBlockView from '../components/pomodoro/TimeBlockView'
import PomodoroStats from '../components/pomodoro/PomodoroStats'
import { Clock, Timer } from 'lucide-react'

const TABS = [
  { key: 'blocks', label: 'Time Blocks', icon: Clock },
  { key: 'stats', label: 'Stats', icon: Timer },
]

export default function PomodoroPage() {
  const [activeTab, setActiveTab] = useState('blocks')

  return (
    <div className="pomodoro-layout" style={{ display: 'flex', height: '100%', minHeight: 0 }}>

      {/* Timer — left on desktop, top on mobile */}
      <div
        className="pomodoro-timer-panel"
        style={{
          width: '40%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRight: '1px solid var(--border)',
          padding: '32px 16px',
        }}
      >
        <PomodoroTimer />
      </div>

      {/* Content — right on desktop, bottom on mobile */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: '2px', flexShrink: 0,
          padding: '8px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
        }}>
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 14px', fontSize: '10px',
                  background: isActive ? 'var(--bg-elevated)' : 'transparent',
                  color: isActive ? 'var(--neon)' : 'var(--text-dim)',
                  borderBottom: isActive ? '2px solid var(--neon)' : '2px solid transparent',
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                  cursor: 'pointer', minWidth: 'unset', letterSpacing: '0.5px',
                }}
              >
                <Icon size={13} />{tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {activeTab === 'blocks' && <TimeBlockView />}
          {activeTab === 'stats' && <PomodoroStats />}
        </div>
      </div>
    </div>
  )
}
