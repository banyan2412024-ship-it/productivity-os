import { create } from 'zustand'
import { supabasePersist as dexiePersist } from './supabasePersist'
import { v4 as uuid } from 'uuid'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns'

export const usePomodoroStore = create(
  dexiePersist(
    (set, get) => ({
      // Settings (persisted as scalars)
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 20,
      longBreakAfter: 4,

      // Timer state (transient — not persisted)
      status: 'idle',
      mode: 'focus',
      timeLeft: 25 * 60,
      linkedTaskId: null,
      currentSessionId: null,

      // Persisted data
      pomodorosCompleted: 0,
      sessions: [],
      timeBlocks: [],

      updateSettings: (settings) => {
        set(settings)
        if (get().status === 'idle') {
          set({ timeLeft: (settings.focusDuration || get().focusDuration) * 60 })
        }
      },

      startTimer: (taskId = null) => {
        const s = get()
        const duration =
          s.mode === 'focus'
            ? s.focusDuration
            : s.mode === 'shortBreak'
              ? s.shortBreakDuration
              : s.longBreakDuration
        set({
          status: s.mode === 'focus' ? 'running' : s.mode === 'shortBreak' ? 'break' : 'longBreak',
          timeLeft: duration * 60,
          linkedTaskId: taskId || s.linkedTaskId,
          currentSessionId: uuid(),
        })
      },

      tick: () => {
        const s = get()
        if (s.timeLeft <= 1) {
          if (s.mode === 'focus') {
            const newCount = s.pomodorosCompleted + 1
            const session = {
              id: s.currentSessionId || uuid(),
              linkedTaskId: s.linkedTaskId,
              duration: s.focusDuration,
              completedAt: new Date().toISOString(),
              date: format(new Date(), 'yyyy-MM-dd'),
            }
            const isLongBreak = newCount % s.longBreakAfter === 0
            set({
              pomodorosCompleted: newCount,
              sessions: [...s.sessions, session],
              mode: isLongBreak ? 'longBreak' : 'shortBreak',
              status: 'idle',
              timeLeft: (isLongBreak ? s.longBreakDuration : s.shortBreakDuration) * 60,
            })
          } else {
            set({
              mode: 'focus',
              status: 'idle',
              timeLeft: s.focusDuration * 60,
            })
          }
          return true
        }
        set({ timeLeft: s.timeLeft - 1 })
        return false
      },

      pauseTimer: () => set({ status: 'idle' }),

      resetTimer: () => {
        const s = get()
        set({
          status: 'idle',
          mode: 'focus',
          timeLeft: s.focusDuration * 60,
          linkedTaskId: null,
          currentSessionId: null,
        })
      },

      setMode: (mode) => {
        const s = get()
        const duration =
          mode === 'focus'
            ? s.focusDuration
            : mode === 'shortBreak'
              ? s.shortBreakDuration
              : s.longBreakDuration
        set({ mode, timeLeft: duration * 60, status: 'idle' })
      },

      linkTask: (taskId) => set({ linkedTaskId: taskId }),

      // Time blocking
      addTimeBlock: (block) => {
        const newBlock = {
          id: uuid(),
          title: block.title || '',
          startTime: block.startTime,
          endTime: block.endTime,
          date: block.date || format(new Date(), 'yyyy-MM-dd'),
          color: block.color || '#6366f1',
          taskId: block.taskId || null,
        }
        set((s) => ({ timeBlocks: [...s.timeBlocks, newBlock] }))
        return newBlock.id
      },

      updateTimeBlock: (id, updates) =>
        set((s) => ({
          timeBlocks: s.timeBlocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),

      deleteTimeBlock: (id) =>
        set((s) => ({ timeBlocks: s.timeBlocks.filter((b) => b.id !== id) })),

      getBlocksForDate: (dateStr) =>
        get().timeBlocks.filter((b) => b.date === dateStr),

      generateUltradianSchedule: (dateStr) => {
        const date = dateStr || format(new Date(), 'yyyy-MM-dd')
        const blocks = [
          { title: 'Deep Work Block 1', startTime: '09:00', endTime: '10:30', color: '#6366f1' },
          { title: 'Recovery Break', startTime: '10:30', endTime: '10:45', color: '#10b981' },
          { title: 'Deep Work Block 2', startTime: '10:45', endTime: '12:15', color: '#6366f1' },
          { title: 'Lunch / Rest', startTime: '12:15', endTime: '13:15', color: '#f59e0b' },
          { title: 'Shallow Work / Admin', startTime: '13:15', endTime: '14:45', color: '#8b5cf6' },
          { title: 'Deep Work Block 3', startTime: '14:45', endTime: '16:15', color: '#6366f1' },
        ]
        const newBlocks = blocks.map((b) => ({
          id: uuid(),
          ...b,
          date,
          taskId: null,
        }))
        set((s) => ({
          timeBlocks: [...s.timeBlocks.filter((b) => b.date !== date), ...newBlocks],
        }))
      },

      // Stats
      getTodayPomodoros: () =>
        get().sessions.filter((s) => s.date === format(new Date(), 'yyyy-MM-dd')).length,

      getWeekStats: () => {
        const now = new Date()
        const start = startOfWeek(now, { weekStartsOn: 1 })
        const end = endOfWeek(now, { weekStartsOn: 1 })
        const days = eachDayOfInterval({ start, end })
        const sessions = get().sessions

        const dailyCounts = days.map((d) => {
          const dateStr = format(d, 'yyyy-MM-dd')
          return {
            date: dateStr,
            day: format(d, 'EEE'),
            count: sessions.filter((s) => s.date === dateStr).length,
            isToday: isToday(d),
          }
        })

        const weekTotal = dailyCounts.reduce((sum, d) => sum + d.count, 0)
        const activeDays = dailyCounts.filter((d) => d.count > 0).length
        const avgPerDay = activeDays ? Math.round((weekTotal / activeDays) * 10) / 10 : 0
        const bestDay = dailyCounts.reduce((best, d) => (d.count > best.count ? d : best), dailyCounts[0])

        return { dailyCounts, weekTotal, avgPerDay, bestDay }
      },
    }),
    {
      tables: {
        sessions: 'pomodoroSessions',
        timeBlocks: 'timeBlocks',
      },
      scalars: {
        focusDuration: 'pomo_focusDuration',
        shortBreakDuration: 'pomo_shortBreakDuration',
        longBreakDuration: 'pomo_longBreakDuration',
        longBreakAfter: 'pomo_longBreakAfter',
        pomodorosCompleted: 'pomo_pomodorosCompleted',
      },
    }
  )
)
