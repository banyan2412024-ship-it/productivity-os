/**
 * supabasePersist — drop-in replacement for dexiePersist.
 *
 * Same config interface:
 *   supabasePersist(creator, { tables: { stateKey: 'dexieTableName' }, scalars: { stateKey: 'settingsKey' } })
 *
 * Tables are diff-synced: inserts/updates/deletes are sent separately (no full fetch).
 * Scalars are stored in the `user_settings` table.
 */

import { supabase } from '../lib/supabase'

// ─── Field mappers keyed by Dexie table name ─────────────────────────────────

const MAPPERS = {
  tasks: {
    table: 'tasks',
    toRow: (item, uid) => ({
      id: item.id, user_id: uid,
      title: item.title, notes: item.notes,
      status: item.status, priority: item.priority,
      is_mit: item.isMIT, is_frog: item.isFrog, is_quick_win: item.isQuickWin,
      due_date: item.dueDate, scheduled_date: item.scheduledDate,
      category: item.category, tags: item.tags ?? [],
      project_id: item.projectId ?? null,
      subfolder_id: item.subfolderId ?? null,
      description: item.description ?? '',
      difficulty: item.difficulty ?? 'normal',
      created_at: item.createdAt, completed_at: item.completedAt ?? null,
    }),
    fromRow: (row) => ({
      id: row.id, title: row.title, notes: row.notes ?? '',
      status: row.status, priority: row.priority,
      isMIT: row.is_mit, isFrog: row.is_frog, isQuickWin: row.is_quick_win,
      dueDate: row.due_date ?? null, scheduledDate: row.scheduled_date ?? null,
      category: row.category, tags: row.tags ?? [],
      projectId: row.project_id ?? null,
      subfolderId: row.subfolder_id ?? null,
      description: row.description ?? '',
      difficulty: row.difficulty ?? 'normal',
      createdAt: row.created_at, completedAt: row.completed_at ?? null,
    }),
  },

  projects: {
    table: 'projects',
    toRow: (item, uid) => ({
      id: item.id, user_id: uid, name: item.name,
      parent_id: item.parentId ?? null,
      description: item.description ?? '',
      created_at: item.createdAt,
    }),
    fromRow: (row) => ({
      id: row.id, name: row.name,
      parentId: row.parent_id ?? null,
      description: row.description ?? '',
      createdAt: row.created_at,
    }),
  },

  habits: {
    table: 'habits',
    toRow: (item, uid) => ({
      id: item.id, user_id: uid,
      name: item.name, description: item.description ?? '',
      frequency: item.frequency, custom_days: item.customDays ?? [],
      time_of_day: item.timeOfDay, stacked_after: item.stackedAfter ?? null,
      intention_time: item.intentionTime ?? null, intention_location: item.intentionLocation ?? null,
      color: item.color, icon: item.icon ?? 'circle',
      completions: item.completions ?? [],
      current_streak: item.currentStreak ?? 0, longest_streak: item.longestStreak ?? 0,
      created_at: item.createdAt,
    }),
    fromRow: (row) => ({
      id: row.id, name: row.name, description: row.description ?? '',
      frequency: row.frequency, customDays: row.custom_days ?? [],
      timeOfDay: row.time_of_day, stackedAfter: row.stacked_after ?? null,
      intentionTime: row.intention_time ?? null, intentionLocation: row.intention_location ?? null,
      color: row.color, icon: row.icon ?? 'circle',
      completions: row.completions ?? [],
      currentStreak: row.current_streak ?? 0, longestStreak: row.longest_streak ?? 0,
      createdAt: row.created_at,
    }),
  },

  notes: {
    table: 'notes',
    toRow: (item, uid) => ({
      id: item.id, user_id: uid,
      title: item.title, content: item.content ?? '',
      tags: item.tags ?? [], linked_notes: item.linkedNotes ?? [],
      created_at: item.createdAt, updated_at: item.updatedAt,
    }),
    fromRow: (row) => ({
      id: row.id, title: row.title, content: row.content ?? '',
      tags: row.tags ?? [], linkedNotes: row.linked_notes ?? [],
      createdAt: row.created_at, updatedAt: row.updated_at,
    }),
  },

  ideas: {
    table: 'ideas',
    toRow: (item, uid) => ({
      id: item.id, user_id: uid,
      title: item.title, description: item.description ?? '',
      category: item.category, reminder_date: item.reminderDate ?? null,
      status: item.status, created_at: item.createdAt,
    }),
    fromRow: (row) => ({
      id: row.id, title: row.title, description: row.description ?? '',
      category: row.category, reminderDate: row.reminder_date ?? null,
      status: row.status, createdAt: row.created_at,
    }),
  },

  transactions: {
    table: 'transactions',
    toRow: (item, uid) => ({
      id: item.id, user_id: uid,
      amount: item.amount, type: item.type,
      category: item.category, description: item.description ?? '',
      date: item.date, created_at: item.createdAt,
    }),
    fromRow: (row) => ({
      id: row.id, amount: row.amount, type: row.type,
      category: row.category, description: row.description ?? '',
      date: row.date, createdAt: row.created_at,
    }),
  },

  smokingLogs: {
    table: 'smoking_logs',
    toRow: (item, uid) => ({
      id: item.id, user_id: uid,
      date: item.date, time: item.time ?? '', grams: item.grams ?? 0,
      created_at: item.createdAt,
    }),
    fromRow: (row) => ({
      id: row.id, date: row.date, time: row.time ?? '',
      grams: row.grams ?? 0, createdAt: row.created_at,
    }),
  },

  calendarEvents: {
    table: 'calendar_events',
    toRow: (item, uid) => ({
      id: item.id, user_id: uid,
      title: item.title, date: item.date,
      start_time: item.startTime, end_time: item.endTime,
      type: item.type, color: item.color,
      description: item.description ?? '', idea_id: item.ideaId ?? null,
      created_at: item.createdAt,
    }),
    fromRow: (row) => ({
      id: row.id, title: row.title, date: row.date,
      startTime: row.start_time, endTime: row.end_time,
      type: row.type, color: row.color,
      description: row.description ?? '', ideaId: row.idea_id ?? null,
      createdAt: row.created_at,
    }),
  },

  pomodoroSessions: {
    table: 'pomodoro_sessions',
    toRow: (item, uid) => ({
      id: item.id, user_id: uid,
      linked_task_id: item.linkedTaskId ?? null,
      duration: item.duration, completed_at: item.completedAt, date: item.date,
    }),
    fromRow: (row) => ({
      id: row.id, linkedTaskId: row.linked_task_id ?? null,
      duration: row.duration, completedAt: row.completed_at, date: row.date,
    }),
  },

  timeBlocks: {
    table: 'time_blocks',
    toRow: (item, uid) => ({
      id: item.id, user_id: uid,
      title: item.title, start_time: item.startTime,
      end_time: item.endTime, date: item.date,
      color: item.color, task_id: item.taskId ?? null,
    }),
    fromRow: (row) => ({
      id: row.id, title: row.title, startTime: row.start_time,
      endTime: row.end_time, date: row.date,
      color: row.color, taskId: row.task_id ?? null,
    }),
  },
}

// ─── Module-level auth state (one listener for all stores) ───────────────────

let _userId = null
const _onSignIn = new Set()
const _onSignOut = new Set()

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
    _userId = session?.user?.id ?? null
    if (_userId) _onSignIn.forEach((fn) => fn(_userId))
  } else if (event === 'SIGNED_OUT') {
    _userId = null
    _onSignOut.forEach((fn) => fn())
  }
})

// ─── Debounce helper + flush registry ────────────────────────────────────────

const _timers = {}
const _flushFns = {}   // key → immediate-fire fn

function debounce(key, fn, ms = 800) {
  clearTimeout(_timers[key])
  _flushFns[key] = fn
  _timers[key] = setTimeout(() => {
    delete _flushFns[key]
    fn()
  }, ms)
}

// Flush all pending debounced writes immediately (called on tab hide / unload)
export function flushPendingWrites() {
  for (const [key, fn] of Object.entries(_flushFns)) {
    clearTimeout(_timers[key])
    delete _flushFns[key]
    fn()
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPendingWrites()
  })
}

// ─── Main middleware ─────────────────────────────────────────────────────────

export function supabasePersist(creator, config) {
  const { tables = {}, scalars = {} } = config

  return (set, get, api) => {
    // Snapshot of previous state per stateKey for diffing
    const prev = {}

    const store = creator(
      (...args) => {
        set(...args)
        queueMicrotask(() => persistState(get()))
      },
      get,
      api
    )

    function persistState(state) {
      if (!_userId) return

      // ── Tables (diff sync) ──
      for (const [stateKey, dexieKey] of Object.entries(tables)) {
        const mapper = MAPPERS[dexieKey]
        if (!mapper) continue
        const curr = state[stateKey]
        if (!Array.isArray(curr)) continue
        const old = prev[stateKey] ?? []
        if (curr === old) continue

        const added = curr.filter((c) => !old.find((p) => p.id === c.id))
        const updated = curr.filter((c) => {
          const p = old.find((o) => o.id === c.id)
          return p && p !== c
        })
        const deleted = old.filter((p) => !curr.find((c) => c.id === p.id))

        prev[stateKey] = curr

        const uid = _userId
        debounce(`${dexieKey}_sync`, async () => {
          try {
            const upserts = [...added, ...updated]
            if (upserts.length > 0) {
              await supabase
                .from(mapper.table)
                .upsert(upserts.map((i) => mapper.toRow(i, uid)), { onConflict: 'id' })
            }
            if (deleted.length > 0) {
              await supabase
                .from(mapper.table)
                .delete()
                .in('id', deleted.map((i) => i.id))
            }
          } catch (e) {
            console.warn(`[supabasePersist] sync ${mapper.table}:`, e.message)
          }
        }, 800)
      }

      // ── Scalars ──
      for (const [stateKey, settingsKey] of Object.entries(scalars)) {
        const value = state[stateKey]
        if (value === (prev[`scalar_${stateKey}`] ?? undefined)) continue
        prev[`scalar_${stateKey}`] = value
        const uid = _userId
        debounce(`scalar_${settingsKey}`, async () => {
          try {
            await supabase
              .from('user_settings')
              .upsert({ user_id: uid, key: settingsKey, value }, { onConflict: 'user_id,key' })
          } catch (e) {
            console.warn(`[supabasePersist] scalar ${settingsKey}:`, e.message)
          }
        }, 800)
      }
    }

    async function hydrate(uid) {
      try {
        const patch = {}

        // Tables
        for (const [stateKey, dexieKey] of Object.entries(tables)) {
          const mapper = MAPPERS[dexieKey]
          if (!mapper) continue
          const { data, error } = await supabase
            .from(mapper.table)
            .select('*')
            .eq('user_id', uid)
          if (!error && data) {
            patch[stateKey] = data.map(mapper.fromRow)
            prev[stateKey] = patch[stateKey]
          }
        }

        // Scalars
        if (Object.keys(scalars).length > 0) {
          const keys = Object.values(scalars)
          const { data } = await supabase
            .from('user_settings')
            .select('key, value')
            .eq('user_id', uid)
            .in('key', keys)
          if (data) {
            const byKey = Object.fromEntries(data.map((r) => [r.key, r.value]))
            for (const [stateKey, settingsKey] of Object.entries(scalars)) {
              if (byKey[settingsKey] !== undefined) {
                patch[stateKey] = byKey[settingsKey]
                prev[`scalar_${stateKey}`] = byKey[settingsKey]
              }
            }
          }
        }

        set(patch)
      } catch (e) {
        console.warn('[supabasePersist] hydrate error:', e.message)
      }
    }

    function clearState() {
      const patch = {}
      for (const stateKey of Object.keys(tables)) patch[stateKey] = []
      for (const stateKey of Object.keys(scalars)) delete prev[`scalar_${stateKey}`]
      set(patch)
    }

    // Register callbacks
    _onSignIn.add(hydrate)
    _onSignOut.add(clearState)

    // Hydrate immediately if already signed in
    if (_userId) hydrate(_userId)

    return store
  }
}
