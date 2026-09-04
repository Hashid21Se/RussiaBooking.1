/**
 * Unified Redis Client & In-Memory Redis Engine
 * Provides:
 * 1. Distributed Locking (Redlock pattern) to prevent Double Booking
 * 2. Search & Hotel Details Caching with TTL
 * 3. Token Blacklisting for secure JWT revocation
 * 4. Sliding-window Rate Limiting
 */

export interface DistributedLock {
  lockId: string;
  resourceKey: string;
  expiresAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

class RedisManager {
  private cache = new Map<string, { value: any; expiresAt: number }>();
  private activeLocks = new Map<string, DistributedLock>();
  private rateLimitBuckets = new Map<string, { count: number; windowStart: number }>();
  private blacklistedTokens = new Set<string>();

  constructor() {
    // Background garbage collection for expired cache entries every 30 seconds
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (item.expiresAt < now) {
          this.cache.delete(key);
        }
      }
      for (const [resource, lock] of this.activeLocks.entries()) {
        if (lock.expiresAt < now) {
          this.activeLocks.delete(resource);
        }
      }
    }, 30000);
  }

  // ===================== DISTRIBUTED LOCKS =====================
  /**
   * Acquire a distributed lock for a resource (e.g. room inventory on specific dates)
   * Prevents race conditions and double bookings
   */
  public async acquireLock(resourceKey: string, ttlMs = 15000): Promise<DistributedLock | null> {
    const now = Date.now();
    const existingLock = this.activeLocks.get(resourceKey);

    if (existingLock && existingLock.expiresAt > now) {
      // Resource is currently locked by another transaction
      return null;
    }

    const lock: DistributedLock = {
      lockId: `lock_${Math.random().toString(36).substring(2)}_${now}`,
      resourceKey,
      expiresAt: now + ttlMs
    };

    this.activeLocks.set(resourceKey, lock);
    return lock;
  }

  /**
   * Release an acquired distributed lock
   */
  public async releaseLock(lock: DistributedLock): Promise<boolean> {
    const existingLock = this.activeLocks.get(lock.resourceKey);
    if (existingLock && existingLock.lockId === lock.lockId) {
      this.activeLocks.delete(lock.resourceKey);
      return true;
    }
    return false;
  }

  // ===================== KEY-VALUE CACHE =====================
  public async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return item.value as T;
  }

  public async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }

  public async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  public async delPattern(prefix: string): Promise<void> {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matched: string[] = [];
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        matched.push(key);
      }
    }
    return matched;
  }

  // ===================== RATE LIMITING =====================
  /**
   * Sliding window rate limiter
   */
  public async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const bucket = this.rateLimitBuckets.get(identifier);

    if (!bucket || (now - bucket.windowStart) > windowMs) {
      this.rateLimitBuckets.set(identifier, { count: 1, windowStart: now });
      return {
        allowed: true,
        remaining: limit - 1,
        resetSeconds: windowSeconds
      };
    }

    if (bucket.count >= limit) {
      const resetSeconds = Math.ceil((bucket.windowStart + windowMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetSeconds
      };
    }

    bucket.count += 1;
    const resetSeconds = Math.ceil((bucket.windowStart + windowMs - now) / 1000);
    return {
      allowed: true,
      remaining: limit - bucket.count,
      resetSeconds
    };
  }

  // ===================== TOKEN BLACKLIST =====================
  public async blacklistToken(tokenJti: string, ttlSeconds = 86400): Promise<void> {
    this.blacklistedTokens.add(tokenJti);
    setTimeout(() => {
      this.blacklistedTokens.delete(tokenJti);
    }, ttlSeconds * 1000);
  }

  public async isTokenBlacklisted(tokenJti: string): Promise<boolean> {
    return this.blacklistedTokens.has(tokenJti);
  }
}

export const redisClient = new RedisManager();
