import { connectToDatabase } from '@/lib/mongodb';
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
  const inputString = stringify(input);
  return crypto.createHash('sha256').update(workflow + ':' + inputString).digest('hex');
}

/**
 * Get a cached AI result from MongoDB if present and not expired.
 * @param {string} key - The cache key
 * @returns {Promise<any|null>} - The cached output or null if not found/expired
 */
export async function getAICache(key: string): Promise<any | null> {
  const client = await connectToDatabase();
  const db = client.db('healthtrack');
  const cache = db.collection('ai_cache');
  const now = new Date();
  const entry = await cache.findOne({ key });
  if (entry && entry.expiresAt && entry.expiresAt > now) {
    return entry.output;
  }
  return null;
}

/**
 * Set a cached AI result in MongoDB.
 * @param {string} key - The cache key
 * @param {string} workflow - The workflow name
 * @param {any} input - The input payload
 * @param {any} output - The output/result to cache
 * @param {number} expiryMs - Expiry in milliseconds (default: 24h)
 * @returns {Promise<void>}
 */
export async function setAICache(key: string, workflow: string, input: any, output: any, expiryMs: number = 24 * 60 * 60 * 1000): Promise<void> {
  const client = await connectToDatabase();
  const db = client.db('healthtrack');
  const cache = db.collection('ai_cache');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryMs);
  await cache.updateOne(
    { key },
    {
      $set: {
        key,
        workflow,
        input,
        output,
        createdAt: now,
        expiresAt,
      },
    },
    { upsert: true }
  );
} 