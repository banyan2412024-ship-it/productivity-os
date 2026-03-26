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
  { to: '/', icon: CalendarDays, label: 'Today' },
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
  { to: '/', icon: CalendarDays, label: 'Today' },
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
      <aside className="hidden md:flex w-16 hover:w-48 transition-all duration-200 bg-gray-900 text-white flex-col items-center py-4 group overflow-hidden shrink-0">
        <div className="mb-8 flex items-center gap-3 px-3 w-full">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
            P
          </div>
          <span className="text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
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
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Icon size={20} className="shrink-0" />
              <span className="text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {label}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around px-1 py-1 safe-area-bottom">
        {mobileNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-0 ${
                isActive ? 'text-indigo-600' : 'text-gray-400'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
