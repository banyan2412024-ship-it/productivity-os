import { useMemo } from 'react'
import { useHabitStore } from '../../stores/habitStore'
import { Sun, CloudSun, Moon, Clock } from 'lucide-react'
import { format } from 'date-fns'
import HabitCheckItem from './HabitCheckItem'

const SECTIONS = [
  { key: 'morning', label: 'Morning', Icon: Sun, iconColor: 'text-amber-500' },
  { key: 'afternoon', label: 'Afternoon', Icon: CloudSun, iconColor: 'text-orange-400' },
  { key: 'evening', label: 'Evening', Icon: Moon, iconColor: 'text-indigo-400' },
  { key: 'anytime', label: 'Anytime', Icon: Clock, iconColor: 'text-gray-400' },
]

const DAY_MAP = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' }
function isDueToday(h) {
  const day = new Date().getDay()
  switch (h.frequency) {
    case 'daily': return true
    case 'weekdays': return day >= 1 && day <= 5
    case 'weekends': return day === 0 || day === 6
    case 'custom': return (h.customDays || []).includes(DAY_MAP[day])
    default: return true
  }
}

export default function HabitTodayView() {
  const habits = useHabitStore((s) => s.habits)
  const isCompletedOnDate = useHabitStore((s) => s.isCompletedOnDate)

  const todayHabits = useMemo(() => habits.filter(isDueToday), [habits])
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const grouped = useMemo(() => ({
    morning: todayHabits.filter((h) => h.timeOfDay === 'morning'),
    afternoon: todayHabits.filter((h) => h.timeOfDay === 'afternoon'),
    evening: todayHabits.filter((h) => h.timeOfDay === 'evening'),
    anytime: todayHabits.filter((h) => h.timeOfDay === 'anytime'),
  }), [todayHabits])

  const completedCount = todayHabits.filter((h) =>
    isCompletedOnDate(h.id, todayStr)
  ).length
  const totalCount = todayHabits.length
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Organize stacked habits: collect children keyed by parent id
  const organizeHabits = (habits) => {
    const parentIds = new Set(habits.filter((h) => h.stackedAfter).map((h) => h.stackedAfter))
    const childrenMap = {}
    const roots = []

    for (const habit of habits) {
      if (habit.stackedAfter && habits.find((h) => h.id === habit.stackedAfter)) {
        if (!childrenMap[habit.stackedAfter]) childrenMap[habit.stackedAfter] = []
        childrenMap[habit.stackedAfter].push(habit)
      } else {
        roots.push(habit)
      }
    }

    const result = []
    for (const root of roots) {
      result.push({ habit: root, isStacked: false })
      if (childrenMap[root.id]) {
        for (const child of childrenMap[root.id]) {
          result.push({ habit: child, isStacked: true })
        }
      }
    }
    return result
  }

  return (
    <div className="space-y-4">
      {SECTIONS.map(({ key, label, Icon, iconColor }) => {
        const habits = grouped[key]
        if (!habits || habits.length === 0) return null

        const organized = organizeHabits(habits)

        return (
          <div
            key={key}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            {/* Section header */}
            <div className="mb-3 flex items-center gap-2">
              <Icon size={18} className={iconColor} />
              <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
              <span className="text-xs text-gray-400">
                {habits.filter((h) => isCompletedOnDate(h.id, todayStr)).length}/{habits.length}
              </span>
            </div>

            {/* Habit items */}
            <div className="space-y-0.5">
              {organized.map(({ habit, isStacked }) => (
                <HabitCheckItem
                  key={habit.id}
                  habit={habit}
                  isStacked={isStacked}
                />
              ))}
            </div>
          </div>
        )
      })}

      {totalCount === 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-400">No habits due today. Add one to get started!</p>
        </div>
      )}

      {/* Summary bar */}
      {totalCount > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {completedCount} of {totalCount} habits done today
            </span>
            <span className="text-sm font-semibold text-indigo-600">{percentage}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
