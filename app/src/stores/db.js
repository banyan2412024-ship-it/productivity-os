import Dexie from 'dexie'

export const db = new Dexie('ProductivityOS')

db.version(1).stores({
  notes: 'id, title, updatedAt, *tags',
  tasks: 'id, status, priority, projectId, dueDate, scheduledDate, isMIT, isFrog, isQuickWin',
  projects: 'id',
  habits: 'id, frequency, timeOfDay, stackedAfter',
  pomodoroSessions: 'id, date, linkedTaskId',
  timeBlocks: 'id, date',
  settings: 'key',
})

db.version(2).stores({
  notes: 'id, title, updatedAt, *tags',
  tasks: 'id, status, priority, projectId, dueDate, scheduledDate, isMIT, isFrog, isQuickWin, category',
  projects: 'id',
  habits: 'id, frequency, timeOfDay, stackedAfter',
  pomodoroSessions: 'id, date, linkedTaskId',
  timeBlocks: 'id, date',
  settings: 'key',

  // Calendar events
  calendarEvents: 'id, date, startTime, type',

  // Idea bank
  ideas: 'id, category, reminderDate, createdAt',

  // Money tracker
  transactions: 'id, date, type, category',

  // Smoking tracker
  smokingLogs: 'id, date',
})

db.version(3).stores({
  notes: 'id, title, updatedAt, *tags',
  tasks: 'id, status, priority, projectId, subfolderId, dueDate, scheduledDate, isMIT, isFrog, isQuickWin, category',
  projects: 'id, parentId',
  habits: 'id, frequency, timeOfDay, stackedAfter',
  pomodoroSessions: 'id, date, linkedTaskId',
  timeBlocks: 'id, date',
  settings: 'key',
  calendarEvents: 'id, date, startTime, type',
  ideas: 'id, category, reminderDate, createdAt',
  transactions: 'id, date, type, category',
  smokingLogs: 'id, date',
})

// ─── Generic helpers ────────────────────────────────────────────────────────

/** Bulk-put an array of items into a table, returns when done */
export async function putAll(table, items) {
  return db[table].bulkPut(items)
}

/** Put a single item */
export async function putOne(table, item) {
  return db[table].put(item)
}

/** Delete by id */
export async function deleteOne(table, id) {
  return db[table].delete(id)
}

/** Get all rows from a table */
export async function getAll(table) {
  return db[table].toArray()
}

/** Get one row by id */
export async function getOne(table, id) {
  return db[table].get(id)
}

/** Clear a table */
export async function clearTable(table) {
  return db[table].clear()
}
