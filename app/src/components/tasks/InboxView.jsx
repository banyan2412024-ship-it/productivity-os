import { useMemo } from 'react'
import { useTaskStore } from '../../stores/taskStore'
import TaskItem from './TaskItem'
import TaskInput from './TaskInput'
import { Inbox, Sparkles } from 'lucide-react'

export default function InboxView() {
  const tasks = useTaskStore((s) => s.tasks)
  const inboxTasks = useMemo(() => tasks.filter((t) => t.status === 'inbox'), [tasks])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Inbox</h2>
          {inboxTasks.length > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">
              {inboxTasks.length} {inboxTasks.length === 1 ? 'item' : 'items'} to process
            </span>
          )}
        </div>
      </div>

      {/* GTD Processing hint */}
      {inboxTasks.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
          <div className="flex items-start gap-2">
            <Sparkles size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">GTD Processing</p>
              <p className="text-blue-600 text-xs mt-0.5">
                Hover over each task for quick actions: archive if not actionable, mark as
                quick win if under 2 minutes, or schedule it for later.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Task input */}
      <TaskInput defaultStatus="inbox" />

      {/* Task list */}
      {inboxTasks.length === 0 ? (
        <div className="text-center py-12">
          <Inbox size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm font-medium">Inbox zero!</p>
          <p className="text-gray-300 text-xs mt-1">
            Add tasks above to start processing
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {inboxTasks.map((task) => (
            <TaskItem key={task.id} task={task} showGTDPrompts />
          ))}
        </div>
      )}
    </div>
  )
}
