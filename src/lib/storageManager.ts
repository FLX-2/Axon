/**
 * Centralized Storage Manager
 * Provides efficient, unified localStorage management with caching and error handling
 */

export interface StorageConfig {
  prefix: string;
  version: string;
  maxSize: number; // in bytes
  compression?: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number; // time to live in ms
}

export interface StorageStats {
  totalKeys: number;
  totalSize: number;
  lastAccess: number;
  hitRate: number;
}

class StorageManager {
  private config: StorageConfig;
  private cache = new Map<string, CacheEntry<any>>();
  private accessStats = new Map<string, { hits: number; misses: number; lastAccess: number }>();
  private totalOperations = 0;
  private cacheHits = 0;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      prefix: 'axon',
      version: '1.0',
      maxSize: 5 * 1024 * 1024, // 5MB default
      compression: false,
      ...config
    };
  }

  private getFullKey(key: string): string {
    return `${this.config.prefix}_${this.config.version}_${key}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return entry.ttl ? Date.now() - entry.timestamp > entry.ttl : false;
  }

  private updateStats(key: string, hit: boolean): void {
    this.totalOperations++;
    if (hit) this.cacheHits++;

    const stats = this.accessStats.get(key) || { hits: 0, misses: 0, lastAccess: 0 };
    if (hit) {
      stats.hits++;
    } else {
      stats.misses++;
    }
    stats.lastAccess = Date.now();
    this.accessStats.set(key, stats);
  }

  private checkStorageQuota(): boolean {
    try {
      // Simple quota check - in a real implementation, you'd use StorageEstimate API
      const testKey = this.getFullKey('quota_test');
      const testData = 'x'.repeat(1024); // 1KB test
      localStorage.setItem(testKey, testData);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    // Find expired entries in memory cache
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToRemove.push(key);
      }
    }

    // Remove expired entries
    keysToRemove.forEach(key => {
      this.cache.delete(key);
      try {
        localStorage.removeItem(this.getFullKey(key));
      } catch (e) {
        console.warn(`Failed to remove expired entry: ${key}`, e);
      }
    });
  }

  private enforceSizeLimit(): void {
    if (!this.checkStorageQuota()) {
      // If we're near quota, clear least recently used items
      const entries = Array.from(this.accessStats.entries())
        .sort(([, a], [, b]) => a.lastAccess - b.lastAccess);

      for (const [key] of entries.slice(0, Math.floor(entries.length * 0.2))) {
        this.delete(key);
      }
    }
  }

  // Core storage operations
  set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      const fullKey = this.getFullKey(key);
      const entry: CacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        ttl
      };

      // Update memory cache
      this.cache.set(key, entry);

      // Serialize and store
      const serialized = JSON.stringify(entry);
      localStorage.setItem(fullKey, serialized);

      this.updateStats(key, false);
      this.enforceSizeLimit();

      return true;
    } catch (error) {
      console.error(`Storage set failed for key: ${key}`, error);
      return false;
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      // Check memory cache first
      const cached = this.cache.get(key);
      if (cached && !this.isExpired(cached)) {
        this.updateStats(key, true);
        return cached.data;
      }

      // Check localStorage
      const fullKey = this.getFullKey(key);
      const stored = localStorage.getItem(fullKey);

      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);

        if (!this.isExpired(entry)) {
          // Update memory cache
          this.cache.set(key, entry);
          this.updateStats(key, false);
          return entry.data;
        } else {
          // Remove expired entry
          this.delete(key);
        }
      }

      this.updateStats(key, false);
      return defaultValue;
    } catch (error) {
      console.error(`Storage get failed for key: ${key}`, error);
      return defaultValue;
    }
  }

  delete(key: string): boolean {
    try {
      const fullKey = this.getFullKey(key);

      // Remove from memory cache
      this.cache.delete(key);

      // Remove from localStorage
      localStorage.removeItem(fullKey);

      // Clean up stats
      this.accessStats.delete(key);

      return true;
    } catch (error) {
      console.error(`Storage delete failed for key: ${key}`, error);
      return false;
    }
  }

  clear(): boolean {
    try {
      // Clear memory cache
      this.cache.clear();
      this.accessStats.clear();

      // Clear localStorage entries with our prefix
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`${this.config.prefix}_${this.config.version}_`)) {
          localStorage.removeItem(key);
        }
      });

      return true;
    } catch (error) {
      console.error('Storage clear failed', error);
      return false;
    }
  }

  has(key: string): boolean {
    try {
      // Check memory cache
      const cached = this.cache.get(key);
      if (cached && !this.isExpired(cached)) {
        return true;
      }

      // Check localStorage
      const fullKey = this.getFullKey(key);
      const stored = localStorage.getItem(fullKey);

      if (stored) {
        const entry = JSON.parse(stored);
        return !this.isExpired(entry);
      }

      return false;
    } catch (error) {
      console.error(`Storage has check failed for key: ${key}`, error);
      return false;
    }
  }

  // Batch operations
  setMultiple(items: Record<string, any>): boolean {
    try {
      const entries: Record<string, CacheEntry<any>> = {};

      // Prepare all entries
      for (const [key, value] of Object.entries(items)) {
        entries[key] = {
          data: value,
          timestamp: Date.now()
        };
      }

      // Update memory cache
      Object.entries(entries).forEach(([key, entry]) => {
        this.cache.set(key, entry);
      });

      // Store in localStorage
      for (const [key, entry] of Object.entries(entries)) {
        const fullKey = this.getFullKey(key);
        const serialized = JSON.stringify(entry);
        localStorage.setItem(fullKey, serialized);
      }

      this.enforceSizeLimit();
      return true;
    } catch (error) {
      console.error('Storage setMultiple failed', error);
      return false;
    }
  }

  getMultiple(keys: string[]): Record<string, any> {
    const result: Record<string, any> = {};

    keys.forEach(key => {
      const value = this.get(key);
      if (value !== undefined && value !== null) {
        result[key] = value;
      }
    });

    return result;
  }

  // Statistics and monitoring
  getStats(): StorageStats {
    const keys = Object.keys(localStorage).filter(key =>
      key.startsWith(`${this.config.prefix}_${this.config.version}_`)
    );

    let totalSize = 0;
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length * 2; // Rough estimate: 2 bytes per character
      }
    });

    const lastAccess = Math.max(
      ...Array.from(this.accessStats.values()).map(stat => stat.lastAccess),
      0
    );

    return {
      totalKeys: keys.length,
      totalSize,
      lastAccess,
      hitRate: this.totalOperations > 0 ? this.cacheHits / this.totalOperations : 0
    };
  }

  // Maintenance
  cleanup(): void {
    this.cleanupExpiredEntries();
    this.enforceSizeLimit();
  }

  // Utility methods
  getKeys(): string[] {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(`${this.config.prefix}_${this.config.version}_`))
      .map(key => key.replace(`${this.config.prefix}_${this.config.version}_`, ''));
  }

  getSize(key: string): number {
    try {
      const fullKey = this.getFullKey(key);
      const value = localStorage.getItem(fullKey);
      return value ? value.length * 2 : 0;
    } catch {
      return 0;
    }
  }
}

// Singleton instance
export const storageManager = new StorageManager({
  prefix: 'axon',
  version: '2.0', // Increment version for new architecture
  maxSize: 10 * 1024 * 1024, // 10MB
  compression: false
});

// Export types
export type { StorageManager };