import { useMemo } from 'react'
import { useTaskStore } from '../../stores/taskStore'
import TaskItem from './TaskItem'
import TaskInput from './TaskInput'
import { Sun, Star, Bug, Zap, ListChecks } from 'lucide-react'
import { isToday } from 'date-fns'

export default function TodayView() {
  const tasks = useTaskStore((s) => s.tasks)
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === 'done' || t.status === 'cancelled') return false
      if (t.status === 'today') return true
      if (t.dueDate && isToday(new Date(t.dueDate))) return true
      if (t.scheduledDate && isToday(new Date(t.scheduledDate))) return true
      return false
    }).sort((a, b) => {
      if (a.isFrog && !b.isFrog) return -1
      if (!a.isFrog && b.isFrog) return 1
      if (a.isMIT && !b.isMIT) return -1
      if (!a.isMIT && b.isMIT) return 1
      const p = { high: 3, medium: 2, low: 1 }
      return (p[b.priority] || 0) - (p[a.priority] || 0)
    })
  }, [tasks])

  const frogTask = todayTasks.find((t) => t.isFrog)
  const mitTasks = todayTasks.filter((t) => t.isMIT && !t.isFrog)
  const quickWins = todayTasks.filter((t) => t.isQuickWin && !t.isMIT && !t.isFrog)
  const otherTasks = todayTasks.filter((t) => !t.isFrog && !t.isMIT && !t.isQuickWin)

  const completedCount = todayTasks.filter((t) => t.status === 'done').length
  const totalCount = todayTasks.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sun size={20} className="text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-800">Today</h2>
          {totalCount > 0 && (
            <span className="text-xs text-gray-400">
              {completedCount}/{totalCount} done
            </span>
          )}
        </div>
        {totalCount > 0 && (
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        )}
      </div>

      {/* Eat the Frog section */}
      {frogTask && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Bug size={16} className="text-green-500" />
            <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wider">
              Eat the Frog
            </h3>
            <span className="text-[10px] text-green-500 bg-green-50 px-1.5 py-0.5 rounded">
              Do this first
            </span>
          </div>
          <div className="rounded-lg border-2 border-green-200 bg-green-50/30 p-1">
            <TaskItem task={frogTask} />
          </div>
        </section>
      )}

      {/* Most Important Tasks */}
      {mitTasks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} className="text-amber-500" fill="currentColor" />
            <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wider">
              Most Important Tasks
            </h3>
            <span className="text-[10px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
              {mitTasks.length}/3
            </span>
          </div>
          <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50/30 p-2">
            {mitTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-blue-500" />
            <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wider">
              Quick Wins
            </h3>
            <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
              Under 2 min
            </span>
          </div>
          <div className="space-y-1.5 rounded-lg border border-blue-200 bg-blue-50/30 p-2">
            {quickWins.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}

      {/* Other Tasks */}
      {otherTasks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <ListChecks size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Other Tasks
            </h3>
          </div>
          <div className="space-y-1.5">
            {otherTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {todayTasks.length === 0 && (
        <div className="text-center py-12">
          <Sun size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm font-medium">No tasks for today</p>
          <p className="text-gray-300 text-xs mt-1">
            Add a task below or process your inbox
          </p>
        </div>
      )}

      {/* Add task input */}
      <TaskInput defaultStatus="today" />
    </div>
  )
}
