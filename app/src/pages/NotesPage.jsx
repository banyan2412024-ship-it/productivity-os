import { useParams, useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import NoteList from '../components/notes/NoteList'
import NoteEditor from '../components/notes/NoteEditor'

export default function NotesPage() {
  const { noteId } = useParams()
  const navigate = useNavigate()

  const handleSelectNote = (id) => {
    navigate(`/notes/${id}`)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <NoteList activeNoteId={noteId} onSelectNote={handleSelectNote} />

      {noteId ? (
        <NoteEditor noteId={noteId} onNavigate={handleSelectNote} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <FileText size={32} className="text-gray-300" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700">
              No note selected
            </h2>
            <p className="mt-1 max-w-xs text-sm text-gray-400">
              Select a note from the sidebar or create a new one to get started.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
