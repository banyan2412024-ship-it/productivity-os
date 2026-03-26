import { useMemo } from 'react'
import { useHabitStore } from '../../stores/habitStore'
import { Flame } from 'lucide-react'
import { format, subDays } from 'date-fns'

export default function HabitStats() {
  const habits = useHabitStore((s) => s.habits)
  const getCompletionRate = useHabitStore((s) => s.getCompletionRate)
  const getWeekData = useHabitStore((s) => s.getWeekData)

  // Overall stats
  const overallStats = useMemo(() => {
    if (habits.length === 0) {
      return { totalHabits: 0, avgRate: 0, bestStreak: 0 }
    }

    const rates = habits.map((h) => getCompletionRate(h.id, 30))
    const avgRate = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
    const bestStreak = Math.max(...habits.map((h) => h.longestStreak), 0)

    return { totalHabits: habits.length, avgRate, bestStreak }
  }, [habits, getCompletionRate])

  // Weekly completion data for bar chart (across all habits)
  const weeklyBars = useMemo(() => {
    if (habits.length === 0) return []

    const today = new Date()
    const bars = []

    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i)
      const dateStr = format(d, 'yyyy-MM-dd')
      const dayLabel = format(d, 'EEE')

      let totalDue = 0
      let totalCompleted = 0

      for (const habit of habits) {
        const weekData = getWeekData(habit.id)
        const dayData = weekData.find((wd) => wd.date === dateStr)
        if (dayData && dayData.due) {
          totalDue++
          if (dayData.completed) totalCompleted++
        }
      }

      const pct = totalDue > 0 ? Math.round((totalCompleted / totalDue) * 100) : 0
      bars.push({ dayLabel, pct, completed: totalCompleted, due: totalDue })
    }

    return bars
  }, [habits, getWeekData])

  if (habits.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-400">No habits yet. Create some habits to see your stats.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Overall stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-800">{overallStats.totalHabits}</p>
          <p className="mt-1 text-xs text-gray-500">Total Habits</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-indigo-600">{overallStats.avgRate}%</p>
          <p className="mt-1 text-xs text-gray-500">Avg Completion</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1">
            <Flame size={20} className="text-orange-500" />
            <p className="text-2xl font-bold text-orange-500">{overallStats.bestStreak}</p>
          </div>
          <p className="mt-1 text-xs text-gray-500">Best Streak</p>
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Weekly Completion</h3>
        <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
          {weeklyBars.map((bar, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-medium text-gray-500">{bar.pct}%</span>
              <div className="relative w-full rounded-t-md bg-gray-200" style={{ height: 80 }}>
                <div
                  className="absolute bottom-0 left-0 w-full rounded-t-md bg-indigo-500 transition-all duration-300"
                  style={{ height: `${bar.pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">{bar.dayLabel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-habit stats */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Habit Details</h3>
        <div className="space-y-3">
          {habits.map((habit) => {
            const rate = getCompletionRate(habit.id, 30)
            const totalCompletions = habit.completions.length

            return (
              <div
                key={habit.id}
                className="rounded-lg border border-gray-50 bg-gray-50/50 p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: habit.color || '#6366f1' }}
                  />
                  <span className="text-sm font-medium text-gray-800">{habit.name}</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <p className="text-lg font-bold text-gray-700">{habit.currentStreak}</p>
                    <p className="text-xs text-gray-400">Current Streak</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-700">{habit.longestStreak}</p>
                    <p className="text-xs text-gray-400">Longest Streak</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-indigo-600">{rate}%</p>
                    <p className="text-xs text-gray-400">30-Day Rate</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-700">{totalCompletions}</p>
                    <p className="text-xs text-gray-400">Total Done</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
