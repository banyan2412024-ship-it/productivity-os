import { useState, useEffect } from 'react'
import { useHabitStore } from '../../stores/habitStore'
import { X } from 'lucide-react'

const PRESET_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
]

const DAYS_OF_WEEK = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
]

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'custom', label: 'Custom' },
]

const TIME_OF_DAY_OPTIONS = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'anytime', label: 'Anytime' },
]

export default function HabitForm({ habitId = null, onClose }) {
  const habits = useHabitStore((s) => s.habits)
  const addHabit = useHabitStore((s) => s.addHabit)
  const updateHabit = useHabitStore((s) => s.updateHabit)

  const existingHabit = habitId ? habits.find((h) => h.id === habitId) : null

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState('daily')
  const [customDays, setCustomDays] = useState([])
  const [timeOfDay, setTimeOfDay] = useState('anytime')
  const [stackedAfter, setStackedAfter] = useState('')
  const [intentionTime, setIntentionTime] = useState('')
  const [intentionLocation, setIntentionLocation] = useState('')
  const [color, setColor] = useState('#6366f1')

  // Populate form when editing
  useEffect(() => {
    if (existingHabit) {
      setName(existingHabit.name)
      setDescription(existingHabit.description || '')
      setFrequency(existingHabit.frequency)
      setCustomDays(existingHabit.customDays || [])
      setTimeOfDay(existingHabit.timeOfDay)
      setStackedAfter(existingHabit.stackedAfter || '')
      setIntentionTime(existingHabit.intentionTime || '')
      setIntentionLocation(existingHabit.intentionLocation || '')
      setColor(existingHabit.color || '#6366f1')
    }
  }, [existingHabit])

  const handleCustomDayToggle = (dayKey) => {
    setCustomDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
    )
  }

  const handleSave = () => {
    if (!name.trim()) return

    const habitData = {
      name: name.trim(),
      description: description.trim(),
      frequency,
      customDays: frequency === 'custom' ? customDays : [],
      timeOfDay,
      stackedAfter: stackedAfter || null,
      intentionTime: intentionTime || null,
      intentionLocation: intentionLocation.trim() || null,
      color,
    }

    if (existingHabit) {
      updateHabit(existingHabit.id, habitData)
    } else {
      addHabit(habitData)
    }

    onClose()
  }

  // Habits available to stack after (exclude self)
  const stackableHabits = habits.filter((h) => h.id !== habitId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {existingHabit ? 'Edit Habit' : 'New Habit'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form body */}
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning meditation"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Frequency</label>
            <div className="flex flex-wrap gap-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFrequency(opt.value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    frequency === opt.value
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom day checkboxes */}
            {frequency === 'custom' && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => handleCustomDayToggle(day.key)}
                    className={`h-9 w-11 rounded-lg border text-xs font-medium transition-colors ${
                      customDays.includes(day.key)
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Time of day */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Time of Day</label>
            <div className="flex flex-wrap gap-2">
              {TIME_OF_DAY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTimeOfDay(opt.value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    timeOfDay === opt.value
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Habit stacking */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Stack After (optional)
            </label>
            <select
              value={stackedAfter}
              onChange={(e) => setStackedAfter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="">None</option>
              {stackableHabits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Implementation intention */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Implementation Intention
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="time"
                  value={intentionTime}
                  onChange={(e) => setIntentionTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <p className="mt-0.5 text-xs text-gray-400">Time</p>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={intentionLocation}
                  onChange={(e) => setIntentionLocation(e.target.value)}
                  placeholder="e.g. kitchen"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <p className="mt-0.5 text-xs text-gray-400">Location</p>
              </div>
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Color</label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c.value ? 'border-gray-800 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {existingHabit ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </div>
    </div>
  )
}
