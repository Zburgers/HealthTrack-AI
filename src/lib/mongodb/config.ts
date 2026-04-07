/**
 * MongoDB Module Configuration
 * 
 * Defines collection distribution and database routing logic
 */

// Database names
export const DATABASE_NAMES = {
  LOCAL: 'healthtrack_local',
  REMOTE: 'healthtrack-base',
} as const;

// Collection definitions
export const COLLECTIONS = {
  // Primary collections (stored in remote MongoDB)
  PATIENTS: 'patients',
  AI_CACHE: 'ai_cache',
  NOTES: 'notes',

  // Remote-only collections
  CASE_EMBEDDINGS: 'case_embeddings',

  // Metadata collections
  LOCAL_EMBEDDINGS: 'local_embeddings',
  DB_METADATA: 'db_metadata',
} as const;

// Collection distribution strategy
// Note: In a web-first architecture, all collections route to remote MongoDB
export const COLLECTION_DISTRIBUTION = {
  [COLLECTIONS.PATIENTS]: 'remote',
  [COLLECTIONS.AI_CACHE]: 'remote',
  [COLLECTIONS.NOTES]: 'remote',
  [COLLECTIONS.CASE_EMBEDDINGS]: 'remote',
  [COLLECTIONS.LOCAL_EMBEDDINGS]: 'remote',
  [COLLECTIONS.DB_METADATA]: 'remote',
} as const;

export type CollectionDistribution = typeof COLLECTION_DISTRIBUTION;
export type CollectionName = keyof CollectionDistribution;
export type DistributionType = 'remote';

/**
 * Environment detection.
 * Always returns false in a web-only architecture.
 */
export function isElectronEnvironment(): boolean {
  return false;
}

export function isWebEnvironment(): boolean {
  return true;
}

/**
 * Determine which database to use for a collection.
 * In a web-first architecture, all collections route to remote.
 */
export function getDatabaseTarget(_collection: CollectionName): 'remote' {
  return 'remote';
}

/**
 * MongoDB connection configuration
 */
export const MONGODB_CONFIG = {
  // Connection options for remote MongoDB
  REMOTE_OPTIONS: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    retryReads: true,
  },
  
  // Connection options for local MongoDB
  LOCAL_OPTIONS: {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 3000,
    socketTimeoutMS: 30000,
    retryWrites: true,
    retryReads: true,
  },
  
  // Default local MongoDB port
  LOCAL_PORT: 27018,
} as const;

/**
 * Collection validation
 */
export function isValidCollection(collection: string): collection is CollectionName {
  return Object.values(COLLECTIONS).includes(collection as CollectionName);
}

/**
 * Get database name (kept for backward compatibility)
 */
export function getDatabaseName(): string {
  return DATABASE_NAMES.REMOTE;
}