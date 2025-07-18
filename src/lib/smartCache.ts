/**
 * Enhanced Smart Caching System for HealthTrack AI
 * 
 * Features:
 * - Multi-tier caching (memory + database)
 * - LRU eviction for memory cache
 * - Cache warming and preloading
 * - Metrics and performance monitoring
 * - Intelligent cache invalidation
 */

import { getAICache, setAICache, makeAICacheKey } from '@/../../electron/lib/shared/aiCache';

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  hitCount: number;
  lastAccessed: number;
  size: number; // Approximate size in bytes
}

interface CacheMetrics {
  hits: number;
  misses: number;
  memoryHits: number;
  databaseHits: number;
  evictions: number;
  totalSize: number;
  entryCount: number;
}

class SmartCacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private maxMemorySize = 50 * 1024 * 1024; // 50MB default
  private maxEntries = 1000;
  private currentSize = 0;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    memoryHits: 0,
    databaseHits: 0,
    evictions: 0,
    totalSize: 0,
    entryCount: 0
  };

  // Cache frequently used workflows
  private frequentWorkflows = new Set([
    'analyze-patient',
    'extract-entities',
    'generate-soap',
    'icd-classification'
  ]);

  constructor(options?: {
    maxMemorySize?: number;
    maxEntries?: number;
  }) {
    if (options?.maxMemorySize) {
      this.maxMemorySize = options.maxMemorySize;
    }
    if (options?.maxEntries) {
      this.maxEntries = options.maxEntries;
    }

    // Start metrics reporting
    this.startMetricsReporting();
  }

  /**
   * Get cached data with multi-tier lookup
   */
  async get<T = unknown>(workflow: string, input: unknown): Promise<T | null> {
    const key = makeAICacheKey(workflow, input);
    
    try {
      // Tier 1: Check memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && this.isValidEntry(memoryEntry)) {
        memoryEntry.hitCount++;
        memoryEntry.lastAccessed = Date.now();
        this.metrics.hits++;
        this.metrics.memoryHits++;
        
        console.log(`🚀 Memory cache HIT for ${workflow}`);
        return memoryEntry.data as T;
      }

      // Tier 2: Check database cache
      const dbResult = await getAICache(undefined, key);
      if (dbResult) {
        // Store in memory cache for future access
        this.setMemoryCache(key, dbResult, workflow);
        this.metrics.hits++;
        this.metrics.databaseHits++;
        
        console.log(`💾 Database cache HIT for ${workflow}`);
        return dbResult as T;
      }

      // Cache miss
      this.metrics.misses++;
      console.log(`❌ Cache MISS for ${workflow}`);
      return null;
    } catch (error) {
      console.error('❌ Smart cache get error:', error);
      this.metrics.misses++;
      return null;
    }
  }

  /**
   * Set cached data in both memory and database
   */
  async set<T = unknown>(
    workflow: string, 
    input: unknown, 
    output: T, 
    expiryMs?: number
  ): Promise<void> {
    const key = makeAICacheKey(workflow, input);
    
    try {
      // Store in database (persistent)
      await setAICache(undefined, key, workflow, input, output, expiryMs);
      
      // Store in memory cache if it's a frequent workflow
      if (this.frequentWorkflows.has(workflow)) {
        this.setMemoryCache(key, output, workflow);
      }
      
      console.log(`💾 Cached result for ${workflow}`);
    } catch (error) {
      console.error('❌ Smart cache set error:', error);
    }
  }

  /**
   * Warm cache with commonly used data
   */
  async warmCache(workflows: string[], commonInputs: unknown[]): Promise<void> {
    console.log('🔥 Starting cache warming...');
    
    const warmingPromises = [];
    
    for (const workflow of workflows) {
      for (const input of commonInputs) {
        const promise = this.get(workflow, input).catch(error => {
          console.warn(`⚠️ Cache warming failed for ${workflow}:`, error);
        });
        warmingPromises.push(promise);
      }
    }
    
    await Promise.allSettled(warmingPromises);
    console.log('✅ Cache warming complete');
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    let invalidated = 0;
    
    for (const [key] of this.memoryCache) {
      const matches = pattern instanceof RegExp 
        ? pattern.test(key)
        : key.includes(pattern);
        
      if (matches) {
        this.removeFromMemoryCache(key);
        invalidated++;
      }
    }
    
    console.log(`🗑️ Invalidated ${invalidated} cache entries`);
    return invalidated;
  }

  /**
   * Clear all cache data
   */
  clear(): void {
    this.memoryCache.clear();
    this.currentSize = 0;
    this.metrics.entryCount = 0;
    this.metrics.totalSize = 0;
    console.log('🧹 Cache cleared');
  }

  /**
   * Get cache metrics and performance stats
   */
  getMetrics(): CacheMetrics & {
    hitRate: number;
    memoryHitRate: number;
    averageEntrySize: number;
    memoryUtilization: number;
  } {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;
    const memoryHitRate = this.metrics.hits > 0 ? (this.metrics.memoryHits / this.metrics.hits) * 100 : 0;
    const averageEntrySize = this.metrics.entryCount > 0 ? this.currentSize / this.metrics.entryCount : 0;
    const memoryUtilization = (this.currentSize / this.maxMemorySize) * 100;

    return {
      ...this.metrics,
      hitRate,
      memoryHitRate,
      averageEntrySize,
      memoryUtilization
    };
  }

  /**
   * Private methods
   */
  private setMemoryCache<T>(key: string, data: T, workflow: string): void {
    const size = this.estimateSize(data);
    
    // Check if we need to evict entries
    while (
      (this.currentSize + size > this.maxMemorySize) ||
      (this.memoryCache.size >= this.maxEntries)
    ) {
      this.evictLRU();
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hitCount: 0,
      lastAccessed: Date.now(),
      size
    };
    
    this.memoryCache.set(key, entry);
    this.currentSize += size;
    this.metrics.entryCount++;
    this.metrics.totalSize = this.currentSize;
  }

  private removeFromMemoryCache(key: string): boolean {
    const entry = this.memoryCache.get(key);
    if (entry) {
      this.memoryCache.delete(key);
      this.currentSize -= entry.size;
      this.metrics.entryCount--;
      this.metrics.totalSize = this.currentSize;
      return true;
    }
    return false;
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.memoryCache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.removeFromMemoryCache(oldestKey);
      this.metrics.evictions++;
    }
  }

  private isValidEntry(entry: CacheEntry): boolean {
    // For now, memory cache entries don't expire (database handles expiry)
    // Could add memory-specific expiry logic here
    return true;
  }

  private estimateSize(data: unknown): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1024; // Default estimate
    }
  }

  private startMetricsReporting(): void {
    // Report metrics every 5 minutes in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const metrics = this.getMetrics();
        console.log('📊 Cache Metrics:', {
          hitRate: `${metrics.hitRate.toFixed(1)}%`,
          memoryHitRate: `${metrics.memoryHitRate.toFixed(1)}%`,
          memoryUtilization: `${metrics.memoryUtilization.toFixed(1)}%`,
          entries: metrics.entryCount,
          evictions: metrics.evictions
        });
      }, 5 * 60 * 1000);
    }
  }
}

// Singleton instance
export const smartCache = new SmartCacheManager();

// Enhanced caching utilities
export const SmartCache = {
  /**
   * Get data with smart caching
   */
  async get<T = unknown>(workflow: string, input: unknown): Promise<T | null> {
    return smartCache.get<T>(workflow, input);
  },

  /**
   * Set data with smart caching
   */
  async set<T = unknown>(
    workflow: string, 
    input: unknown, 
    output: T, 
    expiryMs?: number
  ): Promise<void> {
    return smartCache.set(workflow, input, output, expiryMs);
  },

  /**
   * Get or compute data with caching
   */
  async getOrCompute<T = unknown>(
    workflow: string,
    input: unknown,
    computeFn: () => Promise<T>,
    expiryMs?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await smartCache.get<T>(workflow, input);
    if (cached !== null) {
      return cached;
    }

    // Compute the result
    console.log(`🧮 Computing result for ${workflow}...`);
    const result = await computeFn();

    // Cache the result
    await smartCache.set(workflow, input, result, expiryMs);

    return result;
  },

  /**
   * Warm cache for common workflows
   */
  async warmCache(): Promise<void> {
    const commonWorkflows = [
      'analyze-patient',
      'extract-entities',
      'generate-soap',
      'icd-classification'
    ];

    const commonInputs: unknown[] = [
      { type: 'routine-checkup' },
      { specialty: 'internal-medicine' },
      { urgency: 'normal' }
    ];

    return smartCache.warmCache(commonWorkflows, commonInputs);
  },

  /**
   * Get cache performance metrics
   */
  getMetrics() {
    return smartCache.getMetrics();
  },

  /**
   * Clear all cache data
   */
  clear(): void {
    smartCache.clear();
  },

  /**
   * Invalidate cache entries by pattern
   */
  invalidate(pattern: string | RegExp): number {
    return smartCache.invalidatePattern(pattern);
  }
};

export default SmartCache;