import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
  ArrowRight,
  X,
  Undo2,
} from 'lucide-react'
import { useTaskStore, TASK_CATEGORIES } from '../stores/taskStore'
import { useCalendarStore } from '../stores/calendarStore'
import { useIdeaStore } from '../stores/ideaStore'
import { useHabitStore } from '../stores/habitStore'
import { useMoneyStore, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../stores/moneyStore'
import { useWeedStore, WEED_AMOUNTS } from '../stores/smokingStore'
import { useToastStore } from '../stores/toastStore'
import {
  format,
  addDays,
  subDays,
  isSameDay,
  startOfDay,
} from 'date-fns'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [weekStart, setWeekStart] = useState(startOfDay(new Date()))
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showEventForm, setShowEventForm] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', startTime: '09:00', endTime: '10:00', color: '#6366f1' })
  const [taskTitle, setTaskTitle] = useState('')
  const [taskCategory, setTaskCategory] = useState('Other')
  const [showMoneyForm, setShowMoneyForm] = useState(false)
  const [moneyAmt, setMoneyAmt] = useState('')
  const [moneyType, setMoneyType] = useState('expense')
  const [moneyCat, setMoneyCat] = useState('Other')
  const [moneyDesc, setMoneyDesc] = useState('')
  const [ideaTitle, setIdeaTitle] = useState('')

  // Stores
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
      map[i.reminderDate].push({ id: i.id, title: i.title, type: 'idea-reminder', color: '#eab308' })
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

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    const todayDate = format(now, 'yyyy-MM-dd')
    const nowTime = format(now, 'HH:mm')
    return calendarEvents
      .filter((e) => e.date > todayDate || (e.date === todayDate && e.startTime >= nowTime))
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      .slice(0, 2)
  }, [calendarEvents])

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

  const weedToday = useMemo(
    () => smokingLogs.filter((l) => l.date === todayStr).reduce((s, l) => s + (l.grams || 0), 0),
    [smokingLogs, todayStr]
  )

  const moneyToday = useMemo(() => {
    return transactions.filter((t) => t.date === todayStr && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  }, [transactions, todayStr])

  // ── Handlers with undo + toast ──

  function handleAddEvent(e) {
    e.preventDefault()
    if (!newEvent.title.trim()) return
    const id = addEvent({ ...newEvent, date: selectedStr })
    addToast(`Event "${newEvent.title}" added`, {
      type: 'success',
      undoFn: () => { deleteEvent(id); addToast('Event undone', { type: 'info' }) },
    })
    setNewEvent({ title: '', startTime: '09:00', endTime: '10:00', color: '#6366f1' })
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
  }

  function handleLogWeed(amt) {
    const id = logWeed(amt)
    addToast(`+${amt}g logged`, {
      type: 'success',
      undoFn: () => { deleteWeedLog(id); addToast('Weed log undone', { type: 'info' }) },
    })
  }

  function handleToggleHabit(habit) {
    const wasDone = isCompletedOnDate(habit.id, todayStr)
    toggleCompletion(habit.id, todayStr)
    addToast(`${habit.name} ${wasDone ? 'unchecked' : 'checked'}`, {
      type: 'success',
      undoFn: () => { toggleCompletion(habit.id, todayStr); addToast('Habit undone', { type: 'info' }) },
    })
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{getGreeting()}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <span className="hidden md:block text-xs text-gray-400">Ctrl+K to quick capture</span>
      </div>

      {/* ── 6-Day Calendar Strip + Upcoming ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 mb-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
          {/* 6-day strip */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm md:text-base font-semibold text-gray-900">Schedule</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => setWeekStart(subDays(weekStart, 6))} className="p-1 rounded hover:bg-gray-100"><ChevronLeft size={16} /></button>
                <button onClick={() => { setWeekStart(startOfDay(new Date())); setSelectedDate(new Date()) }} className="px-2 py-0.5 text-xs rounded hover:bg-gray-100 text-indigo-600 font-medium">Today</button>
                <button onClick={() => setWeekStart(addDays(weekStart, 6))} className="p-1 rounded hover:bg-gray-100"><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-1.5 md:gap-2">
              {sixDays.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd')
                const isSelected = isSameDay(day, selectedDate)
                const isToday = isSameDay(day, new Date())
                const dayEvents = eventsByDate[dayStr] || []
                return (
                  <button
                    key={dayStr}
                    onClick={() => setSelectedDate(day)}
                    className={`flex flex-col items-center py-2.5 md:py-3 px-1 md:px-2 rounded-xl transition-all ${
                      isSelected ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-50'
                    } ${isToday && !isSelected ? 'ring-2 ring-indigo-300' : ''}`}
                  >
                    <span className={`text-[10px] md:text-xs font-medium ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>{format(day, 'EEE')}</span>
                    <span className={`text-base md:text-lg font-bold mt-0.5 ${isSelected ? 'text-white' : 'text-gray-800'}`}>{format(day, 'd')}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {dayEvents.slice(0, 3).map((e, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : (e.color || '#6366f1') }} />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selected day */}
            <div className="mt-3 border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, 'EEE, MMM d')}
                </span>
                <button onClick={() => setShowEventForm(!showEventForm)} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  <Plus size={12} /> Event
                </button>
              </div>

              {showEventForm && (
                <form onSubmit={handleAddEvent} className="mb-3 p-3 bg-gray-50 rounded-xl space-y-2">
                  <input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Event title" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" autoFocus />
                  <div className="flex gap-2">
                    <input type="time" value={newEvent.startTime} onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })} className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded-lg" />
                    <input type="time" value={newEvent.endTime} onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })} className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded-lg" />
                    <input type="color" value={newEvent.color} onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })} className="w-8 h-8 rounded border border-gray-200 cursor-pointer" />
                    <button type="submit" className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
                  </div>
                </form>
              )}

              {ideaReminders.map((idea) => (
                <div key={idea.id} className="flex items-center gap-2 p-2 mb-1 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Lightbulb size={14} className="text-yellow-500 shrink-0" />
                  <span className="text-sm text-gray-800 truncate flex-1">{idea.title}</span>
                  <span className="text-xs text-yellow-600">idea</span>
                </div>
              ))}

              {selectedEvents.length === 0 && ideaReminders.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">No events</p>
              ) : (
                <div className="space-y-1">
                  {selectedEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group">
                      <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{event.title}</p>
                        <p className="text-xs text-gray-400">{event.startTime} – {event.endTime}</p>
                      </div>
                      <button onClick={() => {
                        const ev = { ...event }
                        deleteEvent(event.id)
                        addToast(`"${ev.title}" removed`, {
                          type: 'info',
                          undoFn: () => { addEvent({ ...ev, date: ev.date }); addToast('Event restored', { type: 'success' }) },
                        })
                      }} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 md:opacity-0"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming events bar */}
          <div className="hidden lg:block w-48 border-l pl-4 shrink-0">
            <h3 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">Upcoming</h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-gray-400">Nothing scheduled</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="p-2.5 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />
                      <span className="text-[10px] text-gray-500">{format(new Date(event.date), 'EEE, MMM d')}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-800 truncate">{event.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{event.startTime} – {event.endTime}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left column */}
        <div className="md:col-span-7 space-y-5">
          {/* Top 3 Tasks */}
          <section className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star size={16} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-900">Top 3 Tasks</h2>
              </div>
              <button onClick={() => navigate('/tasks')} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">All <ArrowRight size={12} /></button>
            </div>
            {top3.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">No active tasks</p>
            ) : (
              <div className="space-y-1.5 mb-3">
                {top3.map((task, i) => (
                  <div key={task.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50">
                    <button onClick={() => handleCompleteTask(task)} className="shrink-0">
                      <CheckCircle2 size={18} className={task.isFrog ? 'text-green-400' : task.isMIT ? 'text-amber-400' : 'text-gray-300'} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{task.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {task.category !== 'Other' && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{task.category}</span>}
                        {task.priority === 'high' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">High</span>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-300 font-mono">#{i + 1}</span>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleAddTask} className="flex items-center gap-2">
              <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Quick add task..." className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200" />
              <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} className="hidden md:block text-xs px-2 py-1.5 border border-gray-200 rounded-lg outline-none text-gray-600">
                {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus size={16} /></button>
            </form>
          </section>

          {/* Quick Idea */}
          <section className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={16} className="text-yellow-500" />
              <h2 className="text-sm font-semibold text-gray-900">Quick Idea</h2>
              <button onClick={() => navigate('/ideas')} className="ml-auto text-xs text-yellow-600 hover:text-yellow-700">Bank</button>
            </div>
            <form onSubmit={handleAddIdea} className="flex gap-2">
              <input value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} placeholder="Capture an idea..." className="flex-1 px-3 py-1.5 text-sm bg-white border border-yellow-200 rounded-lg outline-none focus:ring-2 focus:ring-yellow-300" />
              <button type="submit" className="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600"><Plus size={16} /></button>
            </form>
          </section>

          {/* Money */}
          <section className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-500" />
                <h2 className="text-sm font-semibold text-gray-900">Money</h2>
                <span className="text-xs text-gray-400">${moneyToday.toFixed(2)} today</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate('/money')} className="text-xs text-indigo-600 hover:text-indigo-700">Details</button>
                <button onClick={() => setShowMoneyForm(!showMoneyForm)} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><Plus size={12} /> Add</button>
              </div>
            </div>
            {showMoneyForm && (
              <form onSubmit={handleAddMoney} className="p-3 bg-gray-50 rounded-xl space-y-2">
                <div className="flex bg-gray-100 rounded-lg p-0.5 w-fit">
                  {['expense', 'income'].map((t) => (
                    <button key={t} type="button" onClick={() => { setMoneyType(t); setMoneyCat('Other') }} className={`px-3 py-1 text-xs rounded-md transition-colors capitalize ${moneyType === t ? (t === 'expense' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white') : 'text-gray-500'}`}>{t}</button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <input type="number" step="0.01" value={moneyAmt} onChange={(e) => setMoneyAmt(e.target.value)} placeholder="0.00" className="w-24 px-2 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg outline-none" autoFocus />
                  <input value={moneyDesc} onChange={(e) => setMoneyDesc(e.target.value)} placeholder="Description" className="flex-1 min-w-[120px] px-2 py-1.5 text-sm border border-gray-200 rounded-lg outline-none" />
                  <select value={moneyCat} onChange={(e) => setMoneyCat(e.target.value)} className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg outline-none">
                    {(moneyType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="submit" className={`px-3 py-1.5 text-sm text-white rounded-lg ${moneyType === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>Add</button>
                </div>
              </form>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="md:col-span-5 space-y-5">
          {/* Habits */}
          <section className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-orange-500" />
                <h2 className="text-sm font-semibold text-gray-900">Habits</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{completedHabitsCount}/{todayHabits.length}</span>
                <button onClick={() => navigate('/habits')} className="text-xs text-indigo-600 hover:text-indigo-700">More</button>
              </div>
            </div>
            {todayHabits.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">
                <button onClick={() => navigate('/habits')} className="text-indigo-600">Create habits</button>
              </p>
            ) : (
              <>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                  <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${todayHabits.length ? (completedHabitsCount / todayHabits.length) * 100 : 0}%` }} />
                </div>
                <div className="space-y-1">
                  {todayHabits.map((habit) => {
                    const done = isCompletedOnDate(habit.id, todayStr)
                    return (
                      <div key={habit.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => handleToggleHabit(habit)}>
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0" style={{ borderColor: done ? habit.color : '#d1d5db', backgroundColor: done ? habit.color : 'transparent' }}>
                          {done && <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>}
                        </div>
                        <span className={`text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{habit.name}</span>
                        {habit.currentStreak >= 3 && <span className="text-xs text-orange-500 ml-auto flex items-center gap-0.5"><Flame size={10} />{habit.currentStreak}</span>}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </section>

          {/* Weed */}
          <section className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Leaf size={16} className="text-green-500" />
                <h2 className="text-sm font-semibold text-gray-900">Weed</h2>
                <span className="text-lg font-bold text-green-500 ml-1">{weedToday.toFixed(1)}g</span>
              </div>
              <button onClick={() => navigate('/smoking')} className="text-xs text-indigo-600 hover:text-indigo-700">Details</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {WEED_AMOUNTS.map((amt) => (
                <button key={amt} onClick={() => handleLogWeed(amt)} className="px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold shadow-sm hover:shadow transition-all">
                  +{amt}g
                </button>
              ))}
            </div>
          </section>

          {/* Money summary */}
          <section className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-500" />
                <h2 className="text-sm font-semibold text-gray-900">Spent Today</h2>
              </div>
              <button onClick={() => navigate('/money')} className="text-xs text-indigo-600 hover:text-indigo-700">Full tracker</button>
            </div>
            <p className="text-2xl font-bold text-red-500">${moneyToday.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">{transactions.filter((t) => t.date === todayStr).length} transactions</p>
          </section>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
