import { create } from 'zustand'
import { dexiePersist } from './dexiePersist'
import { v4 as uuid } from 'uuid'
import {
  format,
  subDays,
  startOfDay,
  eachDayOfInterval,
} from 'date-fns'

const DAY_MAP = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
}

function isDueOnDate(habit, date) {
  const day = date.getDay()
  switch (habit.frequency) {
    case 'daily':
      return true
    case 'weekdays':
      return day >= 1 && day <= 5
    case 'weekends':
      return day === 0 || day === 6
    case 'custom':
      return (habit.customDays || []).includes(DAY_MAP[day])
    default:
      return true
  }
}

function calculateStreak(completions, habit) {
  if (!completions.length) return 0
  const sorted = [...completions]
    .map((c) => startOfDay(new Date(c.date)).getTime())
    .sort((a, b) => b - a)

  let streak = 0
  const checkDate = startOfDay(new Date())
  const todayCompleted = sorted.includes(checkDate.getTime())
  if (!todayCompleted) {
    if (isDueOnDate(habit, checkDate)) return 0
  }

  for (let i = 0; i < 365; i++) {
    const d = subDays(startOfDay(new Date()), i)
    if (!isDueOnDate(habit, d)) continue
    if (sorted.includes(startOfDay(d).getTime())) {
      streak++
    } else {
      if (i === 0 && !todayCompleted) continue
      break
    }
  }
  return streak
}

export const useHabitStore = create(
  dexiePersist(
    (set, get) => ({
      habits: [],

      addHabit: (habit) => {
        const newHabit = {
          id: uuid(),
          name: habit.name || '',
          description: habit.description || '',
          frequency: habit.frequency || 'daily',
          customDays: habit.customDays || [],
          timeOfDay: habit.timeOfDay || 'anytime',
          stackedAfter: habit.stackedAfter || null,
          intentionTime: habit.intentionTime || null,
          intentionLocation: habit.intentionLocation || null,
          color: habit.color || '#6366f1',
          icon: habit.icon || 'circle',
          completions: [],
          currentStreak: 0,
          longestStreak: 0,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ habits: [...s.habits, newHabit] }))
        return newHabit.id
      },

      updateHabit: (id, updates) =>
        set((s) => ({
          habits: s.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
        })),

      deleteHabit: (id) =>
        set((s) => ({
          habits: s.habits
            .filter((h) => h.id !== id)
            .map((h) => (h.stackedAfter === id ? { ...h, stackedAfter: null } : h)),
        })),

      toggleCompletion: (id, dateStr) => {
        const date = dateStr || format(new Date(), 'yyyy-MM-dd')
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h
            const existing = h.completions.find((c) => c.date === date)
            let completions
            if (existing) {
              completions = h.completions.filter((c) => c.date !== date)
            } else {
              completions = [...h.completions, { date, completedAt: new Date().toISOString() }]
            }
            const currentStreak = calculateStreak(completions, h)
            const longestStreak = Math.max(h.longestStreak, currentStreak)
            return { ...h, completions, currentStreak, longestStreak }
          }),
        }))
      },

      isCompletedOnDate: (id, dateStr) => {
        const habit = get().habits.find((h) => h.id === id)
        if (!habit) return false
        const date = dateStr || format(new Date(), 'yyyy-MM-dd')
        return habit.completions.some((c) => c.date === date)
      },

      getTodayHabits: () => {
        const today = new Date()
        return get().habits.filter((h) => isDueOnDate(h, today))
      },

      getHabitsByTimeOfDay: () => {
        const today = new Date()
        const due = get().habits.filter((h) => isDueOnDate(h, today))
        return {
          morning: due.filter((h) => h.timeOfDay === 'morning'),
          afternoon: due.filter((h) => h.timeOfDay === 'afternoon'),
          evening: due.filter((h) => h.timeOfDay === 'evening'),
          anytime: due.filter((h) => h.timeOfDay === 'anytime'),
        }
      },

      getCompletionRate: (id, days = 30) => {
        const habit = get().habits.find((h) => h.id === id)
        if (!habit) return 0
        const end = new Date()
        const start = subDays(end, days - 1)
        const interval = eachDayOfInterval({ start, end })
        const dueDays = interval.filter((d) => isDueOnDate(habit, d))
        if (dueDays.length === 0) return 0
        const completed = dueDays.filter((d) =>
          habit.completions.some((c) => c.date === format(d, 'yyyy-MM-dd'))
        )
        return Math.round((completed.length / dueDays.length) * 100)
      },

      getWeekData: (id) => {
        const habit = get().habits.find((h) => h.id === id)
        if (!habit) return []
        const today = new Date()
        const days = []
        for (let i = 6; i >= 0; i--) {
          const d = subDays(today, i)
          const dateStr = format(d, 'yyyy-MM-dd')
          days.push({
            date: dateStr,
            day: format(d, 'EEE'),
            due: isDueOnDate(habit, d),
            completed: habit.completions.some((c) => c.date === dateStr),
          })
        }
        return days
      },
    }),
    {
      tables: { habits: 'habits' },
    }
  )
)
