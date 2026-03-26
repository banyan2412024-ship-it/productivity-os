import { useHabitStore } from '../../stores/habitStore'
import { Flame } from 'lucide-react'
import { format } from 'date-fns'

export default function HabitCheckItem({ habit, isStacked = false }) {
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion)
  const isCompletedOnDate = useHabitStore((s) => s.isCompletedOnDate)
  const habits = useHabitStore((s) => s.habits)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const completed = isCompletedOnDate(habit.id, todayStr)

  const parentHabit = habit.stackedAfter
    ? habits.find((h) => h.id === habit.stackedAfter)
    : null

  const intentionText = [
    habit.intentionTime ? `at ${habit.intentionTime}` : null,
    habit.intentionLocation ? `in ${habit.intentionLocation}` : null,
  ]
    .filter(Boolean)
    .join(' ')

  const handleToggle = () => {
    toggleCompletion(habit.id, todayStr)
  }

  return (
    <div className={`relative ${isStacked ? 'ml-8' : ''}`}>
      {/* Vertical connecting line for stacked habits */}
      {isStacked && (
        <div
          className="absolute -left-4 top-0 h-full w-px bg-gray-300"
          aria-hidden="true"
        >
          <div className="absolute left-0 top-5 h-px w-4 bg-gray-300" />
        </div>
      )}

      <div className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50">
        {/* Circle checkbox */}
        <button
          onClick={handleToggle}
          className="mt-0.5 flex-shrink-0 focus:outline-none"
          aria-label={completed ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`}
        >
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200 ${
              completed ? 'animate-check scale-110' : 'hover:scale-105'
            }`}
            style={{
              borderColor: habit.color || '#6366f1',
              backgroundColor: completed ? habit.color || '#6366f1' : 'transparent',
            }}
          >
            {completed && (
              <svg
                className="h-3.5 w-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </button>

        {/* Habit info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium transition-all ${
                completed ? 'text-gray-400 line-through' : 'text-gray-800'
              }`}
            >
              {habit.name}
            </span>

            {/* Streak badge */}
            {habit.currentStreak >= 3 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-50 px-1.5 py-0.5 text-xs font-semibold text-orange-500">
                <Flame size={12} />
                {habit.currentStreak}
              </span>
            )}
          </div>

          {habit.description && (
            <p className={`mt-0.5 text-xs ${completed ? 'text-gray-300' : 'text-gray-500'}`}>
              {habit.description}
            </p>
          )}

          {intentionText && (
            <p className="mt-0.5 text-xs italic text-gray-400">
              {intentionText}
            </p>
          )}

          {isStacked && parentHabit && (
            <p className="mt-0.5 text-xs text-gray-400">
              After: {parentHabit.name}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
