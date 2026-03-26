import { useState } from 'react'
import { useTaskStore, TASK_CATEGORIES } from '../../stores/taskStore'
import { useToastStore } from '../../stores/toastStore'
import { Plus, Zap, Calendar, Tag } from 'lucide-react'

const priorities = ['medium', 'high', 'low']
const priorityColors = {
  high: 'bg-red-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-gray-400 text-white',
}
const priorityLabels = { high: 'High', medium: 'Med', low: 'Low' }

export default function TaskInput({ defaultStatus = 'inbox', projectId, onTaskAdded }) {
  const addTask = useTaskStore((s) => s.addTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const addToast = useToastStore((s) => s.addToast)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [isQuickWin, setIsQuickWin] = useState(false)
  const [category, setCategory] = useState('Other')
  const [dueDate, setDueDate] = useState('')
  const [showOptions, setShowOptions] = useState(false)

  const cyclePriority = () => {
    const idx = priorities.indexOf(priority)
    setPriority(priorities[(idx + 1) % priorities.length])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    const taskData = {
      title: title.trim(),
      status: defaultStatus,
      priority,
      category,
      isQuickWin,
      ...(projectId && { projectId }),
    }

    if (dueDate) {
      taskData.dueDate = new Date(dueDate).toISOString()
    }

    const id = addTask(taskData)
    const savedTitle = taskData.title
    addToast(`Task "${savedTitle}" added`, { type: 'success', undoFn: () => { deleteTask(id); addToast('Task undone', { type: 'info' }) } })
    setTitle('')
    setPriority('medium')
    setCategory('Other')
    setIsQuickWin(false)
    setDueDate('')
    setShowOptions(false)
    onTaskAdded?.()
  }

  return (
    <form onSubmit={handleSubmit} className="group">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 transition-all focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
        <Plus size={16} className="text-gray-400 shrink-0" />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setShowOptions(true)}
          placeholder="Add a task..."
          className="flex-1 text-sm text-gray-800 outline-none placeholder:text-gray-400 bg-transparent"
        />

        {/* Quick option buttons (visible on focus or when options shown) */}
        <div
          className={`flex items-center gap-1.5 transition-opacity ${
            showOptions || title ? 'opacity-100' : 'opacity-0 group-focus-within:opacity-100'
          }`}
        >
          {/* Priority toggle */}
          <button
            type="button"
            onClick={cyclePriority}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${priorityColors[priority]}`}
            title="Cycle priority"
          >
            {priorityLabels[priority]}
          </button>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border-none outline-none cursor-pointer hover:bg-gray-200"
          >
            {TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Quick win */}
          <button
            type="button"
            onClick={() => setIsQuickWin(!isQuickWin)}
            className={`p-1 rounded transition-colors ${
              isQuickWin
                ? 'text-blue-500 bg-blue-100'
                : 'text-gray-400 hover:text-blue-400 hover:bg-blue-50'
            }`}
            title="Quick Win (under 2 min)"
          >
            <Zap size={14} />
          </button>

          {/* Date picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('task-input-date')
                input?.showPicker?.()
                input?.focus()
              }}
              className={`p-1 rounded transition-colors ${
                dueDate
                  ? 'text-purple-500 bg-purple-100'
                  : 'text-gray-400 hover:text-purple-400 hover:bg-purple-50'
              }`}
              title="Set due date"
            >
              <Calendar size={14} />
            </button>
            <input
              id="task-input-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              tabIndex={-1}
            />
          </div>
        </div>
      </div>

      {/* Active indicator bar */}
      {title && (
        <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-gray-400">
          <span>
            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Enter</kbd> to add
          </span>
          <div className="flex items-center gap-2">
            {isQuickWin && (
              <span className="flex items-center gap-0.5 text-blue-500">
                <Zap size={10} /> Quick win
              </span>
            )}
            {dueDate && (
              <span className="text-purple-500">
                Due: {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      )}
    </form>
  )
}
