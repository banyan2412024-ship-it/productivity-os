import { useMemo } from 'react'
import { useTaskStore } from '../../stores/taskStore'
import TaskItem from './TaskItem'
import { Clock, CalendarDays } from 'lucide-react'
import {
  format,
  isToday,
  isTomorrow,
  startOfDay,
  addDays,
} from 'date-fns'

function getDateLabel(dateStr) {
  const date = new Date(dateStr)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'EEEE, MMM d')
}

function getRelativeDay(dateStr) {
  const date = startOfDay(new Date(dateStr))
  const today = startOfDay(new Date())
  const diff = Math.round((date - today) / (1000 * 60 * 60 * 24))
  if (diff <= 1) return null
  return `in ${diff} days`
}

export default function UpcomingView() {
  const tasks = useTaskStore((s) => s.tasks)
  const upcomingTasks = useMemo(() => {
    const now = startOfDay(new Date())
    const weekEnd = addDays(now, 7)
    return tasks
      .filter((t) => {
        if (t.status === 'done' || t.status === 'cancelled') return false
        const due = t.dueDate ? new Date(t.dueDate) : null
        const sched = t.scheduledDate ? new Date(t.scheduledDate) : null
        const d = due || sched
        if (!d) return false
        return d > now && d < weekEnd
      })
      .sort((a, b) => new Date(a.dueDate || a.scheduledDate) - new Date(b.dueDate || b.scheduledDate))
  }, [tasks])

  // Group tasks by date
  const grouped = useMemo(() => {
    const groups = {}
    upcomingTasks.forEach((task) => {
      const dateKey = format(
        startOfDay(new Date(task.dueDate || task.scheduledDate)),
        'yyyy-MM-dd'
      )
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(task)
    })

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([dateKey, tasks]) => ({
        dateKey,
        label: getDateLabel(dateKey),
        relative: getRelativeDay(dateKey),
        tasks,
      }))
  }, [upcomingTasks])

  // Build date markers for the next 7 days (even if empty)
  const next7 = useMemo(() => {
    const days = []
    const today = startOfDay(new Date())
    for (let i = 1; i <= 7; i++) {
      const date = addDays(today, i)
      const dateKey = format(date, 'yyyy-MM-dd')
      const existing = grouped.find((g) => g.dateKey === dateKey)
      days.push({
        dateKey,
        label: getDateLabel(dateKey),
        relative: getRelativeDay(dateKey),
        tasks: existing ? existing.tasks : [],
      })
    }
    return days
  }, [grouped])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock size={20} className="text-purple-500" />
        <h2 className="text-lg font-semibold text-gray-800">Upcoming</h2>
        <span className="text-xs text-gray-400">Next 7 days</span>
      </div>

      {/* Date groups */}
      {next7.map((group) => (
        <section key={group.dateKey}>
          <div className="flex items-center gap-2 mb-1.5 py-1 border-b border-gray-100">
            <CalendarDays size={14} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">{group.label}</h3>
            {group.relative && (
              <span className="text-[10px] text-gray-400">{group.relative}</span>
            )}
            {group.tasks.length > 0 && (
              <span className="text-[10px] text-gray-400 ml-auto">
                {group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'}
              </span>
            )}
          </div>

          {group.tasks.length > 0 ? (
            <div className="space-y-1.5 ml-1">
              {group.tasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-300 ml-6 py-1">No tasks scheduled</p>
          )}
        </section>
      ))}

      {/* Overall empty state if zero tasks across all days */}
      {upcomingTasks.length === 0 && (
        <div className="text-center py-8">
          <CalendarDays size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-400 text-sm">No upcoming tasks in the next 7 days</p>
          <p className="text-gray-300 text-xs mt-1">Schedule tasks from your inbox</p>
        </div>
      )}
    </div>
  )
}
