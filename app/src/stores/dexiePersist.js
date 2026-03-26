import { db } from './db'

/**
 * Zustand middleware that syncs store state to Dexie IndexedDB.
 *
 * Usage:
 *   create(dexiePersist(storeCreator, { tables: { tasks: 'tasks', projects: 'projects' }, scalars: { key: 'pomodoroSettings' } }))
 *
 * - `tables`: { stateKey: dexieTableName } — arrays of objects with `id`, bulk-synced
 * - `scalars`: { stateKey: settingsKey }   — primitive/object values stored in the `settings` table
 */
export function dexiePersist(creator, config) {
  const { tables = {}, scalars = {} } = config

  return (set, get, api) => {
    // Create the base store
    const store = creator(
      // Wrap set to persist on every state change
      (...args) => {
        set(...args)
        // After state is updated, persist asynchronously
        queueMicrotask(() => persistState(get()))
      },
      get,
      api
    )

    // Persist current state to IndexedDB
    async function persistState(state) {
      try {
        const ops = []

        // Sync array tables
        for (const [stateKey, tableName] of Object.entries(tables)) {
          const items = state[stateKey]
          if (Array.isArray(items)) {
            // Get current IDs in DB
            const dbIds = new Set(await db[tableName].toCollection().primaryKeys())
            const stateIds = new Set(items.map((i) => i.id))

            // Delete removed items
            const toDelete = [...dbIds].filter((id) => !stateIds.has(id))
            if (toDelete.length > 0) {
              ops.push(db[tableName].bulkDelete(toDelete))
            }

            // Put all current items (upsert)
            if (items.length > 0) {
              ops.push(db[tableName].bulkPut(items))
            }
          }
        }

        // Sync scalar values
        for (const [stateKey, settingsKey] of Object.entries(scalars)) {
          const value = state[stateKey]
          ops.push(db.settings.put({ key: settingsKey, value }))
        }

        await Promise.all(ops)
      } catch (err) {
        console.error('[dexiePersist] write error:', err)
      }
    }

    // Hydrate from IndexedDB on init
    async function hydrate() {
      try {
        const patch = {}

        // Load arrays
        for (const [stateKey, tableName] of Object.entries(tables)) {
          patch[stateKey] = await db[tableName].toArray()
        }

        // Load scalars
        for (const [stateKey, settingsKey] of Object.entries(scalars)) {
          const row = await db.settings.get(settingsKey)
          if (row !== undefined) {
            patch[stateKey] = row.value
          }
        }

        set(patch)
      } catch (err) {
        console.error('[dexiePersist] hydrate error:', err)
      }
    }

    // Kick off hydration immediately
    hydrate()

    return store
  }
}
