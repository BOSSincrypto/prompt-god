import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

/* -------------------------------------------------------------------------- */
/* localStorage                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Storage throws in Safari private mode and when a site is blocked from
 * storing data. Losing preferences is acceptable; crashing the app is not.
 */
export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeLocal(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota or private mode — preferences simply do not persist */
  }
}

export function removeLocal(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/* -------------------------------------------------------------------------- */
/* IndexedDB                                                                  */
/* -------------------------------------------------------------------------- */

export interface HistoryEntry {
  id: string
  createdAt: number
  prompt: string
  score: number
  issueCount: number
  modelFamily: string
  title: string
}

/** Credentials live in IndexedDB so they stay out of the synchronous prefs blob. */
export interface StoredCredential {
  provider: string
  apiKey: string
  model: string
  baseUrl?: string
}

interface PromptGodDB extends DBSchema {
  kv: {
    key: string
    value: unknown
  }
  history: {
    key: string
    value: HistoryEntry
    indexes: { byCreatedAt: number }
  }
  credentials: {
    key: string
    value: StoredCredential
  }
}

const DB_NAME = 'prompt-god'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<PromptGodDB>> | null = null

function getDB(): Promise<IDBPDatabase<PromptGodDB>> {
  dbPromise ??= openDB<PromptGodDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv')
      if (!db.objectStoreNames.contains('history')) {
        const store = db.createObjectStore('history', { keyPath: 'id' })
        store.createIndex('byCreatedAt', 'createdAt')
      }
      if (!db.objectStoreNames.contains('credentials')) {
        db.createObjectStore('credentials', { keyPath: 'provider' })
      }
    },
    blocked() {
      console.warn('[prompt-god] another tab is holding an older database version open')
    },
  })
  return dbPromise
}

/**
 * Every accessor swallows IndexedDB failures. A browser with storage disabled
 * gets a fully working, session-only app rather than an error screen.
 */
async function safely<T>(work: (db: IDBPDatabase<PromptGodDB>) => Promise<T>, fallback: T) {
  try {
    return await work(await getDB())
  } catch (error) {
    console.warn('[prompt-god] storage unavailable', error)
    return fallback
  }
}

export const kv = {
  get: <T>(key: string, fallback: T) =>
    safely(async (db) => {
      const value = await db.get('kv', key)
      return value === undefined ? fallback : (value as T)
    }, fallback),
  set: (key: string, value: unknown) =>
    safely(async (db) => {
      await db.put('kv', value, key)
      return true
    }, false),
  delete: (key: string) =>
    safely(async (db) => {
      await db.delete('kv', key)
      return true
    }, false),
}

const HISTORY_LIMIT = 100

export const history = {
  list: () =>
    safely<HistoryEntry[]>(async (db) => {
      const all = await db.getAllFromIndex('history', 'byCreatedAt')
      return all.reverse()
    }, []),

  add: (entry: HistoryEntry) =>
    safely(async (db) => {
      await db.put('history', entry)
      // Trim oldest beyond the cap so the store cannot grow without bound.
      const keys = await db.getAllKeysFromIndex('history', 'byCreatedAt')
      const excess = keys.length - HISTORY_LIMIT
      if (excess > 0) {
        const tx = db.transaction('history', 'readwrite')
        await Promise.all([...keys.slice(0, excess).map((key) => tx.store.delete(key)), tx.done])
      }
      return true
    }, false),

  remove: (id: string) =>
    safely(async (db) => {
      await db.delete('history', id)
      return true
    }, false),

  clear: () =>
    safely(async (db) => {
      await db.clear('history')
      return true
    }, false),
}

export const credentials = {
  get: (provider: string) =>
    safely<StoredCredential | null>(
      async (db) => (await db.get('credentials', provider)) ?? null,
      null,
    ),
  all: () => safely<StoredCredential[]>((db) => db.getAll('credentials'), []),
  set: (credential: StoredCredential) =>
    safely(async (db) => {
      await db.put('credentials', credential)
      return true
    }, false),
  remove: (provider: string) =>
    safely(async (db) => {
      await db.delete('credentials', provider)
      return true
    }, false),
  clear: () =>
    safely(async (db) => {
      await db.clear('credentials')
      return true
    }, false),
}

/** Wipes every trace of the user from this browser. */
export async function wipeAllData(): Promise<void> {
  await safely(async (db) => {
    await Promise.all([db.clear('kv'), db.clear('history'), db.clear('credentials')])
    return true
  }, false)
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('pg:')) removeLocal(key)
  }
}
