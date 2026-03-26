import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useNoteStore } from '../../stores/noteStore'
import { formatDistanceToNow } from 'date-fns'
import { X, Link2, ArrowUpRight, Tag } from 'lucide-react'
import SlashCommandMenu from './SlashCommandMenu'

export default function NoteEditor({ noteId, onNavigate }) {
  const notes = useNoteStore((s) => s.notes)
  const updateNote = useNoteStore((s) => s.updateNote)
  const addTag = useNoteStore((s) => s.addTag)
  const removeTag = useNoteStore((s) => s.removeTag)
  const linkNotes = useNoteStore((s) => s.linkNotes)
  const unlinkNotes = useNoteStore((s) => s.unlinkNotes)
  const note = useMemo(() => notes.find((n) => n.id === noteId), [notes, noteId])

  const [title, setTitle] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 })
  const [showLinkPicker, setShowLinkPicker] = useState(false)
  const [linkSearch, setLinkSearch] = useState('')

  const saveTimeoutRef = useRef(null)
  const editorContainerRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing, or type '/' for commands",
      }),
    ],
    content: note?.content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      debouncedSave(html)

      // Detect slash command
      const { from } = editor.state.selection
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 1),
        from,
        '\0'
      )

      if (textBefore === '/') {
        // Get cursor position for menu placement
        const coords = editor.view.coordsAtPos(from)
        const containerRect = editorContainerRef.current?.getBoundingClientRect()
        if (containerRect) {
          setSlashMenuPos({
            top: coords.bottom - containerRect.top + 4,
            left: coords.left - containerRect.left,
          })
        }
        setShowSlashMenu(true)
      }
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[300px] text-gray-900',
      },
    },
  })

  // Sync editor content when switching notes
  useEffect(() => {
    if (note && editor) {
      if (editor.getHTML() !== note.content) {
        editor.commands.setContent(note.content || '')
      }
      setTitle(note.title || '')
    }
  }, [noteId, note, editor])

  const debouncedSave = useCallback(
    (content) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        if (noteId) {
          updateNote(noteId, { content })
        }
      }, 500)
    },
    [noteId, updateNote]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (noteId) {
      updateNote(noteId, { title: newTitle })
    }
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      editor?.commands.focus('start')
    }
  }

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      addTag(noteId, tagInput.trim())
      setTagInput('')
    }
  }

  const handleCloseSlashMenu = useCallback(() => {
    setShowSlashMenu(false)
  }, [])

  if (!note) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Note not found</p>
      </div>
    )
  }

  const linkedNotes = note.linkedNotes
    .map((id) => notes.find((n) => n.id === id))
    .filter(Boolean)
  const backlinks = notes.filter(
    (n) => n.linkedNotes.includes(noteId) && !note.linkedNotes.includes(n.id)
  )
  const availableToLink = notes.filter(
    (n) => n.id !== noteId && !note.linkedNotes.includes(n.id)
  )
  const filteredLinkOptions = linkSearch.trim()
    ? availableToLink.filter((n) =>
        n.title.toLowerCase().includes(linkSearch.toLowerCase())
      )
    : availableToLink

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-white">
      <div className="mx-auto w-full max-w-3xl px-8 py-8">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          placeholder="Untitled"
          className="w-full border-none bg-transparent text-3xl font-bold text-gray-900 placeholder-gray-300 outline-none"
        />

        {/* Editor */}
        <div ref={editorContainerRef} className="relative mt-4">
          <EditorContent editor={editor} />
          {showSlashMenu && editor && (
            <SlashCommandMenu
              editor={editor}
              position={slashMenuPos}
              onClose={handleCloseSlashMenu}
            />
          )}
        </div>

        {/* Tags Section */}
        <div className="mt-8 border-t border-gray-100 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={16} className="text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700">Tags</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700"
              >
                {tag}
                <button
                  onClick={() => removeTag(noteId, tag)}
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-indigo-100"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add a tag..."
              className="rounded-lg border border-dashed border-gray-300 bg-transparent px-3 py-1 text-sm text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-indigo-300"
            />
          </div>
        </div>

        {/* Linked Notes Section */}
        <div className="mt-6 border-t border-gray-100 pt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 size={16} className="text-gray-400" />
              <h3 className="text-sm font-medium text-gray-700">Linked Notes</h3>
            </div>
            <button
              onClick={() => setShowLinkPicker(!showLinkPicker)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              {showLinkPicker ? 'Cancel' : '+ Link Note'}
            </button>
          </div>

          {showLinkPicker && (
            <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <input
                type="text"
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
                placeholder="Search notes to link..."
                className="mb-2 w-full rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-300"
              />
              <div className="max-h-36 overflow-y-auto">
                {filteredLinkOptions.length === 0 ? (
                  <p className="py-2 text-center text-xs text-gray-400">
                    No notes available to link
                  </p>
                ) : (
                  filteredLinkOptions.slice(0, 10).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        linkNotes(noteId, n.id)
                        setShowLinkPicker(false)
                        setLinkSearch('')
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      {n.title || 'Untitled'}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {linkedNotes.length === 0 && !showLinkPicker ? (
            <p className="text-xs text-gray-400">No linked notes</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {linkedNotes.map((linked) => (
                <div
                  key={linked.id}
                  className="group flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 transition-colors hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <button
                    onClick={() => onNavigate(linked.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <ArrowUpRight
                      size={14}
                      className="shrink-0 text-gray-400 group-hover:text-indigo-500"
                    />
                    <span className="truncate text-sm font-medium text-gray-700 group-hover:text-indigo-700">
                      {linked.title || 'Untitled'}
                    </span>
                  </button>
                  <button
                    onClick={() => unlinkNotes(noteId, linked.id)}
                    className="ml-2 shrink-0 rounded p-1 text-gray-400 opacity-0 transition-all hover:bg-gray-200 hover:text-gray-600 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Backlinks Section */}
        {backlinks.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <div className="mb-3 flex items-center gap-2">
              <Link2 size={16} className="rotate-90 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-700">Backlinks</h3>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {backlinks.length}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {backlinks.map((bl) => (
                <button
                  key={bl.id}
                  onClick={() => onNavigate(bl.id)}
                  className="group flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <ArrowUpRight
                    size={14}
                    className="shrink-0 text-gray-400 group-hover:text-indigo-500"
                  />
                  <span className="truncate text-sm font-medium text-gray-700 group-hover:text-indigo-700">
                    {bl.title || 'Untitled'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Last Edited */}
        <div className="mt-8 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400">
            Last edited{' '}
            {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  )
}
