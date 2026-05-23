const store = new Map()
const MAX_ENTRIES = 128

function prune() {
  if (store.size <= MAX_ENTRIES) return
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.expires <= now) store.delete(key)
  }
  while (store.size > MAX_ENTRIES) {
    const first = store.keys().next().value
    if (first) store.delete(first)
    else break
  }
}

/** @template T */
export function getCached(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (entry.expires <= Date.now()) {
    store.delete(key)
    return null
  }
  return /** @type {T} */ (entry.value)
}

/** @template T */
export function setCached(key, value, ttlMs = 5 * 60_000) {
  store.set(key, { value, expires: Date.now() + ttlMs })
  prune()
}

export function invalidateCachePrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}
