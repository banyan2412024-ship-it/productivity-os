import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, FileText, CheckSquare, Repeat, Lightbulb } from 'lucide-react'
import { useNoteStore } from '../../stores/noteStore'
import { useTaskStore } from '../../stores/taskStore'
import { useHabitStore } from '../../stores/habitStore'
import { useIdeaStore } from '../../stores/ideaStore'

export default function QuickCapture() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('task') // task | note | habit
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 p-2 border-b border-gray-100">
          {[
            { key: 'task', icon: CheckSquare, label: 'Task' },
            { key: 'idea', icon: Lightbulb, label: 'Idea' },
            { key: 'note', icon: FileText, label: 'Note' },
            { key: 'habit', icon: Repeat, label: 'Habit' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                mode === key
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
          <button
            onClick={() => setOpen(false)}
            className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              mode === 'task'
                ? 'Add a task to inbox...'
                : mode === 'idea'
                  ? 'Capture an idea...'
                  : mode === 'note'
                    ? 'New note title...'
                    : 'New habit name...'
            }
            className="w-full px-4 py-4 text-lg outline-none bg-transparent placeholder:text-gray-400"
          />
        </form>

        <div className="px-4 pb-3 flex items-center justify-between text-xs text-gray-400">
          <span>Press Enter to create</span>
          <span>Ctrl+K to toggle</span>
        </div>
      </div>
    </div>
  )
}
