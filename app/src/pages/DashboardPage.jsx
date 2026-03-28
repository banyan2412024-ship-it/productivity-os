import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '../stores/profileStore'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Lightbulb,
  Star,
  Flame,
  DollarSign,
  Leaf,
  Repeat,
  X,
} from 'lucide-react'
import { useTaskStore, TASK_CATEGORIES } from '../stores/taskStore'
import { useCalendarStore } from '../stores/calendarStore'
import { useIdeaStore } from '../stores/ideaStore'
import { useHabitStore } from '../stores/habitStore'
import { useMoneyStore, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../stores/moneyStore'
import { useWeedStore, WEED_AMOUNTS } from '../stores/smokingStore'
import { useToastStore } from '../stores/toastStore'
import MoodAgent from '../components/dashboard/MoodAgent'
import { useAgentAnimationStore } from '../stores/agentAnimationStore'
import {
  format,
  addDays,
  subDays,
  isSameDay,
  startOfDay,
  startOfMonth,
  endOfMonth,
  getDay,
} from 'date-fns'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [weekStart, setWeekStart] = useState(startOfDay(new Date()))
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showEventForm, setShowEventForm] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', startTime: '09:00', endTime: '10:00', color: '#00ff41' })
  const [taskTitle, setTaskTitle] = useState('')
  const [taskCategory, setTaskCategory] = useState('Other')
  const [showMoneyForm, setShowMoneyForm] = useState(false)
  const [moneyAmt, setMoneyAmt] = useState('')
  const [moneyType, setMoneyType] = useState('expense')
  const [moneyCat, setMoneyCat] = useState('Other')
  const [moneyDesc, setMoneyDesc] = useState('')
  const [showIdeaForm, setShowIdeaForm] = useState(false)
  const [ideaTitle, setIdeaTitle] = useState('')
  const [showWeedForm, setShowWeedForm] = useState(false)
  const [calMonth, setCalMonth] = useState(new Date())

  // Stores
  const profile = useProfileStore((s) => s.profile)
  const enabledModules = profile?.enabled_modules ?? ['tasks', 'notes', 'ideas', 'habits', 'pomodoro']
  const hasWeed = enabledModules.includes('smoking')
  const hasMoney = enabledModules.includes('money')

  const tasks = useTaskStore((s) => s.tasks)
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const calendarEvents = useCalendarStore((s) => s.calendarEvents)
  const addEvent = useCalendarStore((s) => s.addEvent)
  const deleteEvent = useCalendarStore((s) => s.deleteEvent)
  const ideas = useIdeaStore((s) => s.ideas)
  const addIdea = useIdeaStore((s) => s.addIdea)
  const deleteIdea = useIdeaStore((s) => s.deleteIdea)
  const habits = useHabitStore((s) => s.habits)
  const isCompletedOnDate = useHabitStore((s) => s.isCompletedOnDate)
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion)
  const transactions = useMoneyStore((s) => s.transactions)
  const addTransaction = useMoneyStore((s) => s.addTransaction)
  const deleteTransaction = useMoneyStore((s) => s.deleteTransaction)
  const smokingLogs = useWeedStore((s) => s.smokingLogs)
  const logWeed = useWeedStore((s) => s.logWeed)
  const deleteWeedLog = useWeedStore((s) => s.deleteLog)
  const addToast = useToastStore((s) => s.addToast)
  const triggerAnimation = useAgentAnimationStore((s) => s.triggerAnimation)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const selectedStr = format(selectedDate, 'yyyy-MM-dd')

  // 6-day strip
  const sixDays = useMemo(
    () => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  const eventsByDate = useMemo(() => {
    const map = {}
    calendarEvents.forEach((e) => {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    })
    ideas.filter((i) => i.reminderDate && i.status === 'active').forEach((i) => {
      if (!map[i.reminderDate]) map[i.reminderDate] = []
      map[i.reminderDate].push({ id: i.id, title: i.title, type: 'idea-reminder', color: '#00b300' })
    })
    return map
  }, [calendarEvents, ideas])

  const selectedEvents = useMemo(
    () => calendarEvents.filter((e) => e.date === selectedStr).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [calendarEvents, selectedStr]
  )

  const ideaReminders = useMemo(
    () => ideas.filter((i) => i.reminderDate === selectedStr && i.status === 'active'),
    [ideas, selectedStr]
  )

  const top3 = useMemo(() => {
    const active = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled')
    return active
      .sort((a, b) => {
        if (a.isFrog && !b.isFrog) return -1
        if (!a.isFrog && b.isFrog) return 1
        if (a.isMIT && !b.isMIT) return -1
        if (!a.isMIT && b.isMIT) return 1
        const p = { high: 3, medium: 2, low: 1 }
        return (p[b.priority] || 0) - (p[a.priority] || 0)
      })
      .slice(0, 3)
  }, [tasks])

  const todayHabits = useMemo(() => {
    const day = new Date().getDay()
    const dayMap = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' }
    return habits.filter((h) => {
      switch (h.frequency) {
        case 'daily': return true
        case 'weekdays': return day >= 1 && day <= 5
        case 'weekends': return day === 0 || day === 6
        case 'custom': return (h.customDays || []).includes(dayMap[day])
        default: return true
      }
    })
  }, [habits])

  const completedHabitsCount = useMemo(
    () => todayHabits.filter((h) => isCompletedOnDate(h.id, todayStr)).length,
    [todayHabits, habits, todayStr]
  )

  const completedTasksToday = useMemo(
    () => tasks.filter((t) => t.status === 'done' && t.completedAt && t.completedAt.startsWith(todayStr)).length,
    [tasks, todayStr]
  )

  const weedToday = useMemo(
    () => smokingLogs.filter((l) => l.date === todayStr).reduce((s, l) => s + (l.grams || 0), 0),
    [smokingLogs, todayStr]
  )

  const moneyToday = useMemo(() => {
    return transactions.filter((t) => t.date === todayStr && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  }, [transactions, todayStr])

  // Month net (income - expenses)
  const monthNet = useMemo(() => {
    const monthStr = format(new Date(), 'yyyy-MM')
    const monthTx = transactions.filter((t) => t.date && t.date.startsWith(monthStr))
    const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return income - expenses
  }, [transactions])

  // 7-day weed chart data
  const weedWeek = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i)
      const ds = format(d, 'yyyy-MM-dd')
      const grams = smokingLogs.filter((l) => l.date === ds).reduce((s, l) => s + (l.grams || 0), 0)
      return { day: format(d, 'EEE'), grams, date: ds }
    })
  }, [smokingLogs])

  // 7-day spending chart data
  const spendWeek = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i)
      const ds = format(d, 'yyyy-MM-dd')
      const spent = transactions.filter((t) => t.date === ds && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      return { day: format(d, 'EEE'), spent, date: ds }
    })
  }, [transactions])

  // 7-day task completion data
  const taskWeek = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i)
      const ds = format(d, 'yyyy-MM-dd')
      const count = tasks.filter((t) => t.status === 'done' && t.completedAt && t.completedAt.startsWith(ds)).length
      return { day: format(d, 'EEE'), count, date: ds }
    })
  }, [tasks])

  // 7-day habit completion rate
  const habitWeek = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i)
      const ds = format(d, 'yyyy-MM-dd')
      const total = habits.length || 1
      const done = habits.filter((h) => isCompletedOnDate(h.id, ds)).length
      return { day: format(d, 'EEE'), rate: Math.round((done / total) * 100), date: ds }
    })
  }, [habits])

  // Calendar grid for the month view
  const calendarGrid = useMemo(() => {
    const monthStart = startOfMonth(calMonth)
    const monthEnd = endOfMonth(calMonth)
    const startDay = getDay(monthStart)
    const days = []
    // pad start
    for (let i = 0; i < startDay; i++) days.push(null)
    let current = monthStart
    while (current <= monthEnd) {
      days.push(new Date(current))
      current = addDays(current, 1)
    }
    return days
  }, [calMonth])

  // ── Handlers ──

  function handleAddEvent(e) {
    e.preventDefault()
    if (!newEvent.title.trim()) return
    const id = addEvent({ ...newEvent, date: selectedStr })
    addToast(`Event "${newEvent.title}" added`, {
      type: 'success',
      undoFn: () => { deleteEvent(id); addToast('Event undone', { type: 'info' }) },
    })
    setNewEvent({ title: '', startTime: '09:00', endTime: '10:00', color: '#00ff41' })
    setShowEventForm(false)
  }

  function handleAddTask(e) {
    e.preventDefault()
    if (!taskTitle.trim()) return
    const title = taskTitle.trim()
    const id = addTask({ title, status: 'inbox', category: taskCategory })
    addToast(`Task "${title}" added to inbox`, {
      type: 'success',
      undoFn: () => { deleteTask(id); addToast('Task undone', { type: 'info' }) },
    })
    setTaskTitle('')
    setTaskCategory('Other')
  }

  function handleCompleteTask(task) {
    const prev = task.status
    updateTask(task.id, { status: 'done' })
    addToast(`"${task.title}" completed`, {
      type: 'success',
      undoFn: () => { updateTask(task.id, { status: prev }); addToast('Task restored', { type: 'info' }) },
    })
  }

  function handleAddMoney(e) {
    e.preventDefault()
    if (!moneyAmt || parseFloat(moneyAmt) <= 0) return
    const amt = parseFloat(moneyAmt)
    const id = addTransaction({ type: moneyType, amount: amt, category: moneyCat, description: moneyDesc, date: todayStr })
    addToast(`${moneyType === 'income' ? '+' : '-'}$${amt.toFixed(2)} ${moneyCat}`, {
      type: 'success',
      undoFn: () => { deleteTransaction(id); addToast('Transaction undone', { type: 'info' }) },
    })
    if (moneyType === 'expense' && amt > 50) triggerAnimation('worried')
    setMoneyAmt('')
    setMoneyDesc('')
    setMoneyCat('Other')
    setShowMoneyForm(false)
  }

  function handleAddIdea(e) {
    e.preventDefault()
    if (!ideaTitle.trim()) return
    const title = ideaTitle.trim()
    const id = addIdea({ title })
    addToast(`Idea "${title}" captured`, {
      type: 'success',
      undoFn: () => { deleteIdea(id); addToast('Idea undone', { type: 'info' }) },
    })
    setIdeaTitle('')
    setShowIdeaForm(false)
  }

  function handleLogWeed(amt) {
    const id = logWeed(amt)
    addToast(`+${amt}g logged`, {
      type: 'success',
      undoFn: () => { deleteWeedLog(id); addToast('Weed log undone', { type: 'info' }) },
    })
    triggerAnimation('disappointed')
    setShowWeedForm(false)
  }

  function handleToggleHabit(habit) {
    const wasDone = isCompletedOnDate(habit.id, todayStr)
    toggleCompletion(habit.id, todayStr)
    addToast(`${habit.name} ${wasDone ? 'unchecked' : 'checked'}`, {
      type: 'success',
      undoFn: () => { toggleCompletion(habit.id, todayStr); addToast('Habit undone', { type: 'info' }) },
    })
    if (!wasDone) triggerAnimation('celebrate')
  }

  const maxWeed = Math.max(...weedWeek.map((d) => d.grams), 0.1)
  const maxSpend = Math.max(...spendWeek.map((d) => d.spent), 1)
  const maxTasks = Math.max(...taskWeek.map((d) => d.count), 1)

  return (
    <div className="p-3 md:p-5 max-w-7xl mx-auto" style={{ fontFamily: 'var(--font-mono)' }}>

      {/* ── HEADER: Greeting ── */}
      <div style={{ marginBottom: '10px' }}>
        <h1
          className="glitch-hover"
          style={{ fontSize: '18px', color: 'var(--neon)', textShadow: '0 0 10px rgba(0,255,65,0.6)', margin: 0 }}
        >
          {getGreeting()}
        </h1>
        <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: '2px 0 0' }}>
          // {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* ── STATUS BAR: Weed | Money | Habits ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${1 + (hasWeed ? 1 : 0) + (hasMoney ? 1 : 0)}, 1fr)`, gap: '8px', marginBottom: '16px',
      }}>

        {/* WEED */}
        {hasWeed && (() => {
          const avg = weedWeek.slice(0, 6).reduce((s, d) => s + d.grams, 0) / 6
          const today7 = weedWeek[6]?.grams ?? 0
          const trending = today7 > avg
          return (
            <div style={{
              background: 'var(--bg-surface)',
              borderTop: '2px solid #1a6b1a', borderLeft: '2px solid #1a6b1a',
              borderRight: '2px solid #003300', borderBottom: '2px solid #003300',
              display: 'flex', alignItems: 'stretch', overflow: 'hidden',
            }}>
              <button
                onClick={() => setShowWeedForm(!showWeedForm)}
                title="Log weed"
                style={{
                  width: '40px', flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
                  background: showWeedForm ? 'rgba(0,255,65,0.1)' : 'var(--bg-elevated)',
                  borderRight: '1px solid var(--border)',
                  color: 'var(--neon)', padding: 0, minWidth: 0, cursor: 'pointer',
                }}
              >
                <Leaf size={14} />
                <span style={{ fontSize: '7px', letterSpacing: '1px', color: 'var(--text-ghost)' }}>LOG</span>
              </button>
              <div style={{ flex: 1, padding: '6px 10px' }}>
                <div style={{ fontSize: '8px', color: 'var(--text-ghost)', letterSpacing: '1px', marginBottom: '3px' }}>WEED // TODAY</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '20px', color: 'var(--neon)', fontWeight: 'bold', lineHeight: 1 }}>{weedToday.toFixed(1)}g</span>
                  <span style={{ fontSize: '10px', color: trending ? 'var(--danger)' : 'var(--neon)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {trending ? '▲' : '▼'} {avg.toFixed(1)}g/d avg
                  </span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* MONEY */}
        {hasMoney && (
        <div style={{
          background: 'var(--bg-surface)',
          borderTop: '2px solid #1a6b1a', borderLeft: '2px solid #1a6b1a',
          borderRight: '2px solid #003300', borderBottom: '2px solid #003300',
          display: 'flex', alignItems: 'stretch', overflow: 'hidden',
        }}>
          <button
            onClick={() => setShowMoneyForm(!showMoneyForm)}
            title="Log money"
            style={{
              width: '40px', flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
              background: showMoneyForm ? 'rgba(0,229,204,0.1)' : 'var(--bg-elevated)',
              borderRight: '1px solid var(--border)',
              color: 'var(--cyan)', padding: 0, minWidth: 0, cursor: 'pointer',
            }}
          >
            <DollarSign size={14} />
            <span style={{ fontSize: '7px', letterSpacing: '1px', color: 'var(--text-ghost)' }}>LOG</span>
          </button>
          <div style={{ flex: 1, padding: '6px 10px' }}>
            <div style={{ fontSize: '8px', color: 'var(--text-ghost)', letterSpacing: '1px', marginBottom: '3px' }}>MONEY // MONTH NET</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '20px', color: monthNet >= 0 ? 'var(--neon)' : 'var(--danger)', fontWeight: 'bold', lineHeight: 1 }}>
                {monthNet >= 0 ? '+' : ''}${Math.abs(monthNet).toFixed(0)}
              </span>
              {moneyToday > 0 && (
                <span style={{ fontSize: '10px', color: 'var(--text-ghost)' }}>-${moneyToday.toFixed(0)} today</span>
              )}
            </div>
          </div>
        </div>
        )}

        {/* HABITS */}
        <div style={{
          background: 'var(--bg-surface)',
          borderTop: '2px solid #1a6b1a', borderLeft: '2px solid #1a6b1a',
          borderRight: '2px solid #003300', borderBottom: '2px solid #003300',
          display: 'flex', alignItems: 'stretch', overflow: 'hidden',
        }}>
          <button
            onClick={() => setShowIdeaForm(!showIdeaForm)}
            title="Log idea"
            style={{
              width: '40px', flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
              background: showIdeaForm ? 'rgba(204,68,255,0.1)' : 'var(--bg-elevated)',
              borderRight: '1px solid var(--border)',
              color: 'var(--orange)', padding: 0, minWidth: 0, cursor: 'pointer',
            }}
          >
            <Repeat size={14} />
            <span style={{ fontSize: '7px', letterSpacing: '1px', color: 'var(--text-ghost)' }}>LOG</span>
          </button>
          <div style={{ flex: 1, padding: '6px 10px' }}>
            <div style={{ fontSize: '8px', color: 'var(--text-ghost)', letterSpacing: '1px', marginBottom: '3px' }}>
              HABITS // {completedHabitsCount}/{todayHabits.length} DONE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '20px', fontWeight: 'bold', lineHeight: 1,
                color: todayHabits.length > 0 && completedHabitsCount === todayHabits.length
                  ? 'var(--neon)' : 'var(--amber)',
              }}>
                {todayHabits.length > 0 ? Math.round((completedHabitsCount / todayHabits.length) * 100) : 0}%
              </span>
              <div style={{
                display: 'flex', gap: '2px', flex: 1, height: '12px',
                borderTop: '2px solid #003300', borderLeft: '2px solid #003300',
                borderRight: '2px solid #1a6b1a', borderBottom: '2px solid #1a6b1a',
                background: '#000', padding: '1px', alignItems: 'center',
              }}>
                {Array.from({ length: Math.max(todayHabits.length, 1) }, (_, i) => (
                  <div key={i} style={{ flex: 1, height: '100%', background: i < completedHabitsCount ? 'var(--neon)' : '#003300' }} />
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Overlay: Weed ── */}
      {showWeedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowWeedForm(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} />
          <div onClick={(e) => e.stopPropagation()} style={{ ...overlayBox, width: '320px' }}>
            <div style={overlayTitleBar}>
              <span>// WEED_LOG</span>
              <button onClick={() => setShowWeedForm(false)} style={overlayClose}>✕</button>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-ghost)', marginBottom: '8px' }}>{'>'} select amount to log</div>
              <div style={{ fontSize: '24px', color: 'var(--neon)', textAlign: 'center', marginBottom: '12px', textShadow: '0 0 10px rgba(0,255,65,0.5)' }}>
                {weedToday.toFixed(1)}g today
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {WEED_AMOUNTS.map((amt) => (
                  <button key={amt} onClick={() => handleLogWeed(amt)} style={{ ...btnSmall, padding: '10px', fontSize: '13px', textAlign: 'center', width: '100%' }}>+{amt}g</button>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '12px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-ghost)' }}>
                <span>click amount to log</span>
                <button onClick={() => navigate('/smoking')} style={{ ...btnSmall, fontSize: '9px', padding: '2px 6px' }}>[ FULL LOG ]</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Overlay: Money ── */}
      {showMoneyForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowMoneyForm(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} />
          <div onClick={(e) => e.stopPropagation()} style={{ ...overlayBox, width: '380px' }}>
            <div style={overlayTitleBar}>
              <span>// MONEY_LOG</span>
              <button onClick={() => setShowMoneyForm(false)} style={overlayClose}>✕</button>
            </div>
            <form onSubmit={handleAddMoney} style={{ padding: '16px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-ghost)', marginBottom: '10px' }}>{'>'} log a transaction</div>

              {/* Type toggle */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                {['expense', 'income'].map((t) => (
                  <button key={t} type="button" onClick={() => { setMoneyType(t); setMoneyCat('Other') }}
                    style={{
                      ...btnSmall,
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px',
                      fontSize: '12px',
                      color: moneyType === t ? (t === 'expense' ? 'var(--danger)' : 'var(--neon)') : 'var(--text-ghost)',
                      boxShadow: moneyType === t ? (t === 'expense' ? '0 0 6px #ff0033' : '0 0 6px #00ff41') : 'none',
                    }}>
                    [ {t.toUpperCase()} ]
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '9px', color: 'var(--text-ghost)', display: 'block', marginBottom: '2px' }}>AMOUNT</label>
                <input type="number" step="0.01" value={moneyAmt} onChange={(e) => setMoneyAmt(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '8px', fontSize: '16px' }} autoFocus />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '9px', color: 'var(--text-ghost)', display: 'block', marginBottom: '2px' }}>DESCRIPTION</label>
                <input value={moneyDesc} onChange={(e) => setMoneyDesc(e.target.value)} placeholder="what was it for..." style={{ width: '100%', padding: '6px' }} />
              </div>

              {/* Category */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '9px', color: 'var(--text-ghost)', display: 'block', marginBottom: '2px' }}>CATEGORY</label>
                <select value={moneyCat} onChange={(e) => setMoneyCat(e.target.value)} style={{ width: '100%', padding: '6px' }}>
                  {(moneyType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <button type="button" onClick={() => setShowMoneyForm(false)} style={{ ...btnSmall, color: 'var(--text-ghost)' }}>[ CANCEL ]</button>
                <button type="submit" style={{ ...btnSmall, boxShadow: '0 0 4px rgba(0,255,65,0.4)' }}>[ ADD ]</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Overlay: Idea ── */}
      {showIdeaForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowIdeaForm(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} />
          <div onClick={(e) => e.stopPropagation()} style={{ ...overlayBox, width: '380px' }}>
            <div style={overlayTitleBar}>
              <span>// IDEA_CAPTURE</span>
              <button onClick={() => setShowIdeaForm(false)} style={overlayClose}>✕</button>
            </div>
            <form onSubmit={handleAddIdea} style={{ padding: '16px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-ghost)', marginBottom: '10px' }}>{'>'} capture an idea before it escapes</div>
              <input value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} placeholder="type your idea..." style={{ width: '100%', padding: '10px', fontSize: '13px', marginBottom: '12px' }} autoFocus />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <button type="button" onClick={() => setShowIdeaForm(false)} style={{ ...btnSmall, color: 'var(--text-ghost)' }}>[ CANCEL ]</button>
                <button type="submit" style={{ ...btnSmall, boxShadow: '0 0 4px rgba(0,255,65,0.4)' }}>[ SAVE ]</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ROW 1: Schedule Strip (full width) ── */}
      <div style={{ marginBottom: '12px' }}>
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={headerStyle}>// SCHEDULE</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => setWeekStart(subDays(weekStart, 6))} style={btnIcon}><ChevronLeft size={14} /></button>
              <button onClick={() => { setWeekStart(startOfDay(new Date())); setSelectedDate(new Date()) }} style={btnIcon}>NOW</button>
              <button onClick={() => setWeekStart(addDays(weekStart, 6))} style={btnIcon}><ChevronRight size={14} /></button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
            {sixDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd')
              const isSelected = isSameDay(day, selectedDate)
              const isToday = isSameDay(day, new Date())
              const dayEvents = eventsByDate[dayStr] || []
              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDate(day)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '6px 2px',
                    background: isSelected ? 'var(--sel-bg)' : 'transparent',
                    border: isSelected ? '1px solid var(--neon)' : isToday ? '1px solid var(--border-bright)' : '1px solid transparent',
                    boxShadow: isSelected ? '0 0 6px rgba(0,255,65,0.4)' : 'none',
                    color: isSelected ? 'var(--neon)' : 'var(--text-dim)',
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: '9px' }}>{format(day, 'EEE')}</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{format(day, 'd')}</span>
                  {dayEvents.length > 0 && (
                    <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                      {dayEvents.slice(0, 3).map((e, i) => (
                        <div key={i} style={{ width: '4px', height: '4px', background: isSelected ? 'var(--neon)' : (e.color || 'var(--neon-dim)') }} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Selected day events */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                {isSameDay(selectedDate, new Date()) ? '> today' : `> ${format(selectedDate, 'EEE, MMM d')}`}
              </span>
              <button onClick={() => setShowEventForm(!showEventForm)} style={btnIcon}><Plus size={12} /> EVT</button>
            </div>

            {showEventForm && (
              <form onSubmit={handleAddEvent} style={{ marginBottom: '8px', padding: '8px', background: 'var(--bg-elevated)' }}>
                <input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="event title" style={{ width: '100%', marginBottom: '4px' }} autoFocus />
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input type="time" value={newEvent.startTime} onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })} style={{ flex: 1 }} />
                  <input type="time" value={newEvent.endTime} onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })} style={{ flex: 1 }} />
                  <button type="submit" style={btnSmall}>[ OK ]</button>
                </div>
              </form>
            )}

            {ideaReminders.map((idea) => (
              <div key={idea.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px', borderBottom: '1px solid var(--border)' }}>
                <Lightbulb size={12} style={{ color: 'var(--neon-dim)', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'var(--text)' }}>{idea.title}</span>
              </div>
            ))}

            {selectedEvents.length === 0 && ideaReminders.length === 0 ? (
              <p style={{ fontSize: '10px', color: 'var(--text-ghost)', textAlign: 'center', padding: '8px 0' }}>no events scheduled</p>
            ) : (
              selectedEvents.map((event) => (
                <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px', borderBottom: '1px solid var(--border)' }} className="group">
                  <div style={{ width: '3px', height: '20px', background: event.color || 'var(--neon)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '11px', color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</p>
                    <p style={{ fontSize: '9px', color: 'var(--text-ghost)', margin: 0 }}>{event.startTime} – {event.endTime}</p>
                  </div>
                  <button onClick={() => { deleteEvent(event.id); addToast(`"${event.title}" removed`, { type: 'info' }) }} style={{ color: 'var(--text-ghost)', background: 'none', border: 'none', padding: '2px', minWidth: 0, cursor: 'pointer' }} className="opacity-0 group-hover:opacity-100"><X size={12} /></button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 2: Mood Agent + Habits + Top Tasks ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }} className="grid-cols-1! md:grid-cols-2!">

        {/* Mood Agent */}
        <MoodAgent
          tasksCompleted={completedTasksToday}
          totalTasks={top3.length || tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled').length}
          habitsCompleted={completedHabitsCount}
          totalHabits={todayHabits.length}
          weedGrams={weedToday}
        />

        {/* Habits */}
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={headerStyle}>// HABITS</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--neon)' }}>{completedHabitsCount}/{todayHabits.length}</span>
              <button onClick={() => navigate('/habits')} style={btnIcon}>MORE</button>
            </div>
          </div>

          {/* Habit progress bar */}
          <div className="progress-bar" style={{ marginBottom: '8px', height: '12px' }}>
            {Array.from({ length: 10 }, (_, i) => {
              const pct = todayHabits.length ? (completedHabitsCount / todayHabits.length) * 100 : 0
              const filled = i < Math.round(pct / 10)
              return <div key={i} className={`progress-block ${filled ? 'filled' : 'empty'}`} />
            })}
          </div>

          {todayHabits.length === 0 ? (
            <p style={{ fontSize: '10px', color: 'var(--text-ghost)', textAlign: 'center', padding: '8px 0' }}>
              no habits configured. <button onClick={() => navigate('/habits')} style={{ color: 'var(--neon)', background: 'none', border: 'none', cursor: 'pointer', minWidth: 0, padding: 0, fontSize: '10px' }}>[create]</button>
            </p>
          ) : (
            todayHabits.slice(0, 5).map((habit) => {
              const done = isCompletedOnDate(habit.id, todayStr)
              return (
                <div key={habit.id} onClick={() => handleToggleHabit(habit)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 4px', borderBottom: '1px solid #001a00', cursor: 'pointer' }}>
                  <input type="checkbox" checked={done} readOnly style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: done ? 'var(--text-ghost)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>{habit.name}</span>
                  {habit.currentStreak >= 3 && <span style={{ fontSize: '9px', color: 'var(--neon-dim)', marginLeft: 'auto' }}>{habit.currentStreak}d</span>}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── ROW 3: Top Tasks + Quick Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }} className="grid-cols-1! md:grid-cols-2!">

        {/* Top 3 Tasks */}
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={headerStyle}>// TOP_TASKS</span>
            <button onClick={() => navigate('/tasks')} style={btnIcon}>ALL</button>
          </div>

          {top3.length === 0 ? (
            <p style={{ fontSize: '10px', color: 'var(--text-ghost)', textAlign: 'center', padding: '8px 0' }}>no active tasks</p>
          ) : (
            top3.map((task, i) => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px', borderBottom: '1px solid #001a00' }}>
                <button onClick={() => handleCompleteTask(task)} style={{ background: 'none', border: 'none', padding: 0, minWidth: 0, cursor: 'pointer', color: task.isFrog ? 'var(--neon)' : task.isMIT ? 'var(--neon-dim)' : 'var(--text-ghost)' }}>
                  <CheckCircle2 size={14} />
                </button>
                <span style={{ flex: 1, fontSize: '11px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                <span style={{ fontSize: '9px', color: 'var(--text-ghost)' }}>#{i + 1}</span>
              </div>
            ))
          )}

          <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
            <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="quick add task..." style={{ flex: 1 }} />
            <button type="submit" style={btnSmall}>[ + ]</button>
          </form>
        </div>

        {/* Quick Stats */}
        <div style={panelStyle}>
          <span style={{ ...headerStyle, display: 'block', marginBottom: '8px' }}>// STATUS_REPORT</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'TASKS DONE', value: completedTasksToday, color: 'var(--neon)' },
              { label: 'HABITS', value: `${completedHabitsCount}/${todayHabits.length}`, color: 'var(--neon)' },
              { label: 'WEED', value: `${weedToday.toFixed(1)}g`, color: weedToday > 0.5 ? 'var(--danger)' : 'var(--neon)' },
              { label: 'SPENT', value: `$${moneyToday.toFixed(0)}`, color: moneyToday > 50 ? 'var(--danger)' : 'var(--neon)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: '8px', background: 'var(--bg-base)', borderTop: '2px solid #003300', borderLeft: '2px solid #003300', borderRight: '2px solid #1a6b1a', borderBottom: '2px solid #1a6b1a' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-ghost)', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color, textShadow: `0 0 8px ${color}` }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 4: Weed + Money buttons ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }} className="grid-cols-1! md:grid-cols-2!">

        {/* Weed Quick Log */}
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={headerStyle}>// WEED_LOG</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: weedToday > 0.5 ? 'var(--danger)' : 'var(--neon)', textShadow: `0 0 6px ${weedToday > 0.5 ? '#ff0033' : '#00ff41'}` }}>{weedToday.toFixed(1)}g</span>
              <button onClick={() => navigate('/smoking')} style={btnIcon}>LOG</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {WEED_AMOUNTS.map((amt) => (
              <button key={amt} onClick={() => handleLogWeed(amt)} style={btnSmall}>+{amt}g</button>
            ))}
          </div>
        </div>

        {/* Money Quick Log */}
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={headerStyle}>// MONEY</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: moneyToday > 50 ? 'var(--danger)' : 'var(--neon)' }}>${moneyToday.toFixed(2)}</span>
              <button onClick={() => navigate('/money')} style={btnIcon}>LOG</button>
            </div>
          </div>
          <button onClick={() => setShowMoneyForm(!showMoneyForm)} style={btnSmall}>[ + ADD TRANSACTION ]</button>
        </div>
      </div>

      {/* ── ROW 5: CHARTS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }} className="grid-cols-1! md:grid-cols-2!">

        {/* Task Completion Chart */}
        <div style={panelStyle}>
          <span style={{ ...headerStyle, display: 'block', marginBottom: '8px' }}>// TASKS_COMPLETED [7d]</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '60px' }}>
            {taskWeek.map((d) => (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', background: d.count > 0 ? 'var(--neon)' : 'var(--neon-ghost)', height: `${Math.max((d.count / maxTasks) * 100, 4)}%`, boxShadow: d.count > 0 ? '0 0 4px rgba(0,255,65,0.4)' : 'none' }} />
                <span style={{ fontSize: '8px', color: 'var(--text-ghost)', marginTop: '2px' }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Habit Completion Chart */}
        <div style={panelStyle}>
          <span style={{ ...headerStyle, display: 'block', marginBottom: '8px' }}>// HABIT_RATE [7d]</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '60px' }}>
            {habitWeek.map((d) => (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', background: d.rate > 0 ? 'var(--neon-dim)' : 'var(--neon-ghost)', height: `${Math.max(d.rate, 4)}%`, boxShadow: d.rate > 50 ? '0 0 4px rgba(0,255,65,0.3)' : 'none' }} />
                <span style={{ fontSize: '8px', color: 'var(--text-ghost)', marginTop: '2px' }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weed Chart */}
        <div style={panelStyle}>
          <span style={{ ...headerStyle, display: 'block', marginBottom: '8px' }}>// WEED_INTAKE [7d]</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '60px' }}>
            {weedWeek.map((d) => (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', background: d.grams > 0.5 ? 'var(--danger)' : d.grams > 0 ? 'var(--neon-dim)' : 'var(--neon-ghost)', height: `${Math.max((d.grams / maxWeed) * 100, 4)}%` }} />
                <span style={{ fontSize: '8px', color: 'var(--text-ghost)', marginTop: '2px' }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spending Chart */}
        <div style={panelStyle}>
          <span style={{ ...headerStyle, display: 'block', marginBottom: '8px' }}>// SPENDING [7d]</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '60px' }}>
            {spendWeek.map((d) => (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', background: d.spent > 50 ? 'var(--danger)' : d.spent > 0 ? 'var(--neon-dim)' : 'var(--neon-ghost)', height: `${Math.max((d.spent / maxSpend) * 100, 4)}%` }} />
                <span style={{ fontSize: '8px', color: 'var(--text-ghost)', marginTop: '2px' }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 6: Full Calendar (bottom) ── */}
      <div style={{ ...panelStyle, marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={headerStyle}>// CALENDAR</span>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button onClick={() => setCalMonth(subDays(startOfMonth(calMonth), 1))} style={btnIcon}><ChevronLeft size={14} /></button>
            <span style={{ fontSize: '11px', color: 'var(--text)' }}>{format(calMonth, 'MMM yyyy')}</span>
            <button onClick={() => setCalMonth(addDays(endOfMonth(calMonth), 1))} style={btnIcon}><ChevronRight size={14} /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: '9px', color: 'var(--text-ghost)', padding: '4px 2px', borderBottom: '1px solid var(--border)' }}>{d}</div>
          ))}
          {calendarGrid.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} style={{ padding: '6px', background: 'var(--bg-base)' }} />
            const ds = format(day, 'yyyy-MM-dd')
            const isToday = isSameDay(day, new Date())
            const dayEvts = eventsByDate[ds] || []
            const isSelected = isSameDay(day, selectedDate)
            return (
              <button
                key={ds}
                onClick={() => { setSelectedDate(day); setWeekStart(startOfDay(subDays(day, getDay(day)))) }}
                style={{
                  padding: '4px',
                  fontSize: '11px',
                  textAlign: 'left',
                  verticalAlign: 'top',
                  minHeight: '40px',
                  background: isSelected ? 'var(--sel-bg)' : 'var(--bg-base)',
                  color: isToday ? 'var(--neon)' : isSelected ? 'var(--neon)' : 'var(--text-dim)',
                  border: isToday ? '1px solid var(--neon)' : isSelected ? '1px solid var(--border-bright)' : '1px solid var(--border)',
                  boxShadow: isToday ? '0 0 4px rgba(0,255,65,0.3)' : 'none',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <span style={{ fontWeight: isToday ? 'bold' : 'normal' }}>{format(day, 'd')}</span>
                {dayEvts.slice(0, 2).map((e, j) => (
                  <span key={j} style={{ fontSize: '7px', color: 'var(--neon-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.2', marginTop: '1px' }}>
                    {e.title?.slice(0, 10)}
                  </span>
                ))}
                {dayEvts.length > 2 && <span style={{ fontSize: '7px', color: 'var(--text-ghost)' }}>+{dayEvts.length - 2}</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Shared styles ──

const panelStyle = {
  background: 'var(--bg-surface)',
  borderTop: '2px solid #1a6b1a',
  borderLeft: '2px solid #1a6b1a',
  borderRight: '2px solid #003300',
  borderBottom: '2px solid #003300',
  padding: '12px',
}

const headerStyle = {
  fontSize: '11px',
  color: 'var(--text-dim)',
  letterSpacing: '0.5px',
}

const btnSmall = {
  fontSize: '10px',
  padding: '3px 8px',
  minWidth: 0,
  color: 'var(--neon)',
  background: 'var(--bg-surface)',
  borderTop: '2px solid #1a6b1a',
  borderLeft: '2px solid #1a6b1a',
  borderRight: '2px solid #003300',
  borderBottom: '2px solid #003300',
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
}

const btnIcon = {
  fontSize: '9px',
  padding: '2px 6px',
  minWidth: 0,
  color: 'var(--text-dim)',
  background: 'transparent',
  border: '1px solid var(--border)',
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
}

const overlayBox = {
  position: 'relative',
  background: 'var(--bg-surface)',
  borderTop: '2px solid #1a6b1a',
  borderLeft: '2px solid #1a6b1a',
  borderRight: '2px solid #003300',
  borderBottom: '2px solid #003300',
  boxShadow: '0 0 20px rgba(0,255,65,0.3)',
  fontFamily: 'var(--font-mono)',
}

const overlayTitleBar = {
  background: 'linear-gradient(90deg, #003d00, #001a00)',
  borderBottom: '1px solid var(--neon)',
  padding: '6px 10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '11px',
  color: 'var(--neon)',
}

const overlayClose = {
  background: 'none',
  border: 'none',
  color: 'var(--danger)',
  cursor: 'pointer',
  padding: '2px',
  minWidth: 0,
  fontSize: '11px',
  fontFamily: 'var(--font-mono)',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return '> GOOD_MORNING'
  if (h < 17) return '> GOOD_AFTERNOON'
  return '> GOOD_EVENING'
}
