import { useState } from 'react'
import { useNoteStore } from '../../stores/noteStore'
import { formatDistanceToNow } from 'date-fns'
import { Plus, Search, FileText } from 'lucide-react'

export default function NoteList({ activeNoteId, onSelectNote }) {
  const [searchQuery, setSearchQuery] = useState('')
  const notes = useNoteStore((s) => s.notes)
  const searchNotes = useNoteStore((s) => s.searchNotes)
  const createNote = useNoteStore((s) => s.createNote)

  const displayedNotes = searchQuery.trim()
    ? searchNotes(searchQuery)
    : [...notes]

  const sorted = displayedNotes.sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  )

  const handleCreateNote = () => {
    const id = createNote()
    onSelectNote(id)
  }

  const getPreview = (content) => {
    if (!content) return 'Empty note'
    // Strip HTML tags for preview
    const text = content.replace(/<[^>]*>/g, '').trim()
    if (!text) return 'Empty note'
    return text.length > 80 ? text.slice(0, 80) + '...' : text
  }

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
          <button
            onClick={handleCreateNote}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
          >
            <Plus size={16} />
            New Note
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-300"
          />
        </div>
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <FileText size={40} className="mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first note to get started'}
            </p>
          </div>
        ) : (
          sorted.map((note) => (
            <button
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors ${
                note.id === activeNoteId
                  ? 'bg-indigo-50 border-l-2 border-l-indigo-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              <h3
                className={`truncate text-sm font-medium ${
                  note.id === activeNoteId ? 'text-indigo-700' : 'text-gray-900'
                }`}
              >
                {note.title || 'Untitled'}
              </h3>

              <p className="mt-0.5 truncate text-xs text-gray-500">
                {getPreview(note.content)}
              </p>

              <div className="mt-1.5 flex items-center gap-2">
                {note.tags.length > 0 && (
                  <div className="flex items-center gap-1 overflow-hidden">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-block truncate rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-[10px] text-gray-400">
                        +{note.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
                <span className="ml-auto shrink-0 text-[10px] text-gray-400">
                  {formatDistanceToNow(new Date(note.updatedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
