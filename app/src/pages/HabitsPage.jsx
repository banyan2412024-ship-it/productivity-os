import { useState } from 'react'
import { Plus, Trash2, Edit } from 'lucide-react'
import { useHabitStore } from '../stores/habitStore'
import HabitTodayView from '../components/habits/HabitTodayView'
import HabitWeeklyGrid from '../components/habits/HabitWeeklyGrid'
import HabitStats from '../components/habits/HabitStats'
import HabitForm from '../components/habits/HabitForm'

const TABS = [
  { key: 'today', label: 'Today' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'stats', label: 'Stats' },
]

export default function HabitsPage() {
  const [activeTab, setActiveTab] = useState('today')
  const [showForm, setShowForm] = useState(false)
  const [editingHabitId, setEditingHabitId] = useState(null)
  const habits = useHabitStore((s) => s.habits)
  const deleteHabit = useHabitStore((s) => s.deleteHabit)

  const handleAddHabit = () => {
    setEditingHabitId(null)
    setShowForm(true)
  }

  const handleEditHabit = (id) => {
    setEditingHabitId(id)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingHabitId(null)
  }

  const handleDeleteHabit = (id) => {
    deleteHabit(id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Habits</h1>
          <button
            onClick={handleAddHabit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
          >
            <Plus size={16} />
            Add Habit
          </button>
        </div>

        {/* Tab navigation */}
        <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick habit list with edit/delete (shown on Today and Weekly tabs) */}
        {(activeTab === 'today' || activeTab === 'weekly') && habits.length > 0 && (
          <div className="mb-4 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-100 bg-gray-50 py-1 pl-2.5 pr-1 text-xs font-medium text-gray-600"
                >
                  <div
                    className="mr-1 h-2 w-2 rounded-full"
                    style={{ backgroundColor: habit.color || '#6366f1' }}
                  />
                  {habit.name}
                  <button
                    onClick={() => handleEditHabit(habit.id)}
                    className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                    title="Edit habit"
                  >
                    <Edit size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="rounded p-0.5 text-gray-400 hover:bg-red-100 hover:text-red-500"
                    title="Delete habit"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content area */}
        {activeTab === 'today' && <HabitTodayView />}
        {activeTab === 'weekly' && <HabitWeeklyGrid />}
        {activeTab === 'stats' && <HabitStats />}
      </div>

      {/* Modal */}
      {showForm && (
        <HabitForm habitId={editingHabitId} onClose={handleCloseForm} />
      )}
    </div>
  )
}
