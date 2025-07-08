/**
 * MongoDB Framework - Universal Database Access Layer
 * 
 * This framework provides seamless access to both local and remote databases
 * without requiring changes to existing API routes or database operations.
 */

import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import { MONGODB_URI } from '@/config';

// Global connection instances
let localClient: MongoClient | null = null;
let remoteClient: MongoClient | null = null;
let localDb: Db | null = null;
let remoteDb: Db | null = null;

// Collection routing configuration
const LOCAL_COLLECTIONS = new Set([
  'patients',
  'ai_cache', 
  'notes',
  'local_embeddings',
  'db_metadata'
]);

const REMOTE_COLLECTIONS = new Set([
  'case_embeddings'
]);

/**
 * Detect if running in Electron environment
 */
/**
 * Environment detection - Consistent with main db router
 */
function isElectronEnvironment(): boolean {
  // Primary detection: Check for Electron runtime
  if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
    return true;
  }
  
  // Secondary detection: Environment variables set by Electron main process
  if (process.env.IS_ELECTRON === 'true' || process.env.ELECTRON_ENV === 'true') {
    return true;
  }
  
  // Tertiary detection: Electron API in renderer process
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return true;
  }
  
  return false;
}

/**
 * Check if Electron IPC is available (renderer process)
 */
function isElectronRenderer(): boolean {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
}

/**
 * Initialize local database connection (DISABLED - Using SQLite instead)
 */
async function initializeLocalDatabase(): Promise<void> {
  // LOCAL MONGODB DISABLED - We've migrated to SQLite for local storage
  // This function is kept for compatibility but does nothing
  console.log('🔄 [LOCAL_DB] Local MongoDB disabled - using SQLite instead');
  return;
}

/**
 * Initialize remote database connection
 */
async function initializeRemoteDatabase(): Promise<void> {
  if (remoteClient && remoteDb) {
    return; // Already connected
  }

  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not configured');
    }

    remoteClient = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false, // Allow $vectorSearch
        deprecationErrors: true,
      },
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    await remoteClient.connect();
    remoteDb = remoteClient.db('healthtrack');
    
    console.log('✅ Connected to remote MongoDB Atlas');
  } catch (error) {
    console.error('❌ Failed to connect to remote MongoDB:', error);
    throw error;
  }
}

/**
 * Determine which database to use for a collection
 */
function getTargetDatabase(collectionName: string): 'local' | 'remote' {
  if (LOCAL_COLLECTIONS.has(collectionName)) {
    return isElectronEnvironment() ? 'local' : 'remote';
  }
  
  if (REMOTE_COLLECTIONS.has(collectionName)) {
    return 'remote';
  }
  
  // Default to remote for unknown collections
  return 'remote';
}

/**
 * Get database instance for a collection
 */
async function getDatabaseForCollection(collectionName: string, requestedDbName: string = 'healthtrack'): Promise<Db> {
  const target = getTargetDatabase(collectionName);
  
  console.log(`🔍 Database routing for collection "${collectionName}": ${target} (Electron: ${isElectronEnvironment()}, Requested DB: ${requestedDbName})`);
  
  if (target === 'local') {
    // LOCAL COLLECTIONS IN ELECTRON: These should use SQLite via IPC, not MongoDB
    if (isElectronEnvironment()) {
      console.error(`🚫 LOCAL COLLECTION ACCESS ERROR: Collection "${collectionName}" should use SQLite via IPC, not MongoDB framework`);
      console.error(`💡 SOLUTION: Use the database adapter from @/lib/db instead of MongoDB framework for local collections in Electron`);
      throw new Error(`Local collection "${collectionName}" requires SQLite access via IPC in Electron environment. Use @/lib/db adapter instead.`);
    }
    
    // In web environment, fall back to remote for local collections
    console.log(`🌐 Web environment: Using remote database for collection "${collectionName}"`);
    if (!remoteDb) {
      await initializeRemoteDatabase();
    }
    if (!remoteDb) {
      throw new Error('Remote database not available');
    }
    return remoteDb;
  } else {
    if (!remoteDb) {
      await initializeRemoteDatabase();
    }
    if (!remoteDb) {
      throw new Error('Remote database not available');
    }
    console.log(`☁️ Using REMOTE database: ${requestedDbName}`);
    return remoteDb; // This uses the default 'healthtrack' name for remote
  }
}

/**
 * Universal database client that works with existing code
 */
export class UniversalMongoClient {
  private db_name: string;

  constructor(dbName: string = 'healthtrack') {
    this.db_name = dbName;
  }

  /**
   * Get a database instance that automatically routes collections
   */
  db(name?: string): UniversalDatabase {
    return new UniversalDatabase(name || this.db_name);
  }

  async connect(): Promise<void> {
    // Initialize only remote connections - local SQLite is handled separately
    console.log('🔗 [UNIVERSAL_CLIENT] Connecting to remote MongoDB only (local SQLite handled by Electron)');
    await initializeRemoteDatabase();
  }

  async close(): Promise<void> {
    if (localClient) {
      await localClient.close();
      localClient = null;
      localDb = null;
    }
    if (remoteClient) {
      await remoteClient.close();
      remoteClient = null;
      remoteDb = null;
    }
  }
}

/**
 * Universal database that routes collections automatically
 */
export class UniversalDatabase {
  private db_name: string;

  constructor(dbName: string) {
    this.db_name = dbName;
  }
  /**
   * Get a collection that automatically routes to the correct database
   */
  collection<T = any>(name: string): UniversalCollection<T> {
    return new UniversalCollection<T>(name, this.db_name);
  }
}

/**
 * Universal collection that handles IPC in Electron or direct DB access
 */
export class UniversalCollection<T = any> {
  private collectionName: string;
  private requestedDbName: string;

  constructor(collectionName: string, requestedDbName: string = 'healthtrack') {
    this.collectionName = collectionName;
    this.requestedDbName = requestedDbName;
  }
  /**
   * Universal find operation
   */
  find(filter: any = {}, options: any = {}): any {
    // Direct database access - return cursor-like object
    return {
      sort: (sortSpec: any) => ({
        limit: (limitSpec: any) => ({
          toArray: async () => {
            const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
            const collection = db.collection(this.collectionName);
            return collection.find(filter, options).sort(sortSpec).limit(limitSpec).toArray();
          }
        }),
        toArray: async () => {
          const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
          const collection = db.collection(this.collectionName);
          return collection.find(filter, options).sort(sortSpec).toArray();
        }
      }),
      limit: (limitSpec: any) => ({
        sort: (sortSpec: any) => ({
          toArray: async () => {
            const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
            const collection = db.collection(this.collectionName);
            return collection.find(filter, options).limit(limitSpec).sort(sortSpec).toArray();
          }
        }),
        toArray: async () => {
          const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
          const collection = db.collection(this.collectionName);
          return collection.find(filter, options).limit(limitSpec).toArray();
        }
      }),      toArray: async () => {
        const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
        const collection = db.collection(this.collectionName);
        return collection.find(filter, options).toArray();
      }
    };
  }
  /**
   * Universal findOne operation
   */
  async findOne(filter: any = {}, options: any = {}): Promise<any> {
    // In Electron renderer, use IPC
    if (isElectronRenderer()) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.database?.findOne) {
        return electronAPI.database.findOne(this.collectionName, filter);
      }
    }

    // Direct database access
    const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
    const collection = db.collection(this.collectionName);
    return collection.findOne(filter, options);
  }

  /**
   * Universal insertOne operation
   */
  async insertOne(document: any): Promise<any> {
    // In Electron renderer, use IPC
    if (isElectronRenderer()) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.database?.insertOne) {
        return electronAPI.database.insertOne(this.collectionName, document);
      }
    }

    // Direct database access
    const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
    const collection = db.collection(this.collectionName);
    return collection.insertOne(document);
  }

  /**
   * Universal updateOne operation
   */
  async updateOne(filter: any, update: any, options: any = {}): Promise<any> {
    // In Electron renderer, use IPC
    if (isElectronRenderer()) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.database?.updateOne) {
        return electronAPI.database.updateOne(this.collectionName, filter, update, options);
      }
    }

    // Direct database access
    const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
    const collection = db.collection(this.collectionName);
    return collection.updateOne(filter, update, options);
  }

  /**
   * Universal deleteOne operation
   */
  async deleteOne(filter: any): Promise<any> {
    // In Electron renderer, use IPC
    if (isElectronRenderer()) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.database?.deleteOne) {
        return electronAPI.database.deleteOne(this.collectionName, filter);
      }
    }

    // Direct database access
    const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
    const collection = db.collection(this.collectionName);
    return collection.deleteOne(filter);
  }

  /**
   * Universal insertMany operation
   */
  async insertMany(documents: any[]): Promise<any> {
    // In Electron renderer, could implement bulk IPC
    if (isElectronRenderer()) {
      // For now, fall back to insertOne for each document
      const results = [];
      for (const doc of documents) {
        const result = await this.insertOne(doc);
        results.push(result);
      }
      return { insertedIds: results.map(r => r.insertedId) };
    }

    // Direct database access
    const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
    const collection = db.collection(this.collectionName);
    return collection.insertMany(documents);
  }

  /**
   * Universal updateMany operation
   */
  async updateMany(filter: any, update: any, options: any = {}): Promise<any> {
    // Direct database access (IPC could be added later)
    const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
    const collection = db.collection(this.collectionName);
    return collection.updateMany(filter, update, options);
  }

  /**
   * Universal deleteMany operation
   */
  async deleteMany(filter: any): Promise<any> {
    // Direct database access (IPC could be added later)
    const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
    const collection = db.collection(this.collectionName);
    return collection.deleteMany(filter);
  }
  /**
   * Universal aggregate operation
   */
  async aggregate(pipeline: any[]): Promise<any[]> {
    // Direct database access (complex for IPC)
    const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
    const collection = db.collection(this.collectionName);
    return collection.aggregate(pipeline).toArray();
  }

  /**
   * Universal listIndexes operation
   */
  listIndexes(): any {
    return {
      toArray: async () => {
        const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
        const collection = db.collection(this.collectionName);
        return collection.listIndexes().toArray();
      }
    };
  }

  /**
   * Universal createIndex operation
   */
  async createIndex(indexSpec: any, options: any = {}): Promise<any> {
    const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
    const collection = db.collection(this.collectionName);
    return collection.createIndex(indexSpec, options);
  }

  /**
   * Universal dropIndex operation
   */
  async dropIndex(indexName: string): Promise<any> {
    const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
    const collection = db.collection(this.collectionName);
    return collection.dropIndex(indexName);
  }

  /**
   * Universal countDocuments operation
   */
  async countDocuments(filter: any = {}): Promise<number> {
    const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
    const collection = db.collection(this.collectionName);
    return collection.countDocuments(filter);
  }

  /**
   * Universal distinct operation
   */
  async distinct(key: string, filter: any = {}): Promise<any[]> {
    const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
    const collection = db.collection(this.collectionName);
    return collection.distinct(key, filter);
  }
}

/**
 * Initialize the database framework
 */
export async function initializeDatabaseFramework(): Promise<UniversalMongoClient> {
  const client = new UniversalMongoClient();
  await client.connect();
  return client;
}

// Export for backward compatibility
export { isElectronEnvironment, isElectronRenderer };
