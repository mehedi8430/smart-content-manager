/**
 * Minimal in-memory TTL cache (single process).
 *
 * Sufficient for single-instance deployments: read-heavy, low-churn data
 * (e.g. campaign list/detail) is served from memory instead of hitting
 * Postgres on every request. Entries expire after `ttlMs` and the cache
 * evicts the oldest entry once `maxSize` is reached.
 *
 * Not suitable for multi-instance setups or high-write data — for those,
 * use a shared store (e.g. Redis).
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class TTLCache<K, V> {
  private store = new Map<K, CacheEntry<V>>();
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(ttlMs: number, maxSize = 1000) {
    this.ttlMs = ttlMs;
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /** Remove a specific key (used by mutations that change cached data). */
  del(key: K): void {
    this.store.delete(key);
  }

  /** Remove all entries matching a predicate (e.g. all list keys). */
  clear(): void {
    this.store.clear();
  }
}

export default TTLCache;
