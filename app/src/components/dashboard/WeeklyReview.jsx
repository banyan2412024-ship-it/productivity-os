import { useState } from 'react'
import { X, BookOpen } from 'lucide-react'
import { useNoteStore } from '../../stores/noteStore'
import { format } from 'date-fns'

const PROMPTS = [
  { key: 'accomplished', label: 'What did you accomplish this week?' },
  { key: 'habits', label: 'What habits did you maintain?' },
  { key: 'focus', label: 'What will your 3 focus areas be next week?' },
  { key: 'openLoops', label: 'Are there any open loops to capture?' },
]

export default function WeeklyReview({ onClose }) {
  const [answers, setAnswers] = useState({
    accomplished: '',
    habits: '',
    focus: '',
    openLoops: '',
  })
  const createNote = useNoteStore((s) => s.createNote)
  const updateNote = useNoteStore((s) => s.updateNote)

  const handleSave = () => {
    const dateStr = format(new Date(), 'MMMM d, yyyy')
    const title = `Weekly Review — ${dateStr}`
    const content = PROMPTS.map(
      (p) => `<h2>${p.label}</h2><p>${answers[p.key] || '(not answered)'}</p>`
    ).join('')

    const id = createNote(title)
    updateNote(id, { content, tags: ['weekly-review'] })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <BookOpen size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Weekly Review</h2>
              <p className="text-sm text-gray-500">Reflect on your week and plan ahead</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {PROMPTS.map((prompt) => (
            <div key={prompt.key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {prompt.label}
              </label>
              <textarea
                value={answers[prompt.key]}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [prompt.key]: e.target.value }))
                }
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Write your thoughts..."
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Save Review as Note
          </button>
        </div>
      </div>
    </div>
  )
}
