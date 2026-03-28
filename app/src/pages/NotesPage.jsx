import { useParams, useNavigate } from 'react-router-dom'
import { FileText, ArrowLeft } from 'lucide-react'
import NoteList from '../components/notes/NoteList'
import NoteEditor from '../components/notes/NoteEditor'

export default function NotesPage() {
  const { noteId } = useParams()
  const navigate = useNavigate()

  const handleSelectNote = (id) => navigate(`/notes/${id}`)
  const handleBack = () => navigate('/notes')

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>

      {/* Note list — hidden on mobile when a note is open */}
      <div className={noteId ? 'notes-list-hidden-mobile' : 'notes-list-visible'}>
        <NoteList activeNoteId={noteId} onSelectNote={handleSelectNote} />
      </div>

      {/* Editor / empty state */}
      {noteId ? (
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Mobile back button */}
          <div className="notes-back-btn" style={{ display: 'none' }}>
            <button
              onClick={handleBack}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '8px 12px', width: '100%', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}
            >
              <ArrowLeft size={13} /> back to notes
            </button>
          </div>
          <NoteEditor noteId={noteId} onNavigate={handleSelectNote} />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}
          className="notes-empty-state"
        >
          <div style={{ textAlign: 'center' }}>
            <FileText size={32} style={{ color: 'var(--text-ghost)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '11px', color: 'var(--text-ghost)' }}>&gt; select a note or create one</p>
          </div>
        </div>
      )}
    </div>
  )
}
