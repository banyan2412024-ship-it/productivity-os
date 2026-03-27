import { create } from 'zustand'
import { supabasePersist as dexiePersist } from './supabasePersist'
import { v4 as uuid } from 'uuid'
import { format } from 'date-fns'

export const useCalendarStore = create(
  dexiePersist(
    (set, get) => ({
      calendarEvents: [],

      addEvent: (event) => {
        const newEvent = {
          id: uuid(),
          title: event.title || '',
          date: event.date || format(new Date(), 'yyyy-MM-dd'),
          startTime: event.startTime || '09:00',
          endTime: event.endTime || '10:00',
          type: event.type || 'event', // 'event' | 'idea-reminder'
          color: event.color || '#6366f1',
          description: event.description || '',
          ideaId: event.ideaId || null,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ calendarEvents: [...s.calendarEvents, newEvent] }))
        return newEvent.id
      },

      updateEvent: (id, updates) =>
        set((s) => ({
          calendarEvents: s.calendarEvents.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      deleteEvent: (id) =>
        set((s) => ({
          calendarEvents: s.calendarEvents.filter((e) => e.id !== id),
        })),

      getEventsForDate: (dateStr) =>
        get().calendarEvents.filter((e) => e.date === dateStr),

      getEventsForMonth: (year, month) =>
        get().calendarEvents.filter((e) => {
          const d = new Date(e.date)
          return d.getFullYear() === year && d.getMonth() === month
        }),
    }),
    {
      tables: { calendarEvents: 'calendarEvents' },
    }
  )
)
