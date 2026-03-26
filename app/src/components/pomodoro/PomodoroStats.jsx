import { useMemo } from 'react'
import { usePomodoroStore } from '../../stores/pomodoroStore'
import { Timer, TrendingUp, Award, Flame } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sublabel, iconColor }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg ${iconColor}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        {sublabel && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sublabel}</div>}
      </div>
    </div>
  )
}

export default function PomodoroStats() {
  const sessions = usePomodoroStore((s) => s.sessions)
  const focusDuration = usePomodoroStore((s) => s.focusDuration)
  const getWeekStats = usePomodoroStore((s) => s.getWeekStats)

  const stats = useMemo(() => getWeekStats(), [sessions])

  const { dailyCounts, weekTotal, avgPerDay, bestDay } = stats

  // Calculate longest streak of consecutive days with at least one pomodoro this week
  const longestStreak = useMemo(() => {
    let maxStreak = 0
    let current = 0
    for (const day of dailyCounts) {
      if (day.count > 0) {
        current++
        maxStreak = Math.max(maxStreak, current)
      } else {
        current = 0
      }
    }
    return maxStreak
  }, [dailyCounts])

  // Find the max count for scaling bars
  const maxCount = Math.max(...dailyCounts.map((d) => d.count), 1)

  return (
    <div className="flex flex-col gap-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Timer}
          label="Total this week"
          value={weekTotal}
          sublabel={`${weekTotal * focusDuration} min focused`}
          iconColor="bg-indigo-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Average per day"
          value={avgPerDay}
          sublabel="on active days"
          iconColor="bg-emerald-500"
        />
        <StatCard
          icon={Award}
          label="Best day"
          value={bestDay?.count || 0}
          sublabel={bestDay?.day || '-'}
          iconColor="bg-amber-500"
        />
        <StatCard
          icon={Flame}
          label="Focus streak"
          value={`${longestStreak}d`}
          sublabel="consecutive days"
          iconColor="bg-red-500"
        />
      </div>

      {/* Bar chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">This Week</h3>
        <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
          {dailyCounts.map((day) => {
            const barHeight = maxCount > 0 ? (day.count / maxCount) * 140 : 0
            return (
              <div key={day.date} className="flex flex-col items-center flex-1 gap-1">
                {/* Count label */}
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {day.count > 0 ? day.count : ''}
                </span>
                {/* Bar */}
                <div className="w-full flex justify-center" style={{ height: 140 }}>
                  <div className="flex items-end w-full max-w-[32px]">
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        day.isToday
                          ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30'
                          : 'bg-indigo-300 dark:bg-indigo-700'
                      }`}
                      style={{
                        height: `${Math.max(barHeight, day.count > 0 ? 8 : 0)}px`,
                      }}
                    />
                  </div>
                </div>
                {/* Day label */}
                <span
                  className={`text-xs font-medium ${
                    day.isToday
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {day.day}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Motivational note */}
      {weekTotal === 0 && (
        <div className="text-center py-6 text-gray-400 dark:text-gray-500">
          <Timer size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No pomodoros this week yet. Start your first focus session!</p>
        </div>
      )}
    </div>
  )
}
