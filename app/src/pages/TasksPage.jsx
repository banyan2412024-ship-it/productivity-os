import { useState, useMemo } from 'react'
import { useTaskStore } from '../stores/taskStore'
import InboxView from '../components/tasks/InboxView'
import TodayView from '../components/tasks/TodayView'
import UpcomingView from '../components/tasks/UpcomingView'
import ProjectsView from '../components/tasks/ProjectsView'
import TaskItem from '../components/tasks/TaskItem'
import {
  Inbox,
  Sun,
  Clock,
  FolderOpen,
  CheckCircle2,
} from 'lucide-react'

const tabs = [
  { id: 'today', label: 'Today', icon: Sun },
  { id: 'inbox', label: 'Inbox', icon: Inbox, showBadge: true },
  { id: 'upcoming', label: 'Upcoming', icon: Clock },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'completed', label: 'Done', icon: CheckCircle2 },
]

function CompletedView() {
  const tasks = useTaskStore((s) => s.tasks)
  const sorted = useMemo(
    () =>
      tasks
        .filter((t) => t.status === 'done')
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)),
    [tasks]
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <CheckCircle2 size={16} style={{ color: 'var(--neon)' }} />
        <span style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '1px' }}>
          COMPLETED — {sorted.length} tasks
        </span>
      </div>
      {sorted.length === 0 ? (
        <p style={{ fontSize: '11px', color: 'var(--text-ghost)', textAlign: 'center', padding: '32px 0' }}>
          &gt; no completed tasks
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {sorted.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState('today')
  const tasks = useTaskStore((s) => s.tasks)
  const inboxCount = useMemo(() => tasks.filter((t) => t.status === 'inbox').length, [tasks])

  const renderContent = () => {
    switch (activeTab) {
      case 'inbox': return <InboxView />
      case 'today': return <TodayView />
      case 'upcoming': return <UpcomingView />
      case 'projects': return <ProjectsView />
      case 'completed': return <CompletedView />
      default: return <TodayView />
    }
  }

  const tabBtn = (tab, orientation) => {
    const Icon = tab.icon
    const isActive = activeTab === tab.id
    if (orientation === 'vertical') {
      return (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 8px',
            background: isActive ? 'var(--bg-elevated)' : 'transparent',
            color: isActive ? 'var(--neon)' : 'var(--text-dim)',
            borderLeft: isActive ? '2px solid var(--neon)' : '2px solid transparent',
            borderTop: 'none',
            borderRight: 'none',
            borderBottom: 'none',
            fontSize: '11px',
            letterSpacing: '0.5px',
            cursor: 'pointer',
            minWidth: 'unset',
            textAlign: 'left',
            boxShadow: isActive ? 'inset 0 0 8px rgba(0,255,65,0.06)' : 'none',
          }}
        >
          <Icon size={13} />
          <span style={{ flex: 1 }}>{tab.label}</span>
          {tab.showBadge && inboxCount > 0 && (
            <span style={{
              fontSize: '9px', background: 'var(--neon)', color: '#000',
              padding: '0 4px', minWidth: '16px', textAlign: 'center', fontWeight: 'bold',
            }}>
              {inboxCount}
            </span>
          )}
        </button>
      )
    }
    return (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          padding: '8px 14px',
          flexShrink: 0,
          background: 'transparent',
          color: isActive ? 'var(--neon)' : 'var(--text-dim)',
          borderBottom: isActive ? '2px solid var(--neon)' : '2px solid transparent',
          borderTop: 'none', borderLeft: 'none', borderRight: 'none',
          fontSize: '9px', letterSpacing: '0.5px',
          cursor: 'pointer', minWidth: 'unset', position: 'relative',
        }}
      >
        <Icon size={14} />
        {tab.label}
        {tab.showBadge && inboxCount > 0 && (
          <span style={{
            position: 'absolute', top: '4px', right: '6px',
            fontSize: '8px', background: 'var(--neon)', color: '#000',
            padding: '0 3px', fontWeight: 'bold', lineHeight: '14px',
          }}>
            {inboxCount}
          </span>
        )}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* ── Mobile horizontal tabs (hidden on desktop via CSS) ── */}
      <div className="tasks-tabs-mobile">
        {tabs.map((tab) => tabBtn(tab, 'horizontal'))}
      </div>

      {/* ── Desktop: sidebar + content (flex row) ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Desktop sidebar (hidden on mobile via CSS) */}
        <nav
          className="tasks-sidebar-desktop"
          style={{
            width: '160px',
            flexShrink: 0,
            borderRight: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            padding: '12px 8px',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <div style={{ fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '2px', padding: '4px 8px 8px' }}>
            ■ PROJECTS
          </div>
          {tabs.map((tab) => tabBtn(tab, 'vertical'))}
        </nav>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div style={{ maxWidth: '720px', width: '100%', margin: '0 auto', padding: '20px 16px' }}>
            {renderContent()}
          </div>
        </main>

      </div>
    </div>
  )
}
