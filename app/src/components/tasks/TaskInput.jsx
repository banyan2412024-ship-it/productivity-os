import { useState, useRef, useId } from 'react'
import { useTaskStore, TASK_CATEGORIES } from '../../stores/taskStore'
import { useToastStore } from '../../stores/toastStore'
import { Plus, Zap, Calendar, X } from 'lucide-react'

const priorities = ['medium', 'high', 'low']
const priorityColors = {
  high:   { bg: 'var(--danger)',         color: '#fff' },
  medium: { bg: 'var(--amber)',           color: '#000' },
  low:    { bg: 'var(--border-bright)',   color: 'var(--text)' },
}
const priorityLabels = { high: 'High', medium: 'Med', low: 'Low' }

// Convert duration object → human label
function durationLabel(d) {
  if (!d) return ''
  const parts = []
  if (d.months) parts.push(`${d.months}mo`)
  if (d.days)   parts.push(`${d.days}d`)
  if (d.hours)  parts.push(`${d.hours}h`)
  if (d.mins)   parts.push(`${d.mins}m`)
  if (d.secs)   parts.push(`${d.secs}s`)
  return parts.join(' ')
}

const EMPTY_DUR = { months: '', days: '', hours: '', mins: '', secs: '' }

export default function TaskInput({ defaultStatus = 'inbox', projectId, onTaskAdded }) {
  const uid      = useId()
  const dateRef  = useRef(null)
  const addTask  = useTaskStore((s) => s.addTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const addToast = useToastStore((s) => s.addToast)

  const [open,       setOpen]       = useState(false)
  const [title,      setTitle]      = useState('')
  const [priority,   setPriority]   = useState('medium')
  const [isQuickWin, setIsQuickWin] = useState(false)
  const [isFrog,     setIsFrog]     = useState(false)
  const [category,   setCategory]   = useState('Other')
  const [dueDate,    setDueDate]    = useState('')
  const [duration,   setDuration]   = useState(EMPTY_DUR)
  const [showDur,    setShowDur]    = useState(false)

  const cyclePriority = () => {
    const idx = priorities.indexOf(priority)
    setPriority(priorities[(idx + 1) % priorities.length])
  }

  const reset = () => {
    setTitle('')
    setPriority('medium')
    setIsQuickWin(false)
    setIsFrog(false)
    setCategory('Other')
    setDueDate('')
    setDuration(EMPTY_DUR)
    setShowDur(false)
    setOpen(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    const dur = durationLabel(duration)
    const taskData = {
      title: title.trim(),
      status: defaultStatus,
      priority,
      category,
      isQuickWin,
      isFrog,
      ...(projectId && { projectId }),
      ...(dueDate && { dueDate: new Date(dueDate).toISOString() }),
      ...(dur && { estimatedDuration: dur }),
    }

    const id = addTask(taskData)
    addToast(`Task "${taskData.title}" added`, {
      type: 'success',
      undoFn: () => { deleteTask(id); addToast('Task undone', { type: 'info' }) },
    })
    reset()
    onTaskAdded?.()
  }

  const pColor = priorityColors[priority]
  const durLabel = durationLabel(duration)

  // ── Collapsed state: just a "+ Add task" button ──────────────────────────
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          width: '100%', padding: '6px 10px',
          background: 'transparent',
          border: '1px dashed var(--border-mid)',
          color: 'var(--text-ghost)',
          fontSize: '11px', cursor: 'pointer',
          minWidth: 'unset',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--border-bright)'
          e.currentTarget.style.color = 'var(--text-dim)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border-mid)'
          e.currentTarget.style.color = 'var(--text-ghost)'
        }}
      >
        <Plus size={12} /> Add task
      </button>
    )
  }

  // ── Expanded state ────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

      {/* Main row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'var(--bg-base)',
        border: '1px solid var(--border-bright)',
        padding: '4px 8px',
      }}>
        <Plus size={14} style={{ color: 'var(--text-ghost)', flexShrink: 0 }} />
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Task title..."
          autoFocus
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '12px', outline: 'none' }}
        />
        <button type="button" onClick={reset} style={{ background: 'transparent', border: 'none', color: 'var(--text-ghost)', padding: '2px', cursor: 'pointer', minWidth: 'unset' }}>
          <X size={13} />
        </button>
      </div>

      {/* Options row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', paddingLeft: '2px' }}>

        {/* Priority */}
        <button
          type="button"
          onClick={cyclePriority}
          style={{
            padding: '2px 8px', fontSize: '10px', fontFamily: 'var(--font-mono)',
            background: pColor.bg, color: pColor.color,
            border: 'none', cursor: 'pointer', minWidth: 'unset',
          }}
          title="Cycle priority"
        >
          {priorityLabels[priority]}
        </button>

        {/* Frog 🐸 */}
        <button
          type="button"
          onClick={() => setIsFrog(!isFrog)}
          title="Eat the Frog — hardest task first"
          style={{
            padding: '2px 8px', fontSize: '11px',
            background: isFrog ? 'rgba(0,255,65,0.15)' : 'transparent',
            border: isFrog ? '1px solid var(--text-bright)' : '1px solid var(--border-mid)',
            color: isFrog ? 'var(--text-bright)' : 'var(--text-ghost)',
            cursor: 'pointer', minWidth: 'unset',
          }}
        >
          🐸 {isFrog ? 'Frog' : 'Frog?'}
        </button>

        {/* Quick win ⚡ */}
        <button
          type="button"
          onClick={() => setIsQuickWin(!isQuickWin)}
          title="Quick Win (under 2 min)"
          style={{
            padding: '2px 8px', fontSize: '10px',
            background: isQuickWin ? 'rgba(0,229,204,0.15)' : 'transparent',
            border: isQuickWin ? '1px solid var(--cyan)' : '1px solid var(--border-mid)',
            color: isQuickWin ? 'var(--cyan)' : 'var(--text-ghost)',
            cursor: 'pointer', minWidth: 'unset', display: 'flex', alignItems: 'center', gap: '3px',
          }}
        >
          <Zap size={11} /> Quick
        </button>

        {/* Category */}
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ fontSize: '10px', padding: '2px 20px 2px 6px', color: 'var(--text-dim)', background: 'var(--bg-surface)' }}
        >
          {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Calendar */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => dateRef.current?.showPicker?.()}
            title="Set due date"
            style={{
              padding: '2px 8px', fontSize: '10px',
              background: dueDate ? 'rgba(200,168,75,0.15)' : 'transparent',
              border: dueDate ? '1px solid var(--amber)' : '1px solid var(--border-mid)',
              color: dueDate ? 'var(--amber)' : 'var(--text-ghost)',
              cursor: 'pointer', minWidth: 'unset', display: 'flex', alignItems: 'center', gap: '3px',
            }}
          >
            <Calendar size={11} />
            {dueDate
              ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'Due'}
          </button>
          <input
            ref={dateRef}
            id={`${uid}-date`}
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
            tabIndex={-1}
          />
        </div>

        {/* Duration */}
        <button
          type="button"
          onClick={() => setShowDur(!showDur)}
          title="Estimated duration"
          style={{
            padding: '2px 8px', fontSize: '10px',
            background: durLabel ? 'rgba(0,229,204,0.1)' : 'transparent',
            border: durLabel ? '1px solid var(--cyan-dim)' : '1px solid var(--border-mid)',
            color: durLabel ? 'var(--cyan)' : 'var(--text-ghost)',
            cursor: 'pointer', minWidth: 'unset',
          }}
        >
          ⏱ {durLabel || 'Duration'}
        </button>
      </div>

      {/* Duration fields */}
      {showDur && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingLeft: '2px' }}>
          {[
            { key: 'months', label: 'mo' },
            { key: 'days',   label: 'd'  },
            { key: 'hours',  label: 'h'  },
            { key: 'mins',   label: 'm'  },
            { key: 'secs',   label: 's'  },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <input
                type="number"
                min="0"
                value={duration[key]}
                onChange={e => setDuration(d => ({ ...d, [key]: e.target.value }))}
                placeholder="0"
                style={{ width: '40px', fontSize: '11px', textAlign: 'center', padding: '2px 4px' }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-ghost)' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Submit hint */}
      {title && (
        <div style={{ fontSize: '10px', color: 'var(--text-ghost)', paddingLeft: '2px' }}>
          Press <kbd style={{ padding: '1px 5px', background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', fontSize: '10px' }}>Enter</kbd> to add
          {isFrog && <span style={{ color: 'var(--text-bright)', marginLeft: '8px' }}>🐸 Eat the frog</span>}
          {durLabel && <span style={{ color: 'var(--cyan)', marginLeft: '8px' }}>⏱ {durLabel}</span>}
        </div>
      )}
    </form>
  )
}
