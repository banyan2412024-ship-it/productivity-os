import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { usePomodoroStore } from '../../stores/pomodoroStore'
import { useTaskStore } from '../../stores/taskStore'
import { Play, Pause, RotateCcw, Timer, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

const MODE_CONFIG = {
  focus: { label: 'Focus', color: 'indigo', stroke: '#6366f1', bg: 'bg-indigo-500', text: 'text-indigo-600', ring: 'ring-indigo-500' },
  shortBreak: { label: 'Short Break', color: 'emerald', stroke: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-500' },
  longBreak: { label: 'Long Break', color: 'blue', stroke: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-500' },
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)

    // Second beep
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.6)
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.6)
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.1)
    osc2.start(ctx.currentTime + 0.6)
    osc2.stop(ctx.currentTime + 1.1)

    setTimeout(() => ctx.close(), 2000)
  } catch (e) {
    // Web Audio not available
  }
}

export default function PomodoroTimer() {
  const status = usePomodoroStore((s) => s.status)
  const mode = usePomodoroStore((s) => s.mode)
  const timeLeft = usePomodoroStore((s) => s.timeLeft)
  const linkedTaskId = usePomodoroStore((s) => s.linkedTaskId)
  const focusDuration = usePomodoroStore((s) => s.focusDuration)
  const shortBreakDuration = usePomodoroStore((s) => s.shortBreakDuration)
  const longBreakDuration = usePomodoroStore((s) => s.longBreakDuration)
  const sessions = usePomodoroStore((s) => s.sessions)
  const startTimer = usePomodoroStore((s) => s.startTimer)
  const tick = usePomodoroStore((s) => s.tick)
  const pauseTimer = usePomodoroStore((s) => s.pauseTimer)
  const resetTimer = usePomodoroStore((s) => s.resetTimer)
  const setMode = usePomodoroStore((s) => s.setMode)
  const linkTask = usePomodoroStore((s) => s.linkTask)

  const tasks = useTaskStore((s) => s.tasks)
  const [showTaskDropdown, setShowTaskDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const intervalRef = useRef(null)

  const isRunning = status === 'running' || status === 'break' || status === 'longBreak'
  const config = MODE_CONFIG[mode]

  // Total duration for current mode in seconds
  const totalDuration =
    mode === 'focus'
      ? focusDuration * 60
      : mode === 'shortBreak'
        ? shortBreakDuration * 60
        : longBreakDuration * 60

  // SVG circle calculations
  const size = 200
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = totalDuration > 0 ? timeLeft / totalDuration : 0
  const dashOffset = circumference * (1 - progress)

  // Format time
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // Tick interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const completed = tick()
        if (completed) {
          playBeep()
        }
      }, 1000)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, tick])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowTaskDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleStartPause = useCallback(() => {
    if (isRunning) {
      pauseTimer()
    } else {
      startTimer()
    }
  }, [isRunning, pauseTimer, startTimer])

  const handleModeSwitch = useCallback(
    (newMode) => {
      if (isRunning) return
      setMode(newMode)
    },
    [isRunning, setMode]
  )

  const handleLinkTask = useCallback(
    (taskId) => {
      linkTask(taskId)
      setShowTaskDropdown(false)
    },
    [linkTask]
  )

  const linkedTask = linkedTaskId ? tasks.find((t) => t.id === linkedTaskId) : null
  const availableTasks = tasks.filter(
    (t) => t.status !== 'done' && t.status !== 'cancelled'
  )
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayCount = useMemo(() => sessions.filter((s) => s.date === todayStr).length, [sessions, todayStr])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Mode tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
        {Object.entries(MODE_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => handleModeSwitch(key)}
            disabled={isRunning}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === key
                ? `${cfg.bg} text-white shadow-sm`
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50'
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={config.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-mono font-bold text-gray-900 dark:text-white tabular-nums"
            style={{ letterSpacing: '0.05em' }}
          >
            {timeDisplay}
          </span>
          <span className={`text-xs font-medium mt-1 ${config.text}`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleStartPause}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-base shadow-lg transition-all hover:scale-105 active:scale-95 ${config.bg}`}
        >
          {isRunning ? (
            <>
              <Pause size={20} />
              Pause
            </>
          ) : (
            <>
              <Play size={20} />
              Start
            </>
          )}
        </button>
        <button
          onClick={resetTimer}
          className="flex items-center gap-1 px-3 py-3 rounded-xl text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Reset timer"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Pomodoros today */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Timer size={16} />
        <span>
          Pomodoros today: <strong className="text-gray-900 dark:text-white">{todayCount}</strong>
        </span>
      </div>

      {/* Linked task */}
      <div className="relative w-full max-w-xs" ref={dropdownRef}>
        <button
          onClick={() => setShowTaskDropdown(!showTaskDropdown)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <span className={linkedTask ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
            {linkedTask ? linkedTask.title : 'Link a task...'}
          </span>
          <ChevronDown size={16} className="text-gray-400" />
        </button>

        {showTaskDropdown && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {linkedTask && (
              <button
                onClick={() => handleLinkTask(null)}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
              >
                Unlink task
              </button>
            )}
            {availableTasks.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-400">No tasks available</div>
            )}
            {availableTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => handleLinkTask(task.id)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  task.id === linkedTaskId
                    ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {task.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
