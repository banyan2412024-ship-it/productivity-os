import { create } from 'zustand'
import { dexiePersist } from './dexiePersist'
import { v4 as uuid } from 'uuid'
import { format } from 'date-fns'

export const IDEA_CATEGORIES = [
  'Business',
  'Creative',
  'Personal',
  'Tech',
  'Health',
  'Learning',
  'Social',
  'Other',
]

export const useIdeaStore = create(
  dexiePersist(
    (set, get) => ({
      ideas: [],

      addIdea: (idea) => {
        const newIdea = {
          id: uuid(),
          title: idea.title || '',
          description: idea.description || '',
          category: idea.category || 'Other',
          reminderDate: idea.reminderDate || null,
          status: 'active', // 'active' | 'archived' | 'converted'
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ ideas: [newIdea, ...s.ideas] }))
        return newIdea.id
      },

      updateIdea: (id, updates) =>
        set((s) => ({
          ideas: s.ideas.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),

      deleteIdea: (id) =>
        set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) })),

      archiveIdea: (id) =>
        set((s) => ({
          ideas: s.ideas.map((i) =>
            i.id === id ? { ...i, status: 'archived' } : i
          ),
        })),

      getActiveIdeas: () => get().ideas.filter((i) => i.status === 'active'),

      getIdeasByCategory: (category) =>
        get().ideas.filter((i) => i.category === category && i.status === 'active'),

      getIdeasWithReminders: (dateStr) => {
        const date = dateStr || format(new Date(), 'yyyy-MM-dd')
        return get().ideas.filter(
          (i) => i.reminderDate === date && i.status === 'active'
        )
      },
    }),
    {
      tables: { ideas: 'ideas' },
    }
  )
)
