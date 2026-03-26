import { create } from 'zustand'
import { dexiePersist } from './dexiePersist'
import { v4 as uuid } from 'uuid'
import { format, subDays, eachDayOfInterval } from 'date-fns'

export const WEED_AMOUNTS = [0.1, 0.25, 0.5, 1, 2]

export const useWeedStore = create(
  dexiePersist(
    (set, get) => ({
      smokingLogs: [], // kept as smokingLogs for DB compat

      logWeed: (grams, dateStr) => {
        const date = dateStr || format(new Date(), 'yyyy-MM-dd')
        const log = {
          id: uuid(),
          date,
          time: format(new Date(), 'HH:mm'),
          grams: grams || 0,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ smokingLogs: [...s.smokingLogs, log] }))
        return log.id
      },

      deleteLog: (id) =>
        set((s) => ({
          smokingLogs: s.smokingLogs.filter((l) => l.id !== id),
        })),

      getTodayGrams: () => {
        const today = format(new Date(), 'yyyy-MM-dd')
        return get()
          .smokingLogs.filter((l) => l.date === today)
          .reduce((sum, l) => sum + (l.grams || 0), 0)
      },

      getGramsForDate: (dateStr) =>
        get()
          .smokingLogs.filter((l) => l.date === dateStr)
          .reduce((sum, l) => sum + (l.grams || 0), 0),

      getLogsForDate: (dateStr) =>
        get()
          .smokingLogs.filter((l) => l.date === dateStr)
          .sort((a, b) => a.time.localeCompare(b.time)),

      getWeekData: () => {
        const today = new Date()
        const logs = get().smokingLogs
        const days = []
        for (let i = 6; i >= 0; i--) {
          const d = subDays(today, i)
          const dateStr = format(d, 'yyyy-MM-dd')
          const dayLogs = logs.filter((l) => l.date === dateStr)
          days.push({
            date: dateStr,
            day: format(d, 'EEE'),
            grams: dayLogs.reduce((s, l) => s + (l.grams || 0), 0),
            entries: dayLogs.length,
            isToday: i === 0,
          })
        }
        return days
      },

      getMonthData: (year, month) => {
        const start = new Date(year, month, 1)
        const end = new Date(year, month + 1, 0)
        const logs = get().smokingLogs
        return eachDayOfInterval({ start, end }).map((d) => {
          const dateStr = format(d, 'yyyy-MM-dd')
          const dayLogs = logs.filter((l) => l.date === dateStr)
          return {
            date: dateStr,
            dayNum: d.getDate(),
            dayOfWeek: d.getDay(),
            grams: dayLogs.reduce((s, l) => s + (l.grams || 0), 0),
          }
        })
      },

      getAveragePerDay: (days = 30) => {
        const today = new Date()
        const start = subDays(today, days - 1)
        const logs = get().smokingLogs
        const interval = eachDayOfInterval({ start, end: today })
        const total = interval.reduce((sum, d) => {
          const dateStr = format(d, 'yyyy-MM-dd')
          return sum + logs.filter((l) => l.date === dateStr).reduce((s, l) => s + (l.grams || 0), 0)
        }, 0)
        return Math.round((total / days) * 100) / 100
      },
    }),
    {
      tables: { smokingLogs: 'smokingLogs' },
    }
  )
)
