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
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
]

function CompletedView() {
  const tasks = useTaskStore((s) => s.tasks)
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === 'done'), [tasks])

  // Sort by completedAt descending
  const sorted = [...completedTasks].sort(
    (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={20} className="text-green-500" />
        <h2 className="text-lg font-semibold text-gray-800">Completed</h2>
        <span className="text-xs text-gray-400">{sorted.length} tasks</span>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm font-medium">No completed tasks yet</p>
          <p className="text-gray-300 text-xs mt-1">Complete tasks and they will appear here</p>
        </div>
      ) : (
        <div className="space-y-1.5">
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
      case 'inbox':
        return <InboxView />
      case 'today':
        return <TodayView />
      case 'upcoming':
        return <UpcomingView />
      case 'projects':
        return <ProjectsView />
      case 'completed':
        return <CompletedView />
      default:
        return <TodayView />
    }
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar */}
      <nav className="w-48 shrink-0 border-r border-gray-200 bg-gray-50/50 py-4 px-2 space-y-0.5">
        <h1 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3 mb-3">
          Tasks
        </h1>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:bg-white/60 hover:text-gray-800'
              }`}
            >
              <Icon
                size={16}
                className={isActive ? 'text-blue-500' : 'text-gray-400'}
              />
              <span className="flex-1 text-left">{tab.label}</span>
              {tab.showBadge && inboxCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-blue-500 text-white rounded-full">
                  {inboxCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto p-6 min-h-0">
        <div className="max-w-2xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
