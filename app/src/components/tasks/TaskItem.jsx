import { useState, useRef, useEffect } from 'react'
import { useTaskStore, TASK_CATEGORIES, DIFFICULTY_LEVELS } from '../../stores/taskStore'
import { useToastStore } from '../../stores/toastStore'
import { useAgentAnimationStore } from '../../stores/agentAnimationStore'
import {
  Star, Zap, Trash2, Calendar,
  ChevronDown, ChevronRight,
  CheckCircle2, Circle, Tag, FolderOpen, FileText, Copy, Swords,
} from 'lucide-react'
import { format } from 'date-fns'

/* ── styles ─────────────────────────────────────────────────────────────────── */

const PRIORITY_STYLE = {
  high:   { background: 'var(--danger)',       color: '#fff' },
  medium: { background: 'var(--amber)',         color: '#000' },
  low:    { background: 'var(--border-bright)', color: 'var(--text)' },
}

const DIFFICULTY_STYLE = {
  easy:   { color: '#00ff41', label: 'Easy' },
  normal: { color: 'var(--text-ghost)', label: 'Normal' },
  hard:   { color: 'var(--amber)', label: 'Hard' },
  epic:   { color: 'var(--danger-bright)', label: 'EPIC' },
}

const labelStyle = {
  fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '1px',
  textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px',
}

const sectionStyle = { marginTop: '10px' }

/* ── component ──────────────────────────────────────────────────────────────── */

export default function TaskItem({ task, showGTDPrompts = false }) {
  const updateTask   = useTaskStore((s) => s.updateTask)
  const deleteTask   = useTaskStore((s) => s.deleteTask)
  const addTask      = useTaskStore((s) => s.addTask)
  const toggleMIT    = useTaskStore((s) => s.toggleMIT)
  const toggleFrog   = useTaskStore((s) => s.toggleFrog)
  const projects     = useTaskStore((s) => s.projects)
  const addToast     = useToastStore((s) => s.addToast)
  const triggerAnimation = useAgentAnimationStore((s) => s.triggerAnimation)

  const [expanded, setExpanded]       = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue]   = useState(task.title)
  const [notesValue, setNotesValue]   = useState(task.notes || '')
  const [descValue, setDescValue]     = useState(task.description || '')
  const titleRef = useRef(null)

  useEffect(() => {
    if (editingTitle && titleRef.current) {
      titleRef.current.focus()
      titleRef.current.select()
    }
  }, [editingTitle])

  // Sync local state when task prop changes
  useEffect(() => { setTitleValue(task.title) }, [task.title])
  useEffect(() => { setNotesValue(task.notes || '') }, [task.notes])
  useEffect(() => { setDescValue(task.description || '') }, [task.description])

  const isDone = task.status === 'done'

  const handleToggleDone = () => {
    const prevStatus = task.status
    if (isDone) {
      updateTask(task.id, { status: 'today' })
      addToast(`"${task.title}" reopened`, { type: 'info', undoFn: () => { updateTask(task.id, { status: prevStatus }) } })
    } else {
      updateTask(task.id, { status: 'done' })
      addToast(`"${task.title}" completed ✓`, { type: 'success', undoFn: () => { updateTask(task.id, { status: prevStatus }) } })
      triggerAnimation('celebrate')
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

  const cyclePriority = (e) => {
    e.stopPropagation()
    const order = ['high', 'medium', 'low']
    const next = order[(order.indexOf(task.priority) + 1) % order.length]
    updateTask(task.id, { priority: next })
  }

  const cycleDifficulty = (e) => {
    e.stopPropagation()
    const next = DIFFICULTY_LEVELS[(DIFFICULTY_LEVELS.indexOf(task.difficulty || 'normal') + 1) % DIFFICULTY_LEVELS.length]
    updateTask(task.id, { difficulty: next })
  }

  const handleNotesBlur = () => {
    if (notesValue !== task.notes) updateTask(task.id, { notes: notesValue })
  }

  const handleDescBlur = () => {
    if (descValue !== task.description) updateTask(task.id, { description: descValue })
  }

  const handleCopyDesc = () => {
    if (!descValue) return
    navigator.clipboard.writeText(descValue)
    addToast('Copied to clipboard', { type: 'success' })
  }

  const handleSchedule = (dateStr) => {
    if (dateStr) updateTask(task.id, { scheduledDate: new Date(dateStr).toISOString(), status: 'scheduled' })
  }

  const handleDueDate = (dateStr) => {
    updateTask(task.id, { dueDate: dateStr ? new Date(dateStr).toISOString() : null })
  }

  // Root projects only for dropdown
  const rootProjects = projects.filter((p) => !p.parentId)

  const pStyle = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium
  const diff = task.difficulty || 'normal'
  const dStyle = DIFFICULTY_STYLE[diff]

  const borderColor = task.isFrog && !isDone ? '#00ff41'
    : task.isMIT && !isDone ? 'var(--amber)'
    : task.isQuickWin && !isDone ? 'var(--cyan)'
    : 'var(--border)'

  return (
    <div
      style={{
        borderLeft: `3px solid ${borderColor}`,
        borderTop: '1px solid var(--border)',
        borderRight: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        background: isDone ? 'transparent' : 'var(--bg-surface)',
        opacity: isDone ? 0.55 : 1,
        marginBottom: '3px',
      }}
    >
      {/* ── Main row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px' }}>

        {/* Expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-ghost)', padding: '2px', cursor: 'pointer', minWidth: 'unset', display: 'flex' }}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* Checkbox */}
        <button
          onClick={handleToggleDone}
          style={{ background: 'transparent', border: 'none', color: isDone ? 'var(--neon)' : 'var(--text-ghost)', padding: '2px', cursor: 'pointer', minWidth: 'unset', display: 'flex' }}
        >
          {isDone ? <CheckCircle2 size={15} /> : <Circle size={15} />}
        </button>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingTitle ? (
            <input
              ref={titleRef}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave()
                if (e.key === 'Escape') { setTitleValue(task.title); setEditingTitle(false) }
              }}
              style={{ width: '100%', fontSize: '12px', background: 'transparent', color: 'var(--neon)', border: 'none', borderBottom: '1px solid var(--neon)', outline: 'none', padding: '1px 0' }}
            />
          ) : (
            <span
              onClick={() => !isDone && setEditingTitle(true)}
              style={{
                fontSize: '12px',
                color: isDone ? 'var(--text-ghost)' : 'var(--text)',
                textDecoration: isDone ? 'line-through' : 'none',
                cursor: isDone ? 'default' : 'text',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {task.title}
            </span>
          )}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>

          {/* Priority (cycling) */}
          <button
            onClick={cyclePriority}
            title="Cycle priority"
            style={{ ...pStyle, fontSize: '9px', padding: '1px 6px', border: 'none', cursor: 'pointer', minWidth: 'unset', letterSpacing: '0.5px' }}
          >
            {task.priority?.toUpperCase()}
          </button>

          {/* Difficulty (visible when non-normal) */}
          {diff !== 'normal' && (
            <button
              onClick={cycleDifficulty}
              title="Cycle difficulty"
              style={{ background: 'transparent', border: `1px solid ${dStyle.color}`, color: dStyle.color, fontSize: '9px', padding: '1px 5px', cursor: 'pointer', minWidth: 'unset' }}
            >
              {dStyle.label}
            </button>
          )}

          {/* Quick win */}
          <button
            onClick={(e) => { e.stopPropagation(); updateTask(task.id, { isQuickWin: !task.isQuickWin }) }}
            title="Quick Win"
            style={{ background: 'transparent', border: 'none', color: task.isQuickWin ? 'var(--cyan)' : 'var(--text-ghost)', padding: '2px', cursor: 'pointer', minWidth: 'unset', display: 'flex', opacity: task.isQuickWin ? 1 : 0.4 }}
          >
            <Zap size={12} />
          </button>

          {/* MIT */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleMIT(task.id) }}
            title="Most Important Task"
            style={{ background: 'transparent', border: 'none', color: task.isMIT ? 'var(--amber)' : 'var(--text-ghost)', padding: '2px', cursor: 'pointer', minWidth: 'unset', display: 'flex', opacity: task.isMIT ? 1 : 0.4 }}
          >
            <Star size={12} fill={task.isMIT ? 'currentColor' : 'none'} />
          </button>

          {/* Frog */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFrog(task.id) }}
            title="Eat the Frog"
            style={{ background: 'transparent', border: 'none', fontSize: '12px', padding: '1px', cursor: 'pointer', minWidth: 'unset', opacity: task.isFrog ? 1 : 0.4 }}
          >
            🐸
          </button>

          {/* Due date */}
          {task.dueDate && (
            <span style={{ fontSize: '10px', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Calendar size={10} />{format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              const saved = { ...task }
              deleteTask(task.id)
              addToast(`"${task.title}" deleted`, { type: 'info', undoFn: () => { addTask(saved) } })
            }}
            title="Delete"
            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', padding: '2px', cursor: 'pointer', minWidth: 'unset', display: 'flex', opacity: 0.5 }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* ── GTD prompts ── */}
      {showGTDPrompts && !isDone && (
        <div style={{ padding: '4px 28px', borderTop: '1px dashed var(--border)', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-ghost)' }}>QUICK ACTION:</span>
          <button onClick={() => updateTask(task.id, { status: 'cancelled' })} style={{ fontSize: '9px', padding: '2px 8px' }}>Not actionable</button>
          <button onClick={() => updateTask(task.id, { isQuickWin: true, status: 'today' })} style={{ fontSize: '9px', padding: '2px 8px' }}>⚡ Under 2min</button>
          <input type="date" onChange={(e) => handleSchedule(e.target.value)} style={{ fontSize: '9px', padding: '2px 6px' }} />
          <button onClick={() => updateTask(task.id, { status: 'today' })} style={{ fontSize: '9px', padding: '2px 8px' }}>Do today</button>
        </div>
      )}

      {/* ── Expanded details ── */}
      {expanded && (
        <div style={{ padding: '10px 12px 12px', borderTop: '1px solid var(--border)' }}>

          {/* Description / Prompt copy box */}
          <div style={sectionStyle}>
            <div style={{ ...labelStyle, justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Copy size={10} /> PROMPT / DESCRIPTION
              </span>
              {descValue && (
                <button
                  onClick={handleCopyDesc}
                  title="Copy to clipboard"
                  style={{ background: 'var(--neon)', color: '#000', border: 'none', fontSize: '9px', padding: '2px 8px', cursor: 'pointer', minWidth: 'unset', letterSpacing: '0.5px' }}
                >
                  [ COPY ]
                </button>
              )}
            </div>
            <textarea
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              onBlur={handleDescBlur}
              placeholder="> write a prompt or description to copy..."
              rows={3}
              style={{ width: '100%', fontSize: '11px', resize: 'vertical', background: 'var(--bg-base)' }}
            />
          </div>

          {/* Notes */}
          <div style={sectionStyle}>
            <div style={labelStyle}><FileText size={10} /> NOTES</div>
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="> internal notes..."
              rows={2}
              style={{ width: '100%', fontSize: '11px', resize: 'vertical', background: 'var(--bg-base)' }}
            />
          </div>

          {/* Row: dates */}
          <div style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={labelStyle}><Calendar size={10} /> DUE DATE</div>
              <input
                type="date"
                value={task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''}
                onChange={(e) => handleDueDate(e.target.value)}
                style={{ width: '100%', fontSize: '11px' }}
              />
            </div>
            <div>
              <div style={labelStyle}><Calendar size={10} /> SCHEDULED</div>
              <input
                type="date"
                value={task.scheduledDate ? format(new Date(task.scheduledDate), 'yyyy-MM-dd') : ''}
                onChange={(e) => handleSchedule(e.target.value)}
                style={{ width: '100%', fontSize: '11px' }}
              />
            </div>
          </div>

          {/* Row: priority / difficulty / category / project */}
          <div style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={labelStyle}>PRIORITY</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['high', 'medium', 'low'].map((p) => (
                  <button
                    key={p}
                    onClick={() => updateTask(task.id, { priority: p })}
                    style={{
                      ...PRIORITY_STYLE[p],
                      fontSize: '9px', padding: '2px 8px', border: 'none',
                      cursor: 'pointer', minWidth: 'unset',
                      opacity: task.priority === p ? 1 : 0.4,
                    }}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={labelStyle}><Swords size={10} /> DIFFICULTY</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {DIFFICULTY_LEVELS.map((d) => (
                  <button
                    key={d}
                    onClick={() => updateTask(task.id, { difficulty: d })}
                    style={{
                      fontSize: '9px', padding: '2px 6px',
                      background: 'transparent',
                      border: `1px solid ${DIFFICULTY_STYLE[d].color}`,
                      color: DIFFICULTY_STYLE[d].color,
                      cursor: 'pointer', minWidth: 'unset',
                      opacity: (task.difficulty || 'normal') === d ? 1 : 0.35,
                    }}
                  >
                    {DIFFICULTY_STYLE[d].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={labelStyle}><Tag size={10} /> CATEGORY</div>
              <select
                value={task.category || 'Other'}
                onChange={(e) => updateTask(task.id, { category: e.target.value })}
                style={{ width: '100%', fontSize: '10px' }}
              >
                {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <div style={labelStyle}><FolderOpen size={10} /> PROJECT</div>
              <select
                value={task.projectId || ''}
                onChange={(e) => updateTask(task.id, { projectId: e.target.value || null })}
                style={{ width: '100%', fontSize: '10px' }}
              >
                <option value="">— none —</option>
                {rootProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div style={sectionStyle}>
            <div style={labelStyle}><Tag size={10} /> TAGS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
              {(task.tags || []).map((tag, i) => (
                <span
                  key={i}
                  style={{ fontSize: '10px', color: 'var(--cyan)', border: '1px solid var(--cyan-dim)', padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {tag}
                  <button
                    onClick={() => updateTask(task.id, { tags: task.tags.filter((_, idx) => idx !== i) })}
                    style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', minWidth: 'unset', padding: '0', fontSize: '11px', lineHeight: 1 }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                placeholder="+ tag"
                style={{ fontSize: '10px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-dim)', width: '60px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    updateTask(task.id, { tags: [...(task.tags || []), e.target.value.trim()] })
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
