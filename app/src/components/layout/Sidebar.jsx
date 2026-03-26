import { NavLink } from 'react-router-dom'
import {
  CalendarDays,
  FileText,
  CheckSquare,
  Repeat,
  Timer,
  Lightbulb,
  DollarSign,
  Leaf,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: CalendarDays, label: '> Terminal' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/ideas', icon: Lightbulb, label: 'Ideas' },
  { to: '/notes', icon: FileText, label: 'Notes' },
  { to: '/habits', icon: Repeat, label: 'Habits' },
  { to: '/pomodoro', icon: Timer, label: 'Pomodoro' },
  { to: '/money', icon: DollarSign, label: 'Money' },
  { to: '/smoking', icon: Leaf, label: 'Weed' },
]

// Subset for mobile bottom bar (most used)
const mobileNav = [
  { to: '/', icon: CalendarDays, label: 'Terminal' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/ideas', icon: Lightbulb, label: 'Ideas' },
  { to: '/habits', icon: Repeat, label: 'Habits' },
  { to: '/money', icon: DollarSign, label: 'Money' },
  { to: '/smoking', icon: Leaf, label: 'Weed' },
]

export default function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-16 hover:w-48 transition-all duration-200 flex-col items-center py-4 group overflow-hidden shrink-0"
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      >
        <div className="mb-8 flex items-center gap-3 px-3 w-full">
          <div
            className="w-10 h-10 flex items-center justify-center font-bold text-lg shrink-0"
            style={{
              background: 'var(--neon-ghost)',
              borderTop: '2px solid #1a6b1a',
              borderLeft: '2px solid #1a6b1a',
              borderRight: '2px solid #003300',
              borderBottom: '2px solid #003300',
              color: 'var(--neon)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            P
          </div>
          <span
            className="text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--neon)' }}
          >
            Productivity OS
          </span>
        </div>

        <nav className="flex flex-col gap-1 w-full px-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 whitespace-nowrap ${
                  isActive ? '' : ''
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--sel-bg)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--neon)' : '3px solid transparent',
                color: isActive ? 'var(--neon)' : 'var(--text-dim)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                boxShadow: isActive ? '0 0 4px rgba(0,255,65,0.4)' : 'none',
              })}
            >
              <Icon size={16} className="shrink-0" style={{ imageRendering: 'pixelated' }} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                {label}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-1 py-1 safe-area-bottom"
        style={{
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -1px 4px rgba(0,255,65,0.2)',
        }}
      >
        {mobileNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-0"
            style={({ isActive }) => ({
              color: isActive ? 'var(--neon)' : 'var(--text-ghost)',
              fontFamily: 'var(--font-mono)',
            })}
          >
            <Icon size={16} style={{ imageRendering: 'pixelated' }} />
            <span style={{ fontSize: '9px' }} className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
