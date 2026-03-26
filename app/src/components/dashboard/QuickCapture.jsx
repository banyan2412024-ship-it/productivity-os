import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, FileText, CheckSquare, Repeat, Lightbulb } from 'lucide-react'
import { useNoteStore } from '../../stores/noteStore'
import { useTaskStore } from '../../stores/taskStore'
import { useHabitStore } from '../../stores/habitStore'
import { useIdeaStore } from '../../stores/ideaStore'

export default function QuickCapture() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('task')
  const [value, setValue] = useState('')
  const navigate = useNavigate()
  const createNote = useNoteStore((s) => s.createNote)
  const addTask = useTaskStore((s) => s.addTask)
  const addHabit = useHabitStore((s) => s.addHabit)
  const addIdea = useIdeaStore((s) => s.addIdea)

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) setValue('')
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim()) return

    if (mode === 'note') {
      const id = createNote(value.trim())
      navigate(`/notes/${id}`)
    } else if (mode === 'task') {
      addTask({ title: value.trim(), status: 'inbox' })
    } else if (mode === 'habit') {
      addHabit({ name: value.trim() })
    } else if (mode === 'idea') {
      addIdea({ title: value.trim() })
    }

    setOpen(false)
    setValue('')
  }

  if (!open) return null

  const modes = [
    { key: 'task', icon: CheckSquare, label: 'Task' },
    { key: 'idea', icon: Lightbulb, label: 'Idea' },
    { key: 'note', icon: FileText, label: 'Note' },
    { key: 'habit', icon: Repeat, label: 'Habit' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          background: 'var(--bg-surface)',
          borderTop: '2px solid #1a6b1a',
          borderLeft: '2px solid #1a6b1a',
          borderRight: '2px solid #003300',
          borderBottom: '2px solid #003300',
          boxShadow: '0 0 20px rgba(0,255,65,0.3)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {/* Title bar */}
        <div style={{
          background: 'linear-gradient(90deg, #003d00, #001a00)',
          borderBottom: '1px solid var(--neon)',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--neon)',
        }}>
          <span>// QUICK_CAPTURE</span>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px', minWidth: 0, fontSize: '11px' }}>✕</button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: '2px', padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
          {modes.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                fontSize: '10px',
                minWidth: 0,
                background: mode === key ? 'var(--sel-bg)' : 'transparent',
                border: mode === key ? '1px solid var(--neon)' : '1px solid transparent',
                color: mode === key ? 'var(--neon)' : 'var(--text-ghost)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              mode === 'task' ? '> add task to inbox...'
                : mode === 'idea' ? '> capture idea...'
                : mode === 'note' ? '> new note title...'
                : '> new habit name...'
            }
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--bg-base)',
              border: 'none',
              borderBottom: '1px solid var(--border)',
              color: 'var(--neon)',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
            }}
          />
        </form>

        {/* Footer */}
        <div style={{ padding: '6px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-ghost)' }}>
          <span>ENTER to create</span>
          <span>CTRL+K to toggle</span>
        </div>
      </div>
    </div>
  )
}
