/**
 * Notion Sync Layer
 *
 * - Single-item CRUD: pushes each add/update/delete to Notion in real-time
 * - Bulk sync: pushes all local data at once
 * - PULL: fetches all data FROM Notion (source of truth)
 * - Property mappers: local ↔ Notion (bidirectional)
 * - Calls the Express proxy server at /api/*
 */

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// ─── Property mappers: local → Notion ───────────────────────────────────────

export function taskToNotion(task) {
  return {
    Name: { title: [{ text: { content: task.title || '' } }] },
    Status: { select: { name: task.status || 'inbox' } },
    Priority: { select: { name: task.priority || 'medium' } },
    Category: { select: { name: task.category || 'Other' } },
    'Is MIT': { checkbox: !!task.isMIT },
    'Is Frog': { checkbox: !!task.isFrog },
    'Quick Win': { checkbox: !!task.isQuickWin },
    ...(task.dueDate ? { 'Due Date': { date: { start: task.dueDate.split('T')[0] } } } : {}),
    Notes: { rich_text: [{ text: { content: task.notes || '' } }] },
    'Local ID': { rich_text: [{ text: { content: task.id } }] },
  }
}

export function ideaToNotion(idea) {
  return {
    Name: { title: [{ text: { content: idea.title || '' } }] },
    Category: { select: { name: idea.category || 'Other' } },
    Description: { rich_text: [{ text: { content: idea.description || '' } }] },
    Status: { select: { name: idea.status || 'active' } },
    ...(idea.reminderDate ? { 'Reminder Date': { date: { start: idea.reminderDate } } } : {}),
    'Local ID': { rich_text: [{ text: { content: idea.id } }] },
  }
}

export function transactionToNotion(tx) {
  return {
    Name: { title: [{ text: { content: tx.description || tx.category || '' } }] },
    Amount: { number: tx.amount || 0 },
    Type: { select: { name: tx.type || 'expense' } },
    Category: { select: { name: tx.category || 'Other' } },
    Date: { date: { start: tx.date } },
    'Local ID': { rich_text: [{ text: { content: tx.id } }] },
  }
}

export function weedLogToNotion(log) {
  return {
    Name: { title: [{ text: { content: `${log.grams}g at ${log.time}` } }] },
    Grams: { number: log.grams || 0 },
    Date: { date: { start: log.date } },
    Time: { rich_text: [{ text: { content: log.time || '' } }] },
    'Local ID': { rich_text: [{ text: { content: log.id } }] },
  }
}

export function eventToNotion(event) {
  return {
    Name: { title: [{ text: { content: event.title || '' } }] },
    Date: { date: { start: event.date } },
    'Start Time': { rich_text: [{ text: { content: event.startTime || '' } }] },
    'End Time': { rich_text: [{ text: { content: event.endTime || '' } }] },
    'Local ID': { rich_text: [{ text: { content: event.id } }] },
  }
}

export function habitToNotion(habit) {
  return {
    Name: { title: [{ text: { content: habit.name || '' } }] },
    Frequency: { select: { name: habit.frequency || 'daily' } },
    'Time of Day': { select: { name: habit.timeOfDay || 'anytime' } },
    Color: { rich_text: [{ text: { content: habit.color || '#00ff41' } }] },
    'Current Streak': { number: habit.currentStreak || 0 },
    'Longest Streak': { number: habit.longestStreak || 0 },
    'Local ID': { rich_text: [{ text: { content: habit.id } }] },
  }
}

// ─── Reverse mappers: Notion → local ────────────────────────────────────────

function getTitle(props, key = 'Name') {
  return props[key]?.title?.[0]?.text?.content || ''
}
function getRichText(props, key) {
  return props[key]?.rich_text?.[0]?.text?.content || ''
}
function getSelect(props, key) {
  return props[key]?.select?.name || ''
}
function getCheckbox(props, key) {
  return !!props[key]?.checkbox
}
function getNumber(props, key) {
  return props[key]?.number || 0
}
function getDate(props, key) {
  return props[key]?.date?.start || ''
}

export function notionToTask(page) {
  const p = page.properties
  return {
    id: getRichText(p, 'Local ID') || page.id,
    title: getTitle(p),
    status: getSelect(p, 'Status') || 'inbox',
    priority: getSelect(p, 'Priority') || 'medium',
    category: getSelect(p, 'Category') || 'Other',
    isMIT: getCheckbox(p, 'Is MIT'),
    isFrog: getCheckbox(p, 'Is Frog'),
    isQuickWin: getCheckbox(p, 'Quick Win'),
    dueDate: getDate(p, 'Due Date') || null,
    scheduledDate: null,
    notes: getRichText(p, 'Notes'),
    tags: [],
    projectId: null,
    createdAt: page.created_time || new Date().toISOString(),
    completedAt: null,
    _notionPageId: page.id,
  }
}

export function notionToIdea(page) {
  const p = page.properties
  return {
    id: getRichText(p, 'Local ID') || page.id,
    title: getTitle(p),
    category: getSelect(p, 'Category') || 'Other',
    description: getRichText(p, 'Description'),
    status: getSelect(p, 'Status') || 'active',
    reminderDate: getDate(p, 'Reminder Date') || null,
    createdAt: page.created_time || new Date().toISOString(),
    _notionPageId: page.id,
  }
}

export function notionToTransaction(page) {
  const p = page.properties
  return {
    id: getRichText(p, 'Local ID') || page.id,
    description: getTitle(p),
    amount: getNumber(p, 'Amount'),
    type: getSelect(p, 'Type') || 'expense',
    category: getSelect(p, 'Category') || 'Other',
    date: getDate(p, 'Date'),
    createdAt: page.created_time || new Date().toISOString(),
    _notionPageId: page.id,
  }
}

export function notionToWeedLog(page) {
  const p = page.properties
  return {
    id: getRichText(p, 'Local ID') || page.id,
    grams: getNumber(p, 'Grams'),
    date: getDate(p, 'Date'),
    time: getRichText(p, 'Time'),
    createdAt: page.created_time || new Date().toISOString(),
    _notionPageId: page.id,
  }
}

export function notionToEvent(page) {
  const p = page.properties
  return {
    id: getRichText(p, 'Local ID') || page.id,
    title: getTitle(p),
    date: getDate(p, 'Date'),
    startTime: getRichText(p, 'Start Time'),
    endTime: getRichText(p, 'End Time'),
    color: '#00ff41',
    createdAt: page.created_time || new Date().toISOString(),
    _notionPageId: page.id,
  }
}

export function notionToHabit(page) {
  const p = page.properties
  return {
    id: getRichText(p, 'Local ID') || page.id,
    name: getTitle(p),
    frequency: getSelect(p, 'Frequency') || 'daily',
    timeOfDay: getSelect(p, 'Time of Day') || 'anytime',
    color: getRichText(p, 'Color') || '#00ff41',
    currentStreak: getNumber(p, 'Current Streak'),
    longestStreak: getNumber(p, 'Longest Streak'),
    completions: [],
    customDays: [],
    description: '',
    stackedAfter: null,
    intentionTime: null,
    intentionLocation: null,
    icon: '',
    createdAt: page.created_time || new Date().toISOString(),
    _notionPageId: page.id,
  }
}

// ─── Fetch from Notion (PULL) ───────────────────────────────────────────────

async function fetchTable(table) {
  const res = await fetch(`${API}/${table}`)
  if (!res.ok) throw new Error(`Fetch ${table} failed: ${res.statusText}`)
  const data = await res.json()
  return data.results || []
}

export async function fetchTasks() {
  const pages = await fetchTable('tasks')
  return pages.map(notionToTask)
}

export async function fetchIdeas() {
  const pages = await fetchTable('ideas')
  return pages.map(notionToIdea)
}

export async function fetchTransactions() {
  const pages = await fetchTable('transactions')
  return pages.map(notionToTransaction)
}

export async function fetchWeedLogs() {
  const pages = await fetchTable('weed')
  return pages.map(notionToWeedLog)
}

export async function fetchEvents() {
  const pages = await fetchTable('events')
  return pages.map(notionToEvent)
}

export async function fetchHabits() {
  const pages = await fetchTable('habits')
  return pages.map(notionToHabit)
}

export async function fetchAllFromNotion() {
  const results = {}
  const ops = [
    fetchTasks().then((r) => { results.tasks = r }).catch(() => { results.tasks = null }),
    fetchIdeas().then((r) => { results.ideas = r }).catch(() => { results.ideas = null }),
    fetchTransactions().then((r) => { results.transactions = r }).catch(() => { results.transactions = null }),
    fetchWeedLogs().then((r) => { results.weedLogs = r }).catch(() => { results.weedLogs = null }),
    fetchEvents().then((r) => { results.events = r }).catch(() => { results.events = null }),
    fetchHabits().then((r) => { results.habits = r }).catch(() => { results.habits = null }),
  ]
  await Promise.allSettled(ops)
  return results
}

// ─── Single-item CRUD (real-time push) ──────────────────────────────────────

export async function notionCreate(table, properties) {
  const res = await fetch(`${API}/${table}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties }),
  })
  if (!res.ok) throw new Error(`Create ${table} failed: ${res.statusText}`)
  const data = await res.json()
  return data.id // Notion page ID
}

export async function notionUpdate(table, notionPageId, properties) {
  const res = await fetch(`${API}/${table}/${notionPageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties }),
  })
  if (!res.ok) throw new Error(`Update ${table} failed: ${res.statusText}`)
  return res.json()
}

export async function notionDelete(table, notionPageId) {
  const res = await fetch(`${API}/${table}/${notionPageId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Delete ${table} failed: ${res.statusText}`)
  return res.json()
}

// ─── Bulk sync (push) ───────────────────────────────────────────────────────

async function syncTable(table, items, mapper) {
  const mapped = items.map((item) => ({
    id: item.id,
    notionPageId: item.notionPageId || null,
    properties: mapper(item),
  }))
  const res = await fetch(`${API}/sync/${table}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: mapped }),
  })
  if (!res.ok) throw new Error(`Sync ${table} failed: ${res.statusText}`)
  return res.json()
}

export async function syncTasks(tasks) { return syncTable('tasks', tasks, taskToNotion) }
export async function syncIdeas(ideas) { return syncTable('ideas', ideas, ideaToNotion) }
export async function syncTransactions(txs) { return syncTable('transactions', txs, transactionToNotion) }
export async function syncWeedLogs(logs) { return syncTable('weed', logs, weedLogToNotion) }
export async function syncEvents(events) { return syncTable('events', events, eventToNotion) }
export async function syncHabits(habits) { return syncTable('habits', habits, habitToNotion) }

export async function syncAll({ tasks, ideas, transactions, weedLogs, events, habits }) {
  const results = {}
  const ops = []
  if (tasks?.length) ops.push(syncTasks(tasks).then((r) => { results.tasks = r }))
  if (ideas?.length) ops.push(syncIdeas(ideas).then((r) => { results.ideas = r }))
  if (transactions?.length) ops.push(syncTransactions(transactions).then((r) => { results.transactions = r }))
  if (weedLogs?.length) ops.push(syncWeedLogs(weedLogs).then((r) => { results.weed = r }))
  if (events?.length) ops.push(syncEvents(events).then((r) => { results.events = r }))
  if (habits?.length) ops.push(syncHabits(habits).then((r) => { results.habits = r }))
  await Promise.allSettled(ops)
  return results
}

// ─── Health check ───────────────────────────────────────────────────────────

export async function checkNotionConnection() {
  try {
    const res = await fetch(`${API}/health`)
    if (!res.ok) return { connected: false, error: 'Server unreachable' }
    const data = await res.json()
    return { connected: data.notion === 'connected' || data.notion === 'configured', ...data }
  } catch {
    return { connected: false, error: 'Server not running' }
  }
}
