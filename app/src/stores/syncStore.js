import { create } from 'zustand'
import {
  checkNotionConnection,
  notionCreate,
  notionUpdate,
  notionDelete,
  fetchAllFromNotion,
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
const CACHE_KEY = 'notion-page-ids'
function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } catch { return {} }
}
function saveCache(cache) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

let pageIdCache = loadCache()

// Flag to prevent auto-push while we're loading data from Notion
let isPulling = false

export const useSyncStore = create((set, get) => ({
  connected: false,
  syncing: false,
  pulling: false,
  lastSync: null,
  lastPull: null,
  pendingOps: 0,
  error: null,

  // Check connection to Express → Notion
  checkConnection: async () => {
    const result = await checkNotionConnection()
    set({ connected: result.connected, error: result.connected ? null : result.error })
    return result.connected
  },

  // ── PULL: fetch all data from Notion and replace local stores ──

  pullFromNotion: async () => {
    set({ pulling: true, error: null })
    isPulling = true
    try {
      const data = await fetchAllFromNotion()

      // Update pageIdCache with Notion page IDs
      const cacheUpdates = (items) => {
        if (!items) return
        for (const item of items) {
          if (item._notionPageId && item.id) {
            pageIdCache[item.id] = item._notionPageId
          }
        }
      }
      cacheUpdates(data.tasks)
      cacheUpdates(data.ideas)
      cacheUpdates(data.transactions)
      cacheUpdates(data.weedLogs)
      cacheUpdates(data.events)
      cacheUpdates(data.habits)
      saveCache(pageIdCache)

      // Replace local stores with Notion data ONLY if Notion has records.
      // If Notion returns empty, keep local data (avoids wiping on first setup).
      if (data.tasks?.length > 0) {
        const clean = data.tasks.map(({ _notionPageId, ...rest }) => rest)
        useTaskStore.setState({ tasks: clean })
      }
      if (data.ideas?.length > 0) {
        const clean = data.ideas.map(({ _notionPageId, ...rest }) => rest)
        useIdeaStore.setState({ ideas: clean })
      }
      if (data.transactions?.length > 0) {
        const clean = data.transactions.map(({ _notionPageId, ...rest }) => rest)
        useMoneyStore.setState({ transactions: clean })
      }
      if (data.weedLogs?.length > 0) {
        const clean = data.weedLogs.map(({ _notionPageId, ...rest }) => rest)
        useWeedStore.setState({ smokingLogs: clean })
      }
      if (data.events?.length > 0) {
        const clean = data.events.map(({ _notionPageId, ...rest }) => rest)
        useCalendarStore.setState({ calendarEvents: clean })
      }
      if (data.habits?.length > 0) {
        // Merge: keep local completions for habits that exist in Notion
        const localHabits = useHabitStore.getState().habits
        const merged = data.habits.map(({ _notionPageId, ...h }) => {
          const local = localHabits.find((lh) => lh.id === h.id)
          return { ...h, completions: local?.completions || h.completions || [] }
        })
        useHabitStore.setState({ habits: merged })
      }

      // Update prev snapshots so auto-push doesn't re-push what we just pulled
      prevTasks = useTaskStore.getState().tasks
      prevIdeas = useIdeaStore.getState().ideas
      prevTxs = useMoneyStore.getState().transactions
      prevLogs = useWeedStore.getState().smokingLogs
      prevEvents = useCalendarStore.getState().calendarEvents
      prevHabits = useHabitStore.getState().habits

      set({ pulling: false, lastPull: new Date().toISOString() })
      return data
    } catch (e) {
      set({ pulling: false, error: e.message })
      throw e
    } finally {
      isPulling = false
    }
  },

  // ── Real-time push helpers (fire-and-forget, non-blocking) ──

  pushCreate: (table, localId, mapper, item) => {
    if (!get().connected || isPulling) return
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
    if (!get().connected || isPulling) return
    const notionPageId = pageIdCache[localId]
    if (!notionPageId) return
    set((s) => ({ pendingOps: s.pendingOps + 1 }))
    notionUpdate(table, notionPageId, mapper(item))
      .catch((e) => console.warn(`Notion push update ${table} failed:`, e.message))
      .finally(() => set((s) => ({ pendingOps: s.pendingOps - 1 })))
  },

  pushDelete: (table, localId) => {
    if (!get().connected || isPulling) return
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

      // Inject cached Notion page IDs so bulk sync updates existing pages
      // instead of creating duplicates on every call
      const withPageId = (items) => items.map((item) => ({
        ...item,
        notionPageId: pageIdCache[item.id] || null,
      }))

      const results = await syncAll({
        tasks: withPageId(tasks),
        ideas: withPageId(ideas),
        transactions: withPageId(transactions),
        weedLogs: withPageId(weedLogs),
        events: withPageId(events),
        habits: withPageId(habits),
      })

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

// ─── Auto-pull on startup: fetch from Notion when connected ─────────────────

async function initPull() {
  const { checkConnection, pullFromNotion, syncAll: pushAll } = useSyncStore.getState()
  const connected = await checkConnection()
  if (connected) {
    try {
      await pullFromNotion()
      console.log('[Notion] Data loaded from Notion (source of truth)')
      // After pull, push any local data that Notion didn't have (first-time setup)
      await pushAll()
      console.log('[Notion] Local data pushed to Notion')
    } catch (e) {
      console.warn('[Notion] Sync failed, using local cache:', e.message)
    }
  } else {
    console.log('[Notion] Offline — using local cache')
  }
}

// Delay init: let Dexie hydrate first, then pull from Notion,
// then push any local data that Notion doesn't have yet.
setTimeout(initPull, 1500)

// ─── Auto-push: subscribe to each store and push changes ─────────────────

let prevTasks = useTaskStore.getState().tasks
useTaskStore.subscribe((state) => {
  if (isPulling) { prevTasks = state.tasks; return }
  const { pushCreate, pushUpdate, pushDelete, connected } = useSyncStore.getState()
  if (!connected) { prevTasks = state.tasks; return }

  const curr = state.tasks
  for (const t of curr) {
    if (!prevTasks.find((p) => p.id === t.id)) pushCreate('tasks', t.id, taskToNotion, t)
  }
  for (const p of prevTasks) {
    if (!curr.find((t) => t.id === p.id)) pushDelete('tasks', p.id)
  }
  for (const t of curr) {
    const prev = prevTasks.find((p) => p.id === t.id)
    if (prev && prev !== t) pushUpdate('tasks', t.id, taskToNotion, t)
  }
  prevTasks = curr
})

let prevIdeas = useIdeaStore.getState().ideas
useIdeaStore.subscribe((state) => {
  if (isPulling) { prevIdeas = state.ideas; return }
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
  if (isPulling) { prevTxs = state.transactions; return }
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
  if (isPulling) { prevLogs = state.smokingLogs; return }
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
  if (isPulling) { prevEvents = state.calendarEvents; return }
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
  if (isPulling) { prevHabits = state.habits; return }
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
