import { create } from 'zustand'
import { supabasePersist as dexiePersist } from './supabasePersist'
import { v4 as uuid } from 'uuid'

export const useNoteStore = create(
  dexiePersist(
    (set, get) => ({
      notes: [],

      createNote: (title = '') => {
        const note = {
          id: uuid(),
          title: title || 'Untitled',
          content: '',
          tags: [],
          linkedNotes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ notes: [note, ...s.notes] }))
        return note.id
      },

      updateNote: (id, updates) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
          ),
        })),

      deleteNote: (id) =>
        set((s) => ({
          notes: s.notes
            .filter((n) => n.id !== id)
            .map((n) => ({
              ...n,
              linkedNotes: n.linkedNotes.filter((lid) => lid !== id),
            })),
        })),

      linkNotes: (idA, idB) =>
        set((s) => ({
          notes: s.notes.map((n) => {
            if (n.id === idA && !n.linkedNotes.includes(idB))
              return { ...n, linkedNotes: [...n.linkedNotes, idB] }
            if (n.id === idB && !n.linkedNotes.includes(idA))
              return { ...n, linkedNotes: [...n.linkedNotes, idA] }
            return n
          }),
        })),

      unlinkNotes: (idA, idB) =>
        set((s) => ({
          notes: s.notes.map((n) => {
            if (n.id === idA) return { ...n, linkedNotes: n.linkedNotes.filter((l) => l !== idB) }
            if (n.id === idB) return { ...n, linkedNotes: n.linkedNotes.filter((l) => l !== idA) }
            return n
          }),
        })),

      addTag: (id, tag) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id && !n.tags.includes(tag) ? { ...n, tags: [...n.tags, tag] } : n
          ),
        })),

      removeTag: (id, tag) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, tags: n.tags.filter((t) => t !== tag) } : n
          ),
        })),

      searchNotes: (query) => {
        const q = query.toLowerCase()
        return get().notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            n.tags.some((t) => t.toLowerCase().includes(q))
        )
      },

      getNote: (id) => get().notes.find((n) => n.id === id),

      getBacklinks: (id) => get().notes.filter((n) => n.linkedNotes.includes(id)),
    }),
    {
      tables: { notes: 'notes' },
    }
  )
)
