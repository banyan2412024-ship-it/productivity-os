/**
 * autoMigrateIfEmpty — runs once on first login.
 * If the user's Supabase tables are empty, pulls all data from Notion
 * and populates Supabase + the Zustand stores directly.
 */

import { supabase } from '../lib/supabase'
import {
  notionToTask, notionToIdea, notionToTransaction,
  notionToWeedLog, notionToEvent, notionToHabit,
} from './notionSync'
import { useTaskStore } from './taskStore'
import { useIdeaStore } from './ideaStore'
import { useMoneyStore } from './moneyStore'
import { useWeedStore } from './smokingStore'
import { useCalendarStore } from './calendarStore'
import { useHabitStore } from './habitStore'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

let ran = false

async function fetchNotion(table) {
  try {
    const res = await fetch(`${API}/${table}`)
    if (!res.ok) return []
    const d = await res.json()
    return d.results || []
  } catch { return [] }
}

async function upsert(table, rows) {
  if (!rows.length) return
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
  if (error) console.warn(`[Migrate] ${table}:`, error.message)
}

export async function autoMigrateIfEmpty(userId) {
  if (ran) return
  ran = true

  // Check if user already has data in Supabase
  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (count > 0) {
    console.log('[Migrate] Supabase already has data, skipping.')
    return
  }

  console.log('[Migrate] Empty — importing from Notion...')

  const [rawTasks, rawIdeas, rawTxs, rawWeed, rawEvents, rawHabits] = await Promise.all([
    fetchNotion('tasks'),
    fetchNotion('ideas'),
    fetchNotion('transactions'),
    fetchNotion('weed'),
    fetchNotion('events'),
    fetchNotion('habits'),
  ])

  const tasks        = rawTasks.map(notionToTask)
  const ideas        = rawIdeas.map(notionToIdea)
  const transactions = rawTxs.map(notionToTransaction)
  const weedLogs     = rawWeed.map(notionToWeedLog)
  const events       = rawEvents.map(notionToEvent)
  const habits       = rawHabits.map(notionToHabit)

  await Promise.all([
    upsert('tasks', tasks.map((t) => ({
      id: t.id, user_id: userId,
      title: t.title, notes: t.notes ?? '',
      status: t.status, priority: t.priority,
      is_mit: t.isMIT, is_frog: t.isFrog, is_quick_win: t.isQuickWin,
      due_date: t.dueDate ?? null, scheduled_date: t.scheduledDate ?? null,
      category: t.category, tags: t.tags ?? [],
      project_id: t.projectId ?? null,
      created_at: t.createdAt, completed_at: t.completedAt ?? null,
    }))),
    upsert('ideas', ideas.map((i) => ({
      id: i.id, user_id: userId,
      title: i.title, description: i.description ?? '',
      category: i.category, reminder_date: i.reminderDate ?? null,
      status: i.status, created_at: i.createdAt,
    }))),
    upsert('transactions', transactions.map((t) => ({
      id: t.id, user_id: userId,
      amount: t.amount, type: t.type,
      category: t.category, description: t.description ?? '',
      date: t.date, created_at: t.createdAt,
    }))),
    upsert('smoking_logs', weedLogs.map((l) => ({
      id: l.id, user_id: userId,
      date: l.date, time: l.time ?? '', grams: l.grams ?? 0,
      created_at: l.createdAt,
    }))),
    upsert('calendar_events', events.map((e) => ({
      id: e.id, user_id: userId,
      title: e.title, date: e.date,
      start_time: e.startTime, end_time: e.endTime,
      type: e.type ?? 'event', color: e.color ?? '#6366f1',
      description: e.description ?? '', idea_id: e.ideaId ?? null,
      created_at: e.createdAt,
    }))),
    upsert('habits', habits.map((h) => ({
      id: h.id, user_id: userId,
      name: h.name, description: h.description ?? '',
      frequency: h.frequency, custom_days: h.customDays ?? [],
      time_of_day: h.timeOfDay, stacked_after: h.stackedAfter ?? null,
      intention_time: h.intentionTime ?? null, intention_location: h.intentionLocation ?? null,
      color: h.color, icon: h.icon ?? 'circle',
      completions: h.completions ?? [],
      current_streak: h.currentStreak ?? 0, longest_streak: h.longestStreak ?? 0,
      created_at: h.createdAt,
    }))),
  ])

  // Update Zustand stores directly so the UI refreshes without a reload
  const strip = ({ _notionPageId, ...r }) => r
  useTaskStore.setState({ tasks: tasks.map(strip) })
  useIdeaStore.setState({ ideas: ideas.map(strip) })
  useMoneyStore.setState({ transactions: transactions.map(strip) })
  useWeedStore.setState({ smokingLogs: weedLogs.map(strip) })
  useCalendarStore.setState({ calendarEvents: events.map(strip) })
  useHabitStore.setState({ habits: habits.map(({ _notionPageId, ...h }) => ({ ...h, completions: h.completions ?? [] })) })

  console.log(`[Migrate] Done — tasks:${tasks.length} ideas:${ideas.length} txs:${transactions.length} weed:${weedLogs.length} events:${events.length} habits:${habits.length}`)
}
