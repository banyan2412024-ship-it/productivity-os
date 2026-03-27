import { useState, useRef, useEffect } from 'react'
import { useTaskStore, TASK_CATEGORIES } from '../../stores/taskStore'
import { useToastStore } from '../../stores/toastStore'
import {
  Star,
  Bug,
  Zap,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Tag,
  FolderOpen,
  FileText,
} from 'lucide-react'
import { format } from 'date-fns'

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-gray-400',
}

const priorityBorders = {
  high: 'border-red-200',
  medium: 'border-yellow-200',
  low: 'border-gray-200',
}

const priorityLabels = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
}

export default function TaskItem({ task, showGTDPrompts = false }) {
  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const addTask = useTaskStore((s) => s.addTask)
  const toggleMIT = useTaskStore((s) => s.toggleMIT)
  const toggleFrog = useTaskStore((s) => s.toggleFrog)
  const projects = useTaskStore((s) => s.projects)
  const addToast = useToastStore((s) => s.addToast)
  const [expanded, setExpanded] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(task.title)
  const [notesValue, setNotesValue] = useState(task.notes || '')
  const [showGTD, setShowGTD] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    if (editingTitle && titleRef.current) {
      titleRef.current.focus()
      titleRef.current.select()
    }
  }, [editingTitle])

  const isDone = task.status === 'done'

  const handleToggleDone = () => {
    const prevStatus = task.status
    if (isDone) {
      updateTask(task.id, { status: 'today' })
      addToast(`"${task.title}" reopened`, { type: 'info', undoFn: () => { updateTask(task.id, { status: prevStatus }); addToast('Reverted', { type: 'info' }) } })
    } else {
      updateTask(task.id, { status: 'done' })
      addToast(`"${task.title}" completed`, { type: 'success', undoFn: () => { updateTask(task.id, { status: prevStatus }); addToast('Reverted', { type: 'info' }) } })
    }
  }

  const handleTitleSave = () => {
    setEditingTitle(false)
    if (titleValue.trim() && titleValue !== task.title) {
      updateTask(task.id, { title: titleValue.trim() })
    } else {
      setTitleValue(task.title)
    }
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') handleTitleSave()
    if (e.key === 'Escape') {
      setTitleValue(task.title)
      setEditingTitle(false)
    }
  }

  const handleMIT = (e) => {
    e.stopPropagation()
    const result = toggleMIT(task.id)
    if (result === false) {
      // already 3 MITs
    }
  }

  const handleFrog = (e) => {
    e.stopPropagation()
    toggleFrog(task.id)
  }

  const handleQuickWin = (e) => {
    e.stopPropagation()
    updateTask(task.id, { isQuickWin: !task.isQuickWin })
  }

  const handlePriorityChange = (priority) => {
    updateTask(task.id, { priority })
  }

  const handleNotesBlur = () => {
    if (notesValue !== task.notes) {
      updateTask(task.id, { notes: notesValue })
    }
  }

  const handleProjectChange = (projectId) => {
    updateTask(task.id, { projectId: projectId || null })
  }

  const handleSchedule = (dateStr) => {
    if (dateStr) {
      updateTask(task.id, {
        scheduledDate: new Date(dateStr).toISOString(),
        status: 'scheduled',
      })
    }
  }

  const handleDueDate = (dateStr) => {
    if (dateStr) {
      updateTask(task.id, { dueDate: new Date(dateStr).toISOString() })
    } else {
      updateTask(task.id, { dueDate: null })
    }
  }

  // Determine accent styling
  let accentClasses = 'border-gray-100'
  if (task.isFrog && !isDone) accentClasses = 'border-green-200 bg-green-50/50'
  else if (task.isMIT && !isDone) accentClasses = 'border-amber-200 bg-amber-50/50'
  else if (task.isQuickWin && !isDone) accentClasses = 'border-blue-200 bg-blue-50/50'

  return (
    <div
      className={`group relative rounded-lg border transition-all ${accentClasses} ${
        isDone ? 'opacity-50' : ''
      }`}
      onMouseEnter={() => showGTDPrompts && setShowGTD(true)}
      onMouseLeave={() => showGTDPrompts && setShowGTD(false)}
    >
      {/* Main row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Expand chevron */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Checkbox */}
        <button
          onClick={handleToggleDone}
          className={`shrink-0 transition-colors ${
            isDone
              ? 'text-green-500 hover:text-green-600'
              : 'text-gray-300 hover:text-gray-500'
          }`}
        >
          {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input
              ref={titleRef}
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none border-b border-blue-400 pb-0.5"
            />
          ) : (
            <span
              onClick={() => !isDone && setEditingTitle(true)}
              style={isDone ? {} : { color: 'var(--neon)' }}
              className={`text-sm font-medium cursor-text truncate block ${
                isDone ? 'line-through text-gray-400' : ''
              }`}
            >
              {task.title}
            </span>
          )}
        </div>

        {/* Badges and icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Category badge */}
          {task.category && task.category !== 'Other' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
              {task.category}
            </span>
          )}

          {/* Priority badge */}
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-white ${priorityColors[task.priority]}`}
          >
            {priorityLabels[task.priority]}
          </span>

          {/* Quick win lightning */}
          <button
            onClick={handleQuickWin}
            className={`p-0.5 rounded transition-colors ${
              task.isQuickWin
                ? 'text-blue-500 bg-blue-100'
                : 'text-gray-300 hover:text-blue-400 opacity-0 group-hover:opacity-100'
            }`}
            title="Quick Win (under 2 min)"
          >
            <Zap size={14} />
          </button>

          {/* MIT star */}
          <button
            onClick={handleMIT}
            className={`p-0.5 rounded transition-colors ${
              task.isMIT
                ? 'text-amber-500 bg-amber-100'
                : 'text-gray-300 hover:text-amber-400 opacity-0 group-hover:opacity-100'
            }`}
            title="Most Important Task (max 3)"
          >
            <Star size={14} fill={task.isMIT ? 'currentColor' : 'none'} />
          </button>

          {/* Frog */}
          <button
            onClick={handleFrog}
            className={`p-0.5 rounded transition-colors ${
              task.isFrog
                ? 'text-green-500 bg-green-100'
                : 'text-gray-300 hover:text-green-400 opacity-0 group-hover:opacity-100'
            }`}
            title="Eat the Frog (hardest task)"
          >
            <Bug size={14} />
          </button>

          {/* Due date */}
          {task.dueDate && (
            <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
              <Calendar size={11} />
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              const saved = { ...task }
              deleteTask(task.id)
              addToast(`"${task.title}" deleted`, { type: 'info', undoFn: () => { addTask(saved); addToast('Task restored', { type: 'success' }) } })
            }}
            className="p-0.5 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            title="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* GTD Processing Prompts (for Inbox) */}
      {showGTDPrompts && showGTD && !isDone && (
        <div className="px-3 pb-2 flex items-center gap-2 text-xs border-t border-dashed border-gray-200 pt-2 mx-3">
          <span className="text-gray-500 font-medium">Quick actions:</span>
          <button
            onClick={() => updateTask(task.id, { status: 'cancelled' })}
            className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Not actionable
          </button>
          <button
            onClick={() => updateTask(task.id, { isQuickWin: true, status: 'today' })}
            className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-1"
          >
            <Zap size={11} /> Under 2 min
          </button>
          <div className="flex items-center gap-1">
            <Calendar size={11} className="text-gray-400" />
            <input
              type="date"
              className="text-xs bg-gray-100 rounded px-1.5 py-0.5 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              onChange={(e) => handleSchedule(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <button
            onClick={() => updateTask(task.id, { status: 'today' })}
            className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
          >
            Do today
          </button>
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 mx-3 space-y-3">
          {/* Notes */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1 mb-1">
              <FileText size={11} /> Notes
            </label>
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add notes..."
              rows={2}
              className="w-full text-sm text-gray-700 bg-gray-50 rounded-md border border-gray-200 px-2.5 py-1.5 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100 resize-none placeholder:text-gray-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Due date */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1 mb-1">
                <Calendar size={11} /> Due Date
              </label>
              <input
                type="date"
                value={task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''}
                onChange={(e) => handleDueDate(e.target.value)}
                className="w-full text-sm bg-gray-50 rounded-md border border-gray-200 px-2.5 py-1.5 outline-none focus:border-blue-300 text-gray-700"
              />
            </div>

            {/* Scheduled date */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1 mb-1">
                <Calendar size={11} /> Scheduled
              </label>
              <input
                type="date"
                value={
                  task.scheduledDate
                    ? format(new Date(task.scheduledDate), 'yyyy-MM-dd')
                    : ''
                }
                onChange={(e) => handleSchedule(e.target.value)}
                className="w-full text-sm bg-gray-50 rounded-md border border-gray-200 px-2.5 py-1.5 outline-none focus:border-blue-300 text-gray-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Priority */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1 block">
                Priority
              </label>
              <div className="flex gap-1">
                {['high', 'medium', 'low'].map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePriorityChange(p)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      task.priority === p
                        ? `${priorityColors[p]} text-white`
                        : `bg-gray-100 text-gray-500 hover:bg-gray-200`
                    }`}
                  >
                    {priorityLabels[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1 mb-1">
                <Tag size={11} /> Category
              </label>
              <select
                value={task.category || 'Other'}
                onChange={(e) => updateTask(task.id, { category: e.target.value })}
                className="w-full text-sm bg-gray-50 rounded-md border border-gray-200 px-2.5 py-1.5 outline-none focus:border-blue-300 text-gray-700"
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1 mb-1">
                <FolderOpen size={11} /> Project
              </label>
              <select
                value={task.projectId || ''}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full text-sm bg-gray-50 rounded-md border border-gray-200 px-2.5 py-1.5 outline-none focus:border-blue-300 text-gray-700"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1 mb-1">
              <Tag size={11} /> Tags
            </label>
            <div className="flex items-center gap-1 flex-wrap">
              {(task.tags || []).map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                >
                  {tag}
                  <button
                    onClick={() =>
                      updateTask(task.id, {
                        tags: task.tags.filter((_, idx) => idx !== i),
                      })
                    }
                    className="text-gray-400 hover:text-red-400"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add tag..."
                className="text-xs bg-transparent outline-none text-gray-500 placeholder:text-gray-300 w-20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    updateTask(task.id, {
                      tags: [...(task.tags || []), e.target.value.trim()],
                    })
                    e.target.value = ''
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
