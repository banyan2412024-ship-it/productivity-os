import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
} from 'lucide-react'

const COMMANDS = [
  {
    label: 'Text',
    description: 'Plain text block',
    icon: Type,
    action: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    label: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: 'Bullet List',
    description: 'Unordered list of items',
    icon: List,
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: 'Numbered List',
    description: 'Ordered list of items',
    icon: ListOrdered,
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    label: 'Checkbox',
    description: 'Task list with checkboxes',
    icon: CheckSquare,
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    label: 'Quote',
    description: 'Block quote for callouts',
    icon: Quote,
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    label: 'Code Block',
    description: 'Formatted code snippet',
    icon: Code,
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: 'Divider',
    description: 'Horizontal rule separator',
    icon: Minus,
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
]

export default function SlashCommandMenu({ editor, position, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef(null)

  const filtered = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  )

  const executeCommand = useCallback(
    (command) => {
      // Delete the slash and any typed query from the editor
      const { from } = editor.state.selection
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - query.length - 1),
        from,
        '\0'
      )
      const slashPos = textBefore.lastIndexOf('/')
      if (slashPos !== -1) {
        const deleteFrom = from - (textBefore.length - slashPos)
        editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run()
      }
      command.action(editor)
      onClose()
    },
    [editor, query, onClose]
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % Math.max(filtered.length, 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev <= 0 ? Math.max(filtered.length - 1, 0) : prev - 1
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          executeCommand(filtered[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Backspace') {
        if (query.length === 0) {
          onClose()
        } else {
          setQuery((prev) => prev.slice(0, -1))
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setQuery((prev) => prev + e.key)
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [filtered, selectedIndex, query, executeCommand, onClose])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (filtered.length === 0) {
    return (
      <div
        ref={menuRef}
        className="absolute z-50 w-72 rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
        style={{ top: position.top, left: position.left }}
      >
        <p className="px-4 py-2 text-sm text-gray-500">No results</p>
      </div>
    )
  }

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-72 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      {filtered.map((cmd, index) => {
        const Icon = cmd.icon
        return (
          <button
            key={cmd.label}
            className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
              index === selectedIndex
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => executeCommand(cmd)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded border ${
                index === selectedIndex
                  ? 'border-indigo-200 bg-indigo-100'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{cmd.label}</p>
              <p className="truncate text-xs text-gray-500">{cmd.description}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
