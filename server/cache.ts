/**
 * In-memory cache system for server-side query caching.
 * Reduces database load for frequently accessed data like stats, doctors list, etc.
 * 
 * Features:
 * - TTL-based expiration (configurable per cache key)
 * - Automatic stale data cleanup
 * - Cache invalidation by key or pattern
 * - Thread-safe (single Node.js event loop)
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

class ServerCache {
  private store = new Map<string, CacheEntry<any>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Clean up expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  /**
   * Get a cached value by key.
   * Returns undefined if the key doesn't exist or has expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * Set a cached value with a TTL in seconds.
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      createdAt: Date.now(),
    });
  }

  /**
   * Get or compute: returns cached value if available, otherwise computes and caches it.
   */
  async getOrCompute<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const data = await compute();
    this.set(key, data, ttlSeconds);
    return data;
  }

  /**
   * Invalidate a specific cache key.
   */
  invalidate(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Invalidate all cache keys matching a prefix pattern.
   * Example: invalidateByPrefix("appointments:") removes all appointment caches.
   */
  invalidateByPrefix(prefix: string): number {
    let count = 0;
    const keys = Array.from(this.store.keys());
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all cached entries.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache statistics.
   */
  getStats(): { size: number; keys: string[] } {
    this.cleanup(); // Clean up first
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }

  /**
   * Remove all expired entries.
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Destroy the cache and stop cleanup interval.
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Singleton instance
export const serverCache = new ServerCache();

// ─── Cache Key Builders ─────────────────────────────────────────────────────

export const CacheKeys = {
  // Stats caches (TTL: 30 seconds - frequently updated)
  appointmentStats: () => "stats:appointments",
  offerLeadStats: () => "stats:offerLeads",
  campRegistrationStats: () => "stats:campRegistrations",
  leadStats: () => "stats:leads",

  // List caches (TTL: 60 seconds - less frequently changed)
  doctorsList: () => "list:doctors",
  offersList: () => "list:offers",
  campsList: () => "list:camps",
  campaignsList: () => "list:campaigns",

  // Paginated query caches (TTL: 15 seconds - user-specific queries)
  appointmentsPaginated: (params: Record<string, any>) =>
    `paginated:appointments:${JSON.stringify(params)}`,
  offerLeadsPaginated: (params: Record<string, any>) =>
    `paginated:offerLeads:${JSON.stringify(params)}`,
  campRegistrationsPaginated: (params: Record<string, any>) =>
    `paginated:campRegistrations:${JSON.stringify(params)}`,
};

// ─── Cache TTL Constants (in seconds) ───────────────────────────────────────

export const CacheTTL = {
  STATS: 30,           // Stats refresh every 30 seconds
  LIST: 60,            // Reference lists refresh every 60 seconds
  PAGINATED: 15,       // Paginated queries refresh every 15 seconds
  SHORT: 10,           // Short-lived cache for rapidly changing data
};
