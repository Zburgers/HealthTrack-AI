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
  // Local-primary collections (stored locally in Electron, remotely in Web)
  PATIENTS: 'patients',
  AI_CACHE: 'ai_cache',
  NOTES: 'notes',
  
  // Remote-only collections (always stored remotely)
  CASE_EMBEDDINGS: 'case_embeddings',
  
  // Local-only collections (only in Electron)
  LOCAL_EMBEDDINGS: 'local_embeddings',
  DB_METADATA: 'db_metadata',
} as const;

// Collection distribution strategy
export const COLLECTION_DISTRIBUTION = {
  [COLLECTIONS.PATIENTS]: 'local-primary',
  [COLLECTIONS.AI_CACHE]: 'local-primary', 
  [COLLECTIONS.NOTES]: 'local-primary',
  [COLLECTIONS.CASE_EMBEDDINGS]: 'remote-only',
  [COLLECTIONS.LOCAL_EMBEDDINGS]: 'local-only',
  [COLLECTIONS.DB_METADATA]: 'local-only',
} as const;

export type CollectionDistribution = typeof COLLECTION_DISTRIBUTION;
export type CollectionName = keyof CollectionDistribution;
export type DistributionType = 'local-primary' | 'remote-only' | 'local-only';

/**
 * Environment detection - Consistent with main db router
 */
export function isElectronEnvironment(): boolean {
  // Primary detection: Check for Electron runtime
  if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
    return true;
  }
  
  // Secondary detection: Environment variables set by Electron main process
  if (process.env.IS_ELECTRON === 'true' || process.env.ELECTRON_ENV === 'true') {
    return true;
  }
  
  // Tertiary detection: Electron API in renderer process
  if (typeof window !== 'undefined' && (window as { electronAPI?: unknown }).electronAPI) {
    return true;  
  }
  
  return false;
}

export function isWebEnvironment(): boolean {
  return !isElectronEnvironment();
}

/**
 * Determine which database to use for a collection
 */
export function getDatabaseTarget(collection: CollectionName): 'local' | 'remote' {
  const distribution = COLLECTION_DISTRIBUTION[collection];
  
  if (distribution === 'remote-only') {
    return 'remote';
  }
  
  if (distribution === 'local-only') {
    return 'local';
  }
  
  // For local-primary collections
  if (distribution === 'local-primary') {
    return isElectronEnvironment() ? 'local' : 'remote';
  }
  
  // Default fallback
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
 * Get database name for target
 */
export function getDatabaseName(target: 'local' | 'remote'): string {
  return target === 'local' ? DATABASE_NAMES.LOCAL : DATABASE_NAMES.REMOTE;
}