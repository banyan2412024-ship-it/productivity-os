import { create } from 'zustand'
import {
  checkNotionConnection,
  notionCreate,
  notionUpdate,
  notionDelete,
  taskToNotion,
  ideaToNotion,
  transactionToNotion,
  weedLogToNotion,
  eventToNotion,
  habitToNotion,
  syncAll,
} from './notionSync'
import { useTaskStore } from './taskStore'
import { useIdeaStore } from './ideaStore'
import { useMoneyStore } from './moneyStore'
import { useWeedStore } from './smokingStore'
import { useCalendarStore } from './calendarStore'
import { useHabitStore } from './habitStore'

// Notion page ID cache: localId → notionPageId
// Persisted in localStorage so undo → re-add can update instead of duplicate
const CACHE_KEY = 'notion-page-ids'
function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } catch { return {} }
}
function saveCache(cache) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

let pageIdCache = loadCache()

export const useSyncStore = create((set, get) => ({
  connected: false,
  syncing: false,
  lastSync: null,
  pendingOps: 0,
  error: null,

  // Check connection to Express → Notion
  checkConnection: async () => {
    const result = await checkNotionConnection()
    set({ connected: result.connected, error: result.connected ? null : result.error })
    return result.connected
  },

  // ── Real-time push helpers (fire-and-forget, non-blocking) ──

  pushCreate: (table, localId, mapper, item) => {
    if (!get().connected) return
    set((s) => ({ pendingOps: s.pendingOps + 1 }))
    notionCreate(table, mapper(item))
      .then((notionPageId) => {
        pageIdCache[localId] = notionPageId
        saveCache(pageIdCache)
      })
      .catch((e) => console.warn(`Notion push create ${table} failed:`, e.message))
      .finally(() => set((s) => ({ pendingOps: s.pendingOps - 1 })))
  },

  pushUpdate: (table, localId, mapper, item) => {
    if (!get().connected) return
    const notionPageId = pageIdCache[localId]
    if (!notionPageId) return // never synced yet, skip
    set((s) => ({ pendingOps: s.pendingOps + 1 }))
    notionUpdate(table, notionPageId, mapper(item))
      .catch((e) => console.warn(`Notion push update ${table} failed:`, e.message))
      .finally(() => set((s) => ({ pendingOps: s.pendingOps - 1 })))
  },

  pushDelete: (table, localId) => {
    if (!get().connected) return
    const notionPageId = pageIdCache[localId]
    if (!notionPageId) return
    set((s) => ({ pendingOps: s.pendingOps + 1 }))
    notionDelete(table, notionPageId)
      .then(() => {
        delete pageIdCache[localId]
        saveCache(pageIdCache)
      })
      .catch((e) => console.warn(`Notion push delete ${table} failed:`, e.message))
      .finally(() => set((s) => ({ pendingOps: s.pendingOps - 1 })))
  },

  // ── Full sync: push everything to Notion ──

  syncAll: async () => {
    set({ syncing: true, error: null })
    try {
      const tasks = useTaskStore.getState().tasks
      const ideas = useIdeaStore.getState().ideas
      const transactions = useMoneyStore.getState().transactions
      const weedLogs = useWeedStore.getState().smokingLogs
      const events = useCalendarStore.getState().calendarEvents
      const habits = useHabitStore.getState().habits

      const results = await syncAll({ tasks, ideas, transactions, weedLogs, events, habits })

      // Cache all returned Notion page IDs
      for (const table of Object.values(results)) {
        if (table?.results) {
          for (const r of table.results) {
            if (r.localId && r.notionPageId) {
              pageIdCache[r.localId] = r.notionPageId
            }
          }
        }
      }
      saveCache(pageIdCache)

      set({ syncing: false, lastSync: new Date().toISOString() })
      return results
    } catch (e) {
      set({ syncing: false, error: e.message })
      throw e
    }
  },
}))

// ─── Auto-push: subscribe to each store and push changes ─────────────────

let prevTasks = useTaskStore.getState().tasks
useTaskStore.subscribe((state) => {
  const { pushCreate, pushUpdate, pushDelete, connected } = useSyncStore.getState()
  if (!connected) { prevTasks = state.tasks; return }

  const curr = state.tasks
  // New items
  for (const t of curr) {
    if (!prevTasks.find((p) => p.id === t.id)) {
      pushCreate('tasks', t.id, taskToNotion, t)
    }
  }
  // Deleted items
  for (const p of prevTasks) {
    if (!curr.find((t) => t.id === p.id)) {
      pushDelete('tasks', p.id)
    }
  }
  // Updated items
  for (const t of curr) {
    const prev = prevTasks.find((p) => p.id === t.id)
    if (prev && prev !== t) {
      pushUpdate('tasks', t.id, taskToNotion, t)
    }
  }
  prevTasks = curr
})

let prevIdeas = useIdeaStore.getState().ideas
useIdeaStore.subscribe((state) => {
  const { pushCreate, pushUpdate, pushDelete, connected } = useSyncStore.getState()
  if (!connected) { prevIdeas = state.ideas; return }

  const curr = state.ideas
  for (const i of curr) {
    if (!prevIdeas.find((p) => p.id === i.id)) pushCreate('ideas', i.id, ideaToNotion, i)
  }
  for (const p of prevIdeas) {
    if (!curr.find((i) => i.id === p.id)) pushDelete('ideas', p.id)
  }
  for (const i of curr) {
    const prev = prevIdeas.find((p) => p.id === i.id)
    if (prev && prev !== i) pushUpdate('ideas', i.id, ideaToNotion, i)
  }
  prevIdeas = curr
})

let prevTxs = useMoneyStore.getState().transactions
useMoneyStore.subscribe((state) => {
  const { pushCreate, pushDelete, connected } = useSyncStore.getState()
  if (!connected) { prevTxs = state.transactions; return }

  const curr = state.transactions
  for (const t of curr) {
    if (!prevTxs.find((p) => p.id === t.id)) pushCreate('transactions', t.id, transactionToNotion, t)
  }
  for (const p of prevTxs) {
    if (!curr.find((t) => t.id === p.id)) pushDelete('transactions', p.id)
  }
  prevTxs = curr
})

let prevLogs = useWeedStore.getState().smokingLogs
useWeedStore.subscribe((state) => {
  const { pushCreate, pushDelete, connected } = useSyncStore.getState()
  if (!connected) { prevLogs = state.smokingLogs; return }

  const curr = state.smokingLogs
  for (const l of curr) {
    if (!prevLogs.find((p) => p.id === l.id)) pushCreate('weed', l.id, weedLogToNotion, l)
  }
  for (const p of prevLogs) {
    if (!curr.find((l) => l.id === p.id)) pushDelete('weed', p.id)
  }
  prevLogs = curr
})

let prevEvents = useCalendarStore.getState().calendarEvents
useCalendarStore.subscribe((state) => {
  const { pushCreate, pushUpdate, pushDelete, connected } = useSyncStore.getState()
  if (!connected) { prevEvents = state.calendarEvents; return }

  const curr = state.calendarEvents
  for (const e of curr) {
    if (!prevEvents.find((p) => p.id === e.id)) pushCreate('events', e.id, eventToNotion, e)
  }
  for (const p of prevEvents) {
    if (!curr.find((e) => e.id === p.id)) pushDelete('events', p.id)
  }
  for (const e of curr) {
    const prev = prevEvents.find((p) => p.id === e.id)
    if (prev && prev !== e) pushUpdate('events', e.id, eventToNotion, e)
  }
  prevEvents = curr
})

let prevHabits = useHabitStore.getState().habits
useHabitStore.subscribe((state) => {
  const { pushCreate, pushUpdate, pushDelete, connected } = useSyncStore.getState()
  if (!connected) { prevHabits = state.habits; return }

  const curr = state.habits
  for (const h of curr) {
    if (!prevHabits.find((p) => p.id === h.id)) pushCreate('habits', h.id, habitToNotion, h)
  }
  for (const p of prevHabits) {
    if (!curr.find((h) => h.id === p.id)) pushDelete('habits', p.id)
  }
  for (const h of curr) {
    const prev = prevHabits.find((p) => p.id === h.id)
    if (prev && prev !== h) pushUpdate('habits', h.id, habitToNotion, h)
  }
  prevHabits = curr
})
