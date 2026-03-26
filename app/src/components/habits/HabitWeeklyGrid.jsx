import { useMemo } from 'react'
import { useHabitStore } from '../../stores/habitStore'
import { Flame } from 'lucide-react'

export default function HabitWeeklyGrid() {
  const habits = useHabitStore((s) => s.habits)
  const getWeekData = useHabitStore((s) => s.getWeekData)

  if (habits.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-400">No habits yet. Create one to see your weekly grid.</p>
      </div>
    )
  }

  // Get week data from the first habit to extract day labels
  const sampleWeek = getWeekData(habits[0].id)
  const dayLabels = sampleWeek.map((d) => d.day)

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="pb-3 pr-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Habit
            </th>
            {dayLabels.map((day, i) => (
              <th
                key={i}
                className="pb-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10"
              >
                {day}
              </th>
            ))}
            <th className="pb-3 pl-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Streak
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {habits.map((habit) => {
            const weekData = getWeekData(habit.id)

            return (
              <tr key={habit.id} className="group">
                {/* Habit name */}
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: habit.color || '#6366f1' }}
                    />
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[160px]">
                      {habit.name}
                    </span>
                  </div>
                </td>

                {/* Day cells */}
                {weekData.map((day, i) => (
                  <td key={i} className="py-2.5 text-center">
                    {day.due ? (
                      day.completed ? (
                        /* Completed: filled circle */
                        <div className="flex justify-center">
                          <div
                            className="h-5 w-5 rounded-full"
                            style={{ backgroundColor: habit.color || '#6366f1' }}
                          />
                        </div>
                      ) : (
                        /* Due but not done: empty circle */
                        <div className="flex justify-center">
                          <div
                            className="h-5 w-5 rounded-full border-2"
                            style={{ borderColor: habit.color || '#6366f1' }}
                          />
                        </div>
                      )
                    ) : (
                      /* Not due: dash */
                      <span className="text-gray-300">&mdash;</span>
                    )}
                  </td>
                ))}

                {/* Streak */}
                <td className="py-2.5 pl-4 text-center">
                  {habit.currentStreak > 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-orange-500">
                      <Flame size={12} />
                      {habit.currentStreak}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">0</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
