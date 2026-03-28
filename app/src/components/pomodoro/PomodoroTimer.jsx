import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { usePomodoroStore } from '../../stores/pomodoroStore'
import { useTaskStore } from '../../stores/taskStore'
import { Play, Pause, RotateCcw, Timer, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

const MODE_CONFIG = {
  focus:      { label: 'FOCUS',       color: 'var(--neon)',    dim: '#003300' },
  shortBreak: { label: 'SHORT_BREAK', color: 'var(--cyan)',    dim: '#002222' },
  longBreak:  { label: 'LONG_BREAK',  color: 'var(--blue)',    dim: '#001133' },
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
  } catch (e) {}
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

  const totalDuration =
    mode === 'focus'
      ? focusDuration * 60
      : mode === 'shortBreak'
        ? shortBreakDuration * 60
        : longBreakDuration * 60

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // Block progress bar — 20 blocks
  const BLOCKS = 20
  const filledBlocks = totalDuration > 0 ? Math.round(((totalDuration - timeLeft) / totalDuration) * BLOCKS) : 0

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const completed = tick()
        if (completed) playBeep()
      }, 1000)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, tick])

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
    if (isRunning) pauseTimer()
    else startTimer()
  }, [isRunning, pauseTimer, startTimer])

  const handleModeSwitch = useCallback(
    (newMode) => { if (!isRunning) setMode(newMode) },
    [isRunning, setMode]
  )

  const handleLinkTask = useCallback(
    (taskId) => { linkTask(taskId); setShowTaskDropdown(false) },
    [linkTask]
  )

  const linkedTask = linkedTaskId ? tasks.find((t) => t.id === linkedTaskId) : null
  const availableTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled')
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayCount = useMemo(() => sessions.filter((s) => s.date === todayStr).length, [sessions, todayStr])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', fontFamily: 'var(--font-mono)' }}>

      {/* Mode tabs */}
      <div style={{
        display: 'flex', gap: '2px', width: '100%',
        borderTop: '2px solid #1a6b1a', borderLeft: '2px solid #1a6b1a',
        borderRight: '2px solid #003300', borderBottom: '2px solid #003300',
        background: 'var(--bg-base)', padding: '3px',
      }}>
        {Object.entries(MODE_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => handleModeSwitch(key)}
            disabled={isRunning}
            style={{
              flex: 1, padding: '6px 4px',
              background: mode === key ? cfg.dim : 'transparent',
              border: mode === key ? `1px solid ${cfg.color}` : '1px solid transparent',
              color: mode === key ? cfg.color : 'var(--text-ghost)',
              fontSize: '9px', letterSpacing: '1px',
              fontFamily: 'var(--font-mono)',
              cursor: isRunning ? 'default' : 'pointer',
              opacity: isRunning && mode !== key ? 0.4 : 1,
              minWidth: 'unset',
              textShadow: mode === key ? `0 0 6px ${cfg.color}` : 'none',
            }}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div style={{
        width: '100%', textAlign: 'center',
        background: 'var(--bg-base)',
        borderTop: '2px solid #1a6b1a', borderLeft: '2px solid #1a6b1a',
        borderRight: '2px solid #003300', borderBottom: '2px solid #003300',
        padding: '20px 16px',
      }}>
        <div style={{ fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '2px', marginBottom: '8px' }}>
          // {config.label}
        </div>
        <div style={{
          fontSize: '52px', fontWeight: 'bold',
          color: config.color,
          textShadow: `0 0 20px ${config.color}`,
          letterSpacing: '4px',
          lineHeight: 1,
        }}>
          {timeDisplay}
        </div>

        {/* Block progress bar */}
        <div style={{
          display: 'flex', gap: '2px', marginTop: '14px',
          borderTop: '2px solid #003300', borderLeft: '2px solid #003300',
          borderRight: '2px solid #1a6b1a', borderBottom: '2px solid #1a6b1a',
          background: '#000', padding: '3px', height: '16px', alignItems: 'center',
        }}>
          {Array.from({ length: BLOCKS }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: '100%',
                background: i < filledBlocks ? config.color : config.dim,
              }}
            />
          ))}
        </div>

        <div style={{ fontSize: '9px', color: 'var(--text-ghost)', marginTop: '6px' }}>
          {filledBlocks}/{BLOCKS} blocks elapsed
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handleStartPause}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 24px',
            background: isRunning ? 'rgba(255,136,68,0.1)' : `${config.dim}`,
            borderTop: '2px solid #1a6b1a', borderLeft: '2px solid #1a6b1a',
            borderRight: '2px solid #003300', borderBottom: '2px solid #003300',
            color: isRunning ? 'var(--orange)' : config.color,
            fontSize: '12px', fontFamily: 'var(--font-mono)',
            fontWeight: 'bold', cursor: 'pointer', minWidth: 'unset',
            letterSpacing: '1px',
          }}
        >
          {isRunning ? <><Pause size={14} /> PAUSE</> : <><Play size={14} /> START</>}
        </button>
        <button
          onClick={resetTimer}
          title="Reset"
          style={{
            display: 'flex', alignItems: 'center',
            padding: '8px 12px',
            background: 'var(--bg-base)',
            borderTop: '2px solid #1a6b1a', borderLeft: '2px solid #1a6b1a',
            borderRight: '2px solid #003300', borderBottom: '2px solid #003300',
            color: 'var(--text-ghost)',
            cursor: 'pointer', minWidth: 'unset',
          }}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Sessions today */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-dim)' }}>
        <Timer size={12} style={{ color: 'var(--neon)' }} />
        <span>SESSIONS TODAY:</span>
        <strong style={{ color: 'var(--neon)' }}>{todayCount}</strong>
        {todayCount > 0 && (
          <span style={{ color: 'var(--text-ghost)' }}>
            {'🍅'.repeat(Math.min(todayCount, 8))}
          </span>
        )}
      </div>

      {/* Linked task */}
      <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
        <button
          onClick={() => setShowTaskDropdown(!showTaskDropdown)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 10px',
            background: 'var(--bg-base)',
            border: linkedTask ? `1px solid ${config.color}` : '1px solid var(--border)',
            color: linkedTask ? 'var(--text)' : 'var(--text-ghost)',
            fontSize: '11px', fontFamily: 'var(--font-mono)',
            cursor: 'pointer', minWidth: 'unset',
          }}
        >
          <span>{linkedTask ? `> ${linkedTask.title}` : '> link task...'}</span>
          <ChevronDown size={12} style={{ color: 'var(--text-ghost)' }} />
        </button>

        {showTaskDropdown && (
          <div style={{
            position: 'absolute', zIndex: 20, top: '100%', left: 0, right: 0, marginTop: '2px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-bright)',
            maxHeight: '180px', overflowY: 'auto',
          }}>
            {linkedTask && (
              <button
                onClick={() => handleLinkTask(null)}
                style={{
                  width: '100%', textAlign: 'left', padding: '6px 10px',
                  background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
                  color: 'var(--danger)', fontSize: '11px', fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
              >
                [unlink task]
              </button>
            )}
            {availableTasks.length === 0 && (
              <div style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-ghost)' }}>no tasks available</div>
            )}
            {availableTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => handleLinkTask(task.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '6px 10px',
                  background: task.id === linkedTaskId ? 'var(--sel-bg)' : 'transparent',
                  border: 'none', borderBottom: '1px solid var(--border-dark)',
                  color: task.id === linkedTaskId ? config.color : 'var(--text-dim)',
                  fontSize: '11px', fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
              >
                {task.id === linkedTaskId ? '> ' : '  '}{task.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
