import { useState } from 'react'
import PomodoroTimer from '../components/pomodoro/PomodoroTimer'
import TimeBlockView from '../components/pomodoro/TimeBlockView'
import PomodoroStats from '../components/pomodoro/PomodoroStats'
import { Clock, Timer } from 'lucide-react'

const TABS = [
  { key: 'blocks', label: 'Time Blocks', icon: Clock },
  { key: 'stats', label: 'Stats', icon: Timer },
]

export default function PomodoroPage() {
  const [activeTab, setActiveTab] = useState('blocks')

  return (
    <div className="flex h-full min-h-0">
      {/* Left side - Timer */}
      <div className="w-2/5 flex-shrink-0 flex items-center justify-center border-r border-gray-200 dark:border-gray-700 p-8">
        <PomodoroTimer />
      </div>

      {/* Right side - Tabs content */}
      <div className="flex-1 flex flex-col min-h-0 p-6">
        {/* Tab bar */}
        <div className="flex items-center gap-1 mb-5 flex-shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {activeTab === 'blocks' && <TimeBlockView />}
          {activeTab === 'stats' && <PomodoroStats />}
        </div>
      </div>
    </div>
  )
}
