import { NavLink } from 'react-router-dom'
import {
  CalendarDays, FileText, FolderOpen, Repeat,
  Timer, Lightbulb, DollarSign, Leaf, Settings, Shield,
} from 'lucide-react'
import { useProfileStore } from '../../stores/profileStore'

const ALL_NAV = [
  { to: '/app',           icon: CalendarDays, label: '> Terminal', module: null },
  { to: '/app/tasks',     icon: FolderOpen,   label: 'Projects',   module: 'tasks' },
  { to: '/app/ideas',     icon: Lightbulb,    label: 'Ideas',      module: 'ideas' },
  { to: '/app/notes',     icon: FileText,     label: 'Notes',      module: 'notes' },
  { to: '/app/habits',    icon: Repeat,       label: 'Habits',     module: 'habits' },
  { to: '/app/pomodoro',  icon: Timer,        label: 'Pomodoro',   module: 'pomodoro' },
  { to: '/app/money',     icon: DollarSign,   label: 'Money',      module: 'money' },
  { to: '/app/smoking',   icon: Leaf,         label: 'Weed',       module: 'smoking' },
]

const MOBILE_MODULES = ['tasks', 'ideas', 'habits', 'money', 'smoking']

export default function Sidebar() {
  const profile = useProfileStore((s) => s.profile)
  const enabled = profile?.enabled_modules ?? ALL_NAV.map((n) => n.module).filter(Boolean)
  const isAdmin = profile?.is_admin ?? false

  const navItems = ALL_NAV.filter((n) => n.module === null || enabled.includes(n.module))
  const mobileNav = ALL_NAV.filter((n) => n.module === null || MOBILE_MODULES.includes(n.module))
    .filter((n) => n.module === null || enabled.includes(n.module))

  const initial = profile?.username?.[0]?.toUpperCase() ?? 'P'
  const displayName = profile?.username ?? 'Productivity OS'

  const linkStyle = ({ isActive }) => ({
    background: isActive ? 'var(--sel-bg)' : 'transparent',
    borderLeft: isActive ? '3px solid var(--neon)' : '3px solid transparent',
    color: isActive ? 'var(--neon)' : 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    boxShadow: isActive ? '0 0 4px rgba(0,255,65,0.4)' : 'none',
  })

  const bottomLinkStyle = ({ isActive }) => ({
    ...linkStyle({ isActive }),
    marginTop: 'auto',
  })

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
              borderTop: '2px solid var(--border-bright)',
              borderLeft: '2px solid var(--border-bright)',
              borderRight: '2px solid var(--border-dark)',
              borderBottom: '2px solid var(--border-dark)',
              color: 'var(--neon)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {initial}
          </div>
          <span
            className="text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--neon)' }}
          >
            {displayName}
          </span>
        </div>

        <nav className="flex flex-col gap-1 w-full px-2 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/app'}
              className="flex items-center gap-3 px-3 py-2.5 whitespace-nowrap"
              style={linkStyle}
            >
              <Icon size={16} className="shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom: settings + admin */}
        <nav className="flex flex-col gap-1 w-full px-2 mt-2 border-t" style={{ borderColor: 'var(--border-dark)', paddingTop: '8px' }}>
          {isAdmin && (
            <NavLink to="/app/admin" className="flex items-center gap-3 px-3 py-2.5 whitespace-nowrap" style={linkStyle}>
              <Shield size={16} className="shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">Admin</span>
            </NavLink>
          )}
          <NavLink to="/app/settings" className="flex items-center gap-3 px-3 py-2.5 whitespace-nowrap" style={linkStyle}>
            <Settings size={16} className="shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">Settings</span>
          </NavLink>
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
            end={to === '/app'}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-0"
            style={({ isActive }) => ({
              color: isActive ? 'var(--neon)' : 'var(--text-ghost)',
              fontFamily: 'var(--font-mono)',
            })}
          >
            <Icon size={16} />
            <span style={{ fontSize: '9px' }} className="truncate">{label}</span>
          </NavLink>
        ))}
        <NavLink
          to="/app/settings"
          className="flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-0"
          style={({ isActive }) => ({
            color: isActive ? 'var(--neon)' : 'var(--text-ghost)',
            fontFamily: 'var(--font-mono)',
          })}
        >
          <Settings size={16} />
          <span style={{ fontSize: '9px' }}>Settings</span>
        </NavLink>
      </nav>
    </>
  )
}
