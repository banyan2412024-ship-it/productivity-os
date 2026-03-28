import { useState, useRef, useId } from 'react'
import { useTaskStore, TASK_CATEGORIES, DIFFICULTY_LEVELS } from '../../stores/taskStore'
import { useToastStore } from '../../stores/toastStore'
import { Plus, Zap, Calendar, X, Swords } from 'lucide-react'

const priorities = ['medium', 'high', 'low']
const priorityColors = {
  high:   { bg: 'var(--danger)',         color: '#fff' },
  medium: { bg: 'var(--amber)',           color: '#000' },
  low:    { bg: 'var(--border-bright)',   color: 'var(--text)' },
}
const priorityLabels = { high: 'High', medium: 'Med', low: 'Low' }

const difficultyColors = {
  easy:   'var(--cyan)',
  normal: 'var(--text-ghost)',
  hard:   'var(--orange)',
  epic:   'var(--purple)',
}

const DURATION_PRESETS = [
  { label: '5m',  value: '5m'  },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1h',  value: '1h'  },
  { label: '2h',  value: '2h'  },
  { label: '4h',  value: '4h'  },
  { label: '1d',  value: '1d'  },
  { label: '1w',  value: '1w'  },
]

export default function TaskInput({ defaultStatus = 'inbox', projectId, subfolderId, onTaskAdded }) {
  const uid      = useId()
  const dateRef  = useRef(null)
  const addTask  = useTaskStore((s) => s.addTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const addToast = useToastStore((s) => s.addToast)

  const [open,       setOpen]       = useState(false)
  const [title,      setTitle]      = useState('')
  const [priority,   setPriority]   = useState('medium')
  const [difficulty, setDifficulty] = useState('normal')
  const [isQuickWin, setIsQuickWin] = useState(false)
  const [isFrog,     setIsFrog]     = useState(false)
  const [category,   setCategory]   = useState('Other')
  const [dueDate,    setDueDate]    = useState('')
  const [duration,   setDuration]   = useState('')
  const [customDur,  setCustomDur]  = useState('')
  const [showDur,    setShowDur]    = useState(false)

  const cyclePriority = () => {
    const idx = priorities.indexOf(priority)
    setPriority(priorities[(idx + 1) % priorities.length])
  }

  const cycleDifficulty = () => {
    const idx = DIFFICULTY_LEVELS.indexOf(difficulty)
    setDifficulty(DIFFICULTY_LEVELS[(idx + 1) % DIFFICULTY_LEVELS.length])
  }

  const reset = () => {
    setTitle('')
    setPriority('medium')
    setDifficulty('normal')
    setIsQuickWin(false)
    setIsFrog(false)
    setCategory('Other')
    setDueDate('')
    setDuration('')
    setCustomDur('')
    setShowDur(false)
    setOpen(false)
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
      isFrog,
      difficulty,
      ...(projectId && { projectId }),
      ...(subfolderId && { subfolderId }),
      ...(dueDate && { dueDate: new Date(dueDate).toISOString() }),
      ...(duration && { estimatedDuration: duration }),
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

        {/* Difficulty */}
        <button
          type="button"
          onClick={cycleDifficulty}
          title="Cycle difficulty"
          style={{
            padding: '2px 8px', fontSize: '10px', fontFamily: 'var(--font-mono)',
            background: 'transparent',
            border: `1px solid ${difficultyColors[difficulty]}`,
            color: difficultyColors[difficulty],
            cursor: 'pointer', minWidth: 'unset',
            display: 'flex', alignItems: 'center', gap: '3px',
          }}
        >
          <Swords size={10} /> {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
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

        {/* Duration toggle */}
        <button
          type="button"
          onClick={() => setShowDur(!showDur)}
          title="Estimated duration"
          style={{
            padding: '2px 8px', fontSize: '10px',
            background: duration ? 'rgba(0,229,204,0.1)' : 'transparent',
            border: duration ? '1px solid var(--cyan-dim)' : '1px solid var(--border-mid)',
            color: duration ? 'var(--cyan)' : 'var(--text-ghost)',
            cursor: 'pointer', minWidth: 'unset',
          }}
        >
          ⏱ {duration || 'Duration'}
        </button>
      </div>

      {/* Duration presets + custom */}
      {showDur && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center', paddingLeft: '2px' }}>
          {DURATION_PRESETS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => { setDuration(p.value); setCustomDur(''); setShowDur(false) }}
              style={{
                padding: '2px 8px', fontSize: '10px', fontFamily: 'var(--font-mono)',
                background: duration === p.value ? 'rgba(0,229,204,0.15)' : 'var(--bg-base)',
                border: duration === p.value ? '1px solid var(--cyan)' : '1px solid var(--border-mid)',
                color: duration === p.value ? 'var(--cyan)' : 'var(--text-dim)',
                cursor: 'pointer', minWidth: 'unset',
              }}
            >
              {p.label}
            </button>
          ))}
          <input
            type="text"
            value={customDur}
            onChange={e => setCustomDur(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && customDur.trim()) {
                e.preventDefault(); e.stopPropagation()
                setDuration(customDur.trim())
                setShowDur(false)
              }
            }}
            placeholder="custom (3h30m)"
            style={{ width: '100px', fontSize: '10px', padding: '2px 6px', background: 'var(--bg-base)', color: 'var(--text)' }}
          />
          {duration && (
            <button
              type="button"
              onClick={() => { setDuration(''); setCustomDur('') }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-ghost)', fontSize: '10px', cursor: 'pointer', minWidth: 'unset', padding: '2px' }}
            >
              <X size={11} />
            </button>
          )}
        </div>
      )}

      {/* Submit row */}
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '2px' }}>
          <button
            type="submit"
            style={{
              padding: '3px 14px', fontSize: '10px', fontFamily: 'var(--font-mono)',
              background: 'var(--text-bright)', color: 'var(--bg-base)',
              border: 'none', cursor: 'pointer', minWidth: 'unset', fontWeight: 700,
            }}
          >
            + ADD
          </button>
          <span style={{ fontSize: '10px', color: 'var(--text-ghost)' }}>
            or <kbd style={{ padding: '1px 5px', background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', fontSize: '10px' }}>Enter</kbd>
          </span>
          {isFrog && <span style={{ fontSize: '10px', color: 'var(--text-bright)' }}>🐸 Eat the frog</span>}
          {duration && <span style={{ fontSize: '10px', color: 'var(--cyan)' }}>⏱ {duration}</span>}
        </div>
      )}
    </form>
  )
}
