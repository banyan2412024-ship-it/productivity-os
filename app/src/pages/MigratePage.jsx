/**
 * MigratePage — one-time data migration to Supabase.
 *
 * Sources:
 *   1. Notion (via the Express proxy server) — tasks, ideas, transactions, weed, events, habits
 *   2. Dexie IndexedDB (local) — projects, notes, pomodoro sessions, time blocks
 *
 * Writes everything to Supabase under the current user's ID.
 * Shows a before/after comparison table.
 */

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { db } from '../stores/db'
import {
  notionToTask, notionToIdea, notionToTransaction,
  notionToWeedLog, notionToEvent, notionToHabit,
} from '../stores/notionSync'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// ─── Notion fetch helpers ────────────────────────────────────────────────────

async function fetchNotion(table) {
  try {
    const res = await fetch(`${API}/${table}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.results || []
  } catch {
    return []
  }
}

// ─── Supabase upsert helper ──────────────────────────────────────────────────

async function upsert(table, rows) {
  if (!rows.length) return { count: 0, error: null }
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
  return { count: rows.length, error }
}

// ─── Component ───────────────────────────────────────────────────────────────

const TABLES = [
  { label: 'Tasks',        key: 'tasks' },
  { label: 'Projects',     key: 'projects' },
  { label: 'Ideas',        key: 'ideas' },
  { label: 'Notes',        key: 'notes' },
  { label: 'Transactions', key: 'transactions' },
  { label: 'Habits',       key: 'habits' },
  { label: 'Weed Logs',    key: 'smoking_logs' },
  { label: 'Events',       key: 'calendar_events' },
  { label: 'Pomo Sessions',key: 'pomodoro_sessions' },
  { label: 'Time Blocks',  key: 'time_blocks' },
]

export default function MigratePage() {
  const user = useAuthStore((s) => s.user)
  const [status, setStatus] = useState('idle') // idle | scanning | migrating | done | error
  const [before, setBefore] = useState(null)
  const [after, setAfter] = useState(null)
  const [log, setLog] = useState([])

  function addLog(msg) {
    setLog((l) => [...l, `> ${msg}`])
  }

  async function scanBefore() {
    setStatus('scanning')
    setLog([])
    addLog('Scanning Notion...')
    const [
      notionTasks, notionIdeas, notionTransactions,
      notionWeed, notionEvents, notionHabits,
    ] = await Promise.all([
      fetchNotion('tasks'), fetchNotion('ideas'), fetchNotion('transactions'),
      fetchNotion('weed'), fetchNotion('events'), fetchNotion('habits'),
    ])

    addLog('Scanning Dexie (local IndexedDB)...')
    const [dexieProjects, dexieNotes, dexieSessions, dexieBlocks] = await Promise.all([
      db.projects.toArray().catch(() => []),
      db.notes.toArray().catch(() => []),
      db.pomodoroSessions.toArray().catch(() => []),
      db.timeBlocks.toArray().catch(() => []),
    ])

    const snap = {
      tasks:             notionTasks.length,
      projects:          dexieProjects.length,
      ideas:             notionIdeas.length,
      notes:             dexieNotes.length,
      transactions:      notionTransactions.length,
      habits:            notionHabits.length,
      smoking_logs:      notionWeed.length,
      calendar_events:   notionEvents.length,
      pomodoro_sessions: dexieSessions.length,
      time_blocks:       dexieBlocks.length,
    }
    setBefore(snap)
    addLog(`Found: ${notionTasks.length} tasks, ${dexieProjects.length} projects, ${notionIdeas.length} ideas, ${dexieNotes.length} notes, ${notionTransactions.length} transactions, ${notionHabits.length} habits, ${notionWeed.length} weed logs, ${notionEvents.length} events, ${dexieSessions.length} pomo sessions, ${dexieBlocks.length} time blocks`)
    setStatus('idle')
    return { notionTasks, notionIdeas, notionTransactions, notionWeed, notionEvents, notionHabits, dexieProjects, dexieNotes, dexieSessions, dexieBlocks }
  }

  async function runMigration() {
    if (!user) return
    const uid = user.id
    setStatus('migrating')
    setLog([])

    addLog('Fetching data from Notion...')
    const [
      notionTasks, notionIdeas, notionTransactions,
      notionWeed, notionEvents, notionHabits,
    ] = await Promise.all([
      fetchNotion('tasks'), fetchNotion('ideas'), fetchNotion('transactions'),
      fetchNotion('weed'), fetchNotion('events'), fetchNotion('habits'),
    ])

    addLog('Reading local Dexie data...')
    const [dexieProjects, dexieNotes, dexieSessions, dexieBlocks] = await Promise.all([
      db.projects.toArray().catch(() => []),
      db.notes.toArray().catch(() => []),
      db.pomodoroSessions.toArray().catch(() => []),
      db.timeBlocks.toArray().catch(() => []),
    ])

    // ── Map Notion pages to local format, then to Supabase rows ──

    const taskRows = notionTasks.map(notionToTask).map((t) => ({
      id: t.id, user_id: uid,
      title: t.title, notes: t.notes ?? '',
      status: t.status, priority: t.priority,
      is_mit: t.isMIT, is_frog: t.isFrog, is_quick_win: t.isQuickWin,
      due_date: t.dueDate ?? null, scheduled_date: t.scheduledDate ?? null,
      category: t.category, tags: t.tags ?? [],
      project_id: t.projectId ?? null,
      created_at: t.createdAt, completed_at: t.completedAt ?? null,
    }))

    const ideaRows = notionIdeas.map(notionToIdea).map((i) => ({
      id: i.id, user_id: uid,
      title: i.title, description: i.description ?? '',
      category: i.category, reminder_date: i.reminderDate ?? null,
      status: i.status, created_at: i.createdAt,
    }))

    const txRows = notionTransactions.map(notionToTransaction).map((t) => ({
      id: t.id, user_id: uid,
      amount: t.amount, type: t.type,
      category: t.category, description: t.description ?? '',
      date: t.date, created_at: t.createdAt,
    }))

    const weedRows = notionWeed.map(notionToWeedLog).map((l) => ({
      id: l.id, user_id: uid,
      date: l.date, time: l.time ?? '', grams: l.grams ?? 0,
      created_at: l.createdAt,
    }))

    const eventRows = notionEvents.map(notionToEvent).map((e) => ({
      id: e.id, user_id: uid,
      title: e.title, date: e.date,
      start_time: e.startTime, end_time: e.endTime,
      type: e.type ?? 'event', color: e.color ?? '#6366f1',
      description: e.description ?? '', idea_id: e.ideaId ?? null,
      created_at: e.createdAt,
    }))

    const habitRows = notionHabits.map(notionToHabit).map((h) => ({
      id: h.id, user_id: uid,
      name: h.name, description: h.description ?? '',
      frequency: h.frequency, custom_days: h.customDays ?? [],
      time_of_day: h.timeOfDay, stacked_after: h.stackedAfter ?? null,
      intention_time: h.intentionTime ?? null, intention_location: h.intentionLocation ?? null,
      color: h.color, icon: h.icon ?? 'circle',
      completions: h.completions ?? [],
      current_streak: h.currentStreak ?? 0, longest_streak: h.longestStreak ?? 0,
      created_at: h.createdAt,
    }))

    const projectRows = dexieProjects.map((p) => ({
      id: p.id, user_id: uid, name: p.name, created_at: p.createdAt,
    }))

    const noteRows = dexieNotes.map((n) => ({
      id: n.id, user_id: uid,
      title: n.title, content: n.content ?? '',
      tags: n.tags ?? [], linked_notes: n.linkedNotes ?? [],
      created_at: n.createdAt, updated_at: n.updatedAt,
    }))

    const sessionRows = dexieSessions.map((s) => ({
      id: s.id, user_id: uid,
      linked_task_id: s.linkedTaskId ?? null,
      duration: s.duration, completed_at: s.completedAt, date: s.date,
    }))

    const blockRows = dexieBlocks.map((b) => ({
      id: b.id, user_id: uid,
      title: b.title, start_time: b.startTime,
      end_time: b.endTime, date: b.date,
      color: b.color, task_id: b.taskId ?? null,
    }))

    // ── Upload ──
    const ops = [
      ['tasks',             taskRows],
      ['ideas',             ideaRows],
      ['transactions',      txRows],
      ['smoking_logs',      weedRows],
      ['calendar_events',   eventRows],
      ['habits',            habitRows],
      ['projects',          projectRows],
      ['notes',             noteRows],
      ['pomodoro_sessions', sessionRows],
      ['time_blocks',       blockRows],
    ]

    const results = {}
    for (const [table, rows] of ops) {
      addLog(`Uploading ${rows.length} rows → ${table}...`)
      const { count, error } = await upsert(table, rows)
      if (error) addLog(`  ERROR on ${table}: ${error.message}`)
      else addLog(`  OK: ${count} rows written`)
      results[table] = error ? 0 : count
    }

    // ── Read back counts from Supabase for comparison ──
    addLog('Reading back Supabase counts...')
    const afterSnap = {}
    for (const { key } of TABLES) {
      const { count } = await supabase
        .from(key)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
      afterSnap[key] = count ?? 0
    }
    setAfter(afterSnap)

    const beforeSnap = {
      tasks: taskRows.length,
      projects: projectRows.length,
      ideas: ideaRows.length,
      notes: noteRows.length,
      transactions: txRows.length,
      habits: habitRows.length,
      smoking_logs: weedRows.length,
      calendar_events: eventRows.length,
      pomodoro_sessions: sessionRows.length,
      time_blocks: blockRows.length,
    }
    setBefore(beforeSnap)

    addLog('Migration complete.')
    setStatus('done')
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'var(--font-mono)', maxWidth: '700px' }}>
      <div className="title-bar" style={{ marginBottom: '16px' }}>
        <span>■ DATA MIGRATION — Notion + Local → Supabase</span>
      </div>

      <p style={{ color: 'var(--text-dim)', fontSize: '11px', marginBottom: '16px', lineHeight: 1.7 }}>
        &gt; This migrates all existing data from Notion and local IndexedDB into Supabase.<br />
        &gt; Safe to run multiple times — uses upsert (no duplicates).<br />
        &gt; Logged in as: <span style={{ color: 'var(--neon)' }}>{user?.email}</span>
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={scanBefore}
          disabled={status === 'scanning' || status === 'migrating'}
          style={{ fontSize: '11px', opacity: status === 'scanning' ? 0.5 : 1 }}
        >
          {status === 'scanning' ? '[ SCANNING... ]' : '[ SCAN SOURCES ]'}
        </button>
        <button
          onClick={runMigration}
          disabled={status === 'migrating' || status === 'scanning'}
          style={{ fontSize: '11px', background: 'var(--neon)', color: '#000', opacity: status === 'migrating' ? 0.5 : 1 }}
        >
          {status === 'migrating' ? '[ MIGRATING... ]' : '[ RUN MIGRATION ]'}
        </button>
      </div>

      {/* Log output */}
      {log.length > 0 && (
        <div style={{
          background: '#000', border: '1px solid var(--border)',
          padding: '10px', marginBottom: '16px',
          maxHeight: '180px', overflowY: 'auto',
          fontSize: '10px', color: 'var(--neon-dim)', lineHeight: 1.6,
        }}>
          {log.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}

      {/* Comparison table */}
      {(before || after) && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr>
              {['Table', 'Source (before)', 'Supabase (after)', 'Match'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)', color: 'var(--text-dim)', fontWeight: 'normal' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABLES.map(({ label, key }) => {
              const b = before?.[key] ?? '–'
              const a = after?.[key] ?? '–'
              const match = b !== '–' && a !== '–' ? b === a : null
              return (
                <tr key={key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '5px 8px', color: 'var(--text)' }}>{label}</td>
                  <td style={{ padding: '5px 8px', color: 'var(--neon-dim)' }}>{b}</td>
                  <td style={{ padding: '5px 8px', color: 'var(--neon)' }}>{a}</td>
                  <td style={{ padding: '5px 8px' }}>
                    {match === null ? '–' : match
                      ? <span style={{ color: 'var(--neon)' }}>✓</span>
                      : <span style={{ color: 'var(--danger)' }}>✗ {a > b ? `+${a - b}` : a - b}</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {status === 'done' && (
        <p style={{ color: 'var(--neon)', fontSize: '11px', marginTop: '12px' }}>
          &gt; Migration complete. You can now use the app — all data is in Supabase.
        </p>
      )}
    </div>
  )
}
