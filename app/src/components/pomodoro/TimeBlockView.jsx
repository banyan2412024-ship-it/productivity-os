import { useState, useEffect, useMemo } from 'react'
import { usePomodoroStore } from '../../stores/pomodoroStore'
import { format, addDays, subDays } from 'date-fns'
import { Plus, X, Trash2, ChevronLeft, ChevronRight, Sparkles, Clock } from 'lucide-react'

const HOUR_START = 6
const HOUR_END = 22 // 10 PM
const SLOT_HEIGHT = 48 // px per 30-minute slot
const TOTAL_SLOTS = (HOUR_END - HOUR_START) * 2 // 32 slots

const COLOR_OPTIONS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#14b8a6', label: 'Teal' },
]

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function slotIndexToTime(index) {
  const totalMinutes = (HOUR_START * 60) + (index * 30)
  return minutesToTime(totalMinutes)
}

function timeToPosition(timeStr) {
  const mins = timeToMinutes(timeStr)
  const startMins = HOUR_START * 60
  return ((mins - startMins) / 30) * SLOT_HEIGHT
}

function generateTimeSlots() {
  const slots = []
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const totalMinutes = HOUR_START * 60 + i * 30
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
    const label = m === 0 ? `${displayH}:00 ${ampm}` : ''
    slots.push({
      index: i,
      time: minutesToTime(totalMinutes),
      label,
      isHour: m === 0,
    })
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

function InlineBlockForm({ initial, onSave, onCancel, onDelete }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [startTime, setStartTime] = useState(initial?.startTime || '09:00')
  const [endTime, setEndTime] = useState(initial?.endTime || '09:30')
  const [color, setColor] = useState(initial?.color || '#6366f1')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ title: title.trim(), startTime, endTime, color })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {initial?.id ? 'Edit Block' : 'New Block'}
        </span>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X size={16} />
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Block title..."
        autoFocus
        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Color</label>
        <div className="flex gap-1.5">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`w-6 h-6 rounded-full transition-all ${
                color === c.value ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800' : ''
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div>
          {initial?.id && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(initial.id)}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs text-white bg-indigo-500 hover:bg-indigo-600 rounded-md font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  )
}

export default function TimeBlockView() {
  const timeBlocks = usePomodoroStore((s) => s.timeBlocks)
  const addTimeBlock = usePomodoroStore((s) => s.addTimeBlock)
  const updateTimeBlock = usePomodoroStore((s) => s.updateTimeBlock)
  const deleteTimeBlock = usePomodoroStore((s) => s.deleteTimeBlock)
  const generateUltradianSchedule = usePomodoroStore((s) => s.generateUltradianSchedule)

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [formState, setFormState] = useState(null) // null | { type: 'add', slotIndex } | { type: 'edit', block }
  const [currentTime, setCurrentTime] = useState(new Date())

  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const displayDate = format(selectedDate, 'EEEE, MMM d')

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const blocksForDay = useMemo(() => {
    return timeBlocks.filter((b) => b.date === dateStr)
  }, [timeBlocks, dateStr])

  // Current time indicator position
  const now = currentTime
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const startMins = HOUR_START * 60
  const endMins = HOUR_END * 60
  const showTimeLine = format(now, 'yyyy-MM-dd') === dateStr && nowMins >= startMins && nowMins <= endMins
  const timeLineTop = showTimeLine ? ((nowMins - startMins) / 30) * SLOT_HEIGHT : 0

  const handleSlotClick = (slotIndex) => {
    if (formState) return
    const startTime = slotIndexToTime(slotIndex)
    const endTime = slotIndexToTime(slotIndex + 1)
    setFormState({ type: 'add', slotIndex, startTime, endTime })
  }

  const handleBlockClick = (block, e) => {
    e.stopPropagation()
    setFormState({ type: 'edit', block })
  }

  const handleSave = (data) => {
    if (formState.type === 'add') {
      addTimeBlock({ ...data, date: dateStr })
    } else if (formState.type === 'edit') {
      updateTimeBlock(formState.block.id, data)
    }
    setFormState(null)
  }

  const handleDelete = (id) => {
    deleteTimeBlock(id)
    setFormState(null)
  }

  const handleGenerateSchedule = () => {
    generateUltradianSchedule(dateStr)
    setFormState(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate((d) => subDays(d, 1))}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{displayDate}</span>
          </div>
          <button
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          onClick={handleGenerateSchedule}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg transition-colors"
        >
          <Sparkles size={14} />
          Ultradian Schedule
        </button>
      </div>

      {/* Day view grid */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="relative" style={{ minHeight: TOTAL_SLOTS * SLOT_HEIGHT }}>
          {/* Time slots */}
          {TIME_SLOTS.map((slot) => (
            <div
              key={slot.index}
              className={`flex border-b border-gray-100 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                slot.isHour ? 'border-gray-200 dark:border-gray-700' : ''
              }`}
              style={{ height: SLOT_HEIGHT }}
              onClick={() => handleSlotClick(slot.index)}
            >
              {/* Time label */}
              <div className="w-20 flex-shrink-0 px-2 py-1 text-right border-r border-gray-200 dark:border-gray-700">
                {slot.label && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                    {slot.label}
                  </span>
                )}
              </div>
              {/* Slot area */}
              <div className="flex-1 relative" />
            </div>
          ))}

          {/* Time blocks (positioned absolutely) */}
          {blocksForDay.map((block) => {
            const top = timeToPosition(block.startTime)
            const bottom = timeToPosition(block.endTime)
            const height = Math.max(bottom - top, 24)

            return (
              <div
                key={block.id}
                className="absolute left-20 right-2 rounded-md px-3 py-1.5 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden shadow-sm"
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  backgroundColor: block.color + 'dd',
                  borderLeft: `3px solid ${block.color}`,
                }}
                onClick={(e) => handleBlockClick(block, e)}
              >
                <div className="text-xs font-semibold text-white truncate">{block.title}</div>
                {height > 32 && (
                  <div className="text-xs text-white/80 mt-0.5">
                    {block.startTime} - {block.endTime}
                  </div>
                )}
              </div>
            )
          })}

          {/* Current time indicator */}
          {showTimeLine && (
            <div
              className="absolute left-16 right-0 flex items-center pointer-events-none z-10"
              style={{ top: `${timeLineTop}px` }}
            >
              <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
              <div className="flex-1 h-0.5 bg-red-500" />
            </div>
          )}
        </div>
      </div>

      {/* Inline form overlay */}
      {formState && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/20" onClick={() => setFormState(null)}>
          <div className="w-80" onClick={(e) => e.stopPropagation()}>
            <InlineBlockForm
              initial={
                formState.type === 'edit'
                  ? formState.block
                  : { startTime: formState.startTime, endTime: formState.endTime }
              }
              onSave={handleSave}
              onCancel={() => setFormState(null)}
              onDelete={formState.type === 'edit' ? handleDelete : undefined}
            />
          </div>
        </div>
      )}
    </div>
  )
}
