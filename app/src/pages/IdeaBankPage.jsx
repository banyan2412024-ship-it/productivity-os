import { useState, useMemo } from 'react'
import {
  Lightbulb,
  Plus,
  Search,
  Archive,
  Trash2,
  Calendar,
  Tag,
  X,
} from 'lucide-react'
import { useIdeaStore, IDEA_CATEGORIES } from '../stores/ideaStore'
import { useToastStore } from '../stores/toastStore'
import { format } from 'date-fns'

export default function IdeaBankPage() {
  const [tab, setTab] = useState('active')
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [editingId, setEditingId] = useState(null)

  const ideas = useIdeaStore((s) => s.ideas)
  const addIdea = useIdeaStore((s) => s.addIdea)
  const updateIdea = useIdeaStore((s) => s.updateIdea)
  const deleteIdea = useIdeaStore((s) => s.deleteIdea)
  const archiveIdea = useIdeaStore((s) => s.archiveIdea)
  const addToast = useToastStore((s) => s.addToast)

  const filtered = useMemo(() => {
    let list = ideas.filter((i) => (tab === 'active' ? i.status === 'active' : i.status === 'archived'))
    if (filterCategory !== 'all') list = list.filter((i) => i.category === filterCategory)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [ideas, tab, filterCategory, search])

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Lightbulb size={24} className="text-yellow-500" />
          <h1 className="text-2xl font-bold text-gray-900">Idea Bank</h1>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null) }}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600"
        >
          <Plus size={16} />
          New Idea
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-6">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {['active', 'archived'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors capitalize ${
                tab === t ? 'bg-white shadow text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none"
        >
          <option value="all">All Categories</option>
          {IDEA_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Form modal */}
      {showForm && (
        <IdeaForm
          editingIdea={editingId ? ideas.find((i) => i.id === editingId) : null}
          onSave={(data) => {
            if (editingId) {
              updateIdea(editingId, data)
            } else {
              const id = addIdea(data)
              addToast(`Idea "${data.title}" saved`, { type: 'success', undoFn: () => { deleteIdea(id); addToast('Undone', { type: 'info' }) } })
            }
            setShowForm(false)
            setEditingId(null)
          }}
          onClose={() => { setShowForm(false); setEditingId(null) }}
        />
      )}

      {/* Ideas grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Lightbulb size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400">
            {tab === 'active' ? 'No ideas yet. Capture your first one!' : 'No archived ideas.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((idea) => (
            <div
              key={idea.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3
                  className="text-base font-semibold text-gray-900 cursor-pointer hover:text-indigo-600"
                  onClick={() => { setEditingId(idea.id); setShowForm(true) }}
                >
                  {idea.title}
                </h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {tab === 'active' && (
                    <button
                      onClick={() => {
                        archiveIdea(idea.id)
                        addToast(`"${idea.title}" archived`, { type: 'info', undoFn: () => { updateIdea(idea.id, { status: 'active' }); addToast('Restored', { type: 'success' }) } })
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg"
                      title="Archive"
                    >
                      <Archive size={14} className="text-gray-400" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const saved = { ...idea }
                      deleteIdea(idea.id)
                      addToast(`"${idea.title}" deleted`, { type: 'info', undoFn: () => { addIdea(saved); addToast('Restored', { type: 'success' }) } })
                    }}
                    className="p-1.5 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
              {idea.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{idea.description}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  <Tag size={10} />
                  {idea.category}
                </span>
                {idea.reminderDate && (
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                    <Calendar size={10} />
                    {idea.reminderDate}
                  </span>
                )}
                <span className="text-xs text-gray-300 ml-auto">
                  {format(new Date(idea.createdAt), 'MMM d')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function IdeaForm({ editingIdea, onSave, onClose }) {
  const [title, setTitle] = useState(editingIdea?.title || '')
  const [description, setDescription] = useState(editingIdea?.description || '')
  const [category, setCategory] = useState(editingIdea?.category || 'Other')
  const [reminderDate, setReminderDate] = useState(editingIdea?.reminderDate || '')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ title: title.trim(), description, category, reminderDate: reminderDate || null })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{editingIdea ? 'Edit Idea' : 'New Idea'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Idea title"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your idea..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none resize-none"
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none"
              >
                {IDEA_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Reminder Date</label>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
              {editingIdea ? 'Update' : 'Save Idea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
