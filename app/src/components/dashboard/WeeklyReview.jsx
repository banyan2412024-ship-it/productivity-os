import { useState } from 'react'
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
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
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
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--neon)',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}>
          <span>// WEEKLY_REVIEW</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px', minWidth: 0, fontSize: '11px' }}>✕</button>
        </div>

        <div style={{ padding: '16px' }}>
          <p style={{ fontSize: '10px', color: 'var(--text-ghost)', marginBottom: '16px' }}>// reflect on your week and plan ahead</p>

          {PROMPTS.map((prompt) => (
            <div key={prompt.key} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                {'>'} {prompt.label}
              </label>
              <textarea
                value={answers[prompt.key]}
                onChange={(e) => setAnswers((a) => ({ ...a, [prompt.key]: e.target.value }))}
                rows={3}
                placeholder="write your thoughts..."
                style={{
                  width: '100%',
                  resize: 'none',
                  background: 'var(--bg-base)',
                  borderTop: '2px solid #003300',
                  borderLeft: '2px solid #003300',
                  borderRight: '2px solid #1a6b1a',
                  borderBottom: '2px solid #1a6b1a',
                  color: 'var(--neon)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  padding: '8px',
                }}
              />
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <button onClick={onClose} style={{ fontSize: '11px', padding: '4px 12px', color: 'var(--text-ghost)', background: 'var(--bg-surface)', borderTop: '2px solid #1a6b1a', borderLeft: '2px solid #1a6b1a', borderRight: '2px solid #003300', borderBottom: '2px solid #003300', cursor: 'pointer', fontFamily: 'var(--font-mono)', minWidth: 0 }}>
              [ SKIP ]
            </button>
            <button onClick={handleSave} style={{ fontSize: '11px', padding: '4px 12px', color: 'var(--neon)', background: 'var(--bg-surface)', borderTop: '2px solid #1a6b1a', borderLeft: '2px solid #1a6b1a', borderRight: '2px solid #003300', borderBottom: '2px solid #003300', cursor: 'pointer', fontFamily: 'var(--font-mono)', minWidth: 0, boxShadow: '0 0 4px rgba(0,255,65,0.3)' }}>
              [ SAVE ]
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
