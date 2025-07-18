import { Collection } from 'mongodb';
import crypto from 'crypto';
import stringify from 'json-stable-stringify';

/**
 * Generate a SHA256 hash from the input payload for cache keying.
 * Uses stable stringify to ensure deterministic keys for the same logical input.
 * @param {string} workflow - The workflow name (e.g., 'analyze-patient')
 * @param {any} input - The input payload (will be stringified)
 * @returns {string} - The cache key
 */
export function makeAICacheKey(workflow: string, input: any): string {
  if (!workflow || workflow.trim() === '') {
    throw new Error('Workflow name is required for cache key generation');
  }
  
  const inputString = stringify(input);
  const key = crypto.createHash('sha256').update(workflow + ':' + inputString).digest('hex');
  
  if (!key || key.trim() === '') {
    throw new Error('Failed to generate valid cache key');
  }
  
  return key;
}

/**
 * Get a cached AI result from the database if present and not expired.
 * @param {Collection} cache - The MongoDB collection to use for caching.
 * @param {string} key - The cache key
 * @returns {Promise<any|null>} - The cached output or null if not found/expired
 */
export async function getAICache(cache?: Collection | null, key?: string): Promise<any | null> {
  try {
    if (!cache) {
      // Short-circuit for frontend/test usage
      return null;
    }
    if (!key || key.trim() === '') {
      console.warn('⚠️ Invalid cache key provided to getAICache');
      return null;
    }
    
    const now = new Date();
    const entry = await cache.findOne({ cacheKey: key, expiresAt: { $gt: now } });
    
    return entry?.output || null;
  } catch (error) {
    console.error('❌ Failed to get AI cache:', error);
    return null;
  }
}

/**
 * Set a cached AI result in the database.
 * @param {Collection} cache - The MongoDB collection to use for caching.
 * @param {string} key - The cache key
 * @param {string} workflow - The workflow name
 * @param {any} input - The input payload
 * @param {any} output - The output/result to cache
 * @param {number} expiryMs - Expiry in milliseconds (default: 24h)
 * @returns {Promise<void>}
 */
export async function setAICache(cache?: Collection | null, key?: string, workflow?: string, input?: any, output?: any, expiryMs: number = 24 * 60 * 60 * 1000): Promise<void> {
  try {
    if (!cache) {
        throw new Error('MongoDB collection is required for AI cache storage.');
    }
    if (!key || key.trim() === '') {
      console.warn('⚠️ Invalid cache key provided to setAICache');
      return;
    }
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryMs);
    
    await cache.updateOne(
      { cacheKey: key },
      {
        $set: {
          cacheKey: key,
          workflow,
          input,
          output,
          createdAt: now,
          expiresAt,
        },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('❌ Failed to set AI cache:', error);
    // Don't throw - caching failures shouldn't break the application
  }
}
