/**
 * MongoDB Framework - Universal Database Access Layer
 * 
 * This framework provides seamless access to both default and user-configured databases
 * without requiring changes to existing API routes or database operations.
 * 
 * Architecture:
 * - Default MongoDB (env URI): case_embeddings collection only
 * - User MongoDB (configurable URI): all other collections (patients, ai_cache, notes, etc.)
 */

import { MongoClient, Db, ServerApiVersion, Collection } from 'mongodb';

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const DEFAULT_DB_NAME = 'healthtrack';

// Global connection instances
let defaultClient: MongoClient | null = null; // For case_embeddings (env URI)
let userClient: MongoClient | null = null;    // For user data (configurable URI)
let defaultDb: Db | null = null;
let userDb: Db | null = null;

// User-configured URI (managed by Electron IPC)
let userMongoUri: string | null = null;

// Collection routing: which collections use which database
const EMBEDDINGS_COLLECTIONS = new Set(['case_embeddings']);
const USER_DATA_COLLECTIONS = new Set([
  'patients',
  'ai_cache', 
  'notes',
  'local_embeddings',
  'db_metadata'
]);

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
 * Initialize default MongoDB connection (for case_embeddings - always uses env URI)
 */
async function initializeDefaultMongoDBConnection(): Promise<void> {
  if (defaultClient && defaultDb) {
    return; // Already connected
  }

  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable not configured');
    }

    console.log('🔗 [MONGODB_FRAMEWORK] Connecting to default MongoDB (embeddings)...');

    defaultClient = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false, // Allow $vectorSearch
        deprecationErrors: true,
      },
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    await defaultClient.connect();
    defaultDb = defaultClient.db(DEFAULT_DB_NAME);
    
    console.log('✅ [MONGODB_FRAMEWORK] Connected to default MongoDB (embeddings)');
  } catch (error) {
    console.error('❌ [MONGODB_FRAMEWORK] Failed to connect to default MongoDB:', error);
    throw error;
  }
}

/**
 * Initialize user MongoDB connection (for user data - uses configurable URI)
 */
async function initializeUserMongoDBConnection(): Promise<void> {
  try {
    // Use user URI if configured, otherwise fall back to env URI
    const connectionUri = userMongoUri || MONGODB_URI;
    
    if (!connectionUri) {
      throw new Error('No MongoDB URI available for user data');
    }

    console.log('🔗 [MONGODB_FRAMEWORK] Connecting to user MongoDB...');

    // Close existing connection if any
    if (userClient) {
      await userClient.close();
    }
    
    userClient = new MongoClient(connectionUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
      },
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    await userClient.connect();
    userDb = userClient.db(DEFAULT_DB_NAME);
    
    console.log('✅ [MONGODB_FRAMEWORK] Connected to user MongoDB');
  } catch (error) {
    console.error('❌ [MONGODB_FRAMEWORK] Failed to connect to user MongoDB:', error);
    throw error;
  }
}

/**
 * Set user MongoDB URI (called from Electron IPC)
 */
export function setUserMongoUri(uri: string): void {
  userMongoUri = uri;
}

/**
 * Get current user MongoDB URI
 */
export function getUserMongoUri(): string | null {
  return userMongoUri;
}

/**
 * Get database instance for a collection based on routing rules
 */
async function getDatabaseForCollection(collectionName: string, requestedDbName?: string): Promise<Db> {
  console.log(`🔍 [MONGODB_FRAMEWORK] Getting database for collection "${collectionName}"`);
  
  if (EMBEDDINGS_COLLECTIONS.has(collectionName)) {
    // Use default database for embeddings
    if (!defaultDb) {
      await initializeDefaultMongoDBConnection();
    }
    if (!defaultDb) {
      throw new Error('Default MongoDB database not available');
    }
    console.log(`☁️ [MONGODB_FRAMEWORK] Using default MongoDB for: ${collectionName}`);
    return defaultDb;
  } else {
    // Use user database for all other collections
    if (!userDb) {
      await initializeUserMongoDBConnection();
    }
    if (!userDb) {
      throw new Error('User MongoDB database not available');
    }
    console.log(`👤 [MONGODB_FRAMEWORK] Using user MongoDB for: ${collectionName}`);
    return userDb;
  }
}

/**
 * Health check for default MongoDB (embeddings database)
 */
export async function checkDefaultDatabaseHealth(): Promise<{ connected: boolean; error?: string }> {
  try {
    if (!defaultClient || !defaultDb) {
      await initializeDefaultMongoDBConnection();
    }
    
    await defaultDb!.admin().ping();
    return { connected: true };
  } catch (error) {
    console.error('❌ [MONGODB_FRAMEWORK] Default database health check failed:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Health check for user MongoDB (user data database)
 */
export async function checkUserDatabaseHealth(): Promise<{ connected: boolean; error?: string }> {
  try {
    if (!userClient || !userDb) {
      await initializeUserMongoDBConnection();
    }
    
    await userDb!.admin().ping();
    return { connected: true };
  } catch (error) {
    console.error('❌ [MONGODB_FRAMEWORK] User database health check failed:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get comprehensive database status for both connections
 */
export async function getDatabaseStatus(): Promise<{
  default: { connected: boolean; error?: string; uri?: string };
  user: { connected: boolean; error?: string; uri?: string };
}> {
  const [defaultHealth, userHealth] = await Promise.all([
    checkDefaultDatabaseHealth(),
    checkUserDatabaseHealth()
  ]);

  return {
    default: {
      ...defaultHealth,
      uri: MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Not configured'
    },
    user: {
      ...userHealth,
      uri: userMongoUri?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Using default URI'
    }
  };
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
    // Initialize MongoDB connections
    console.log('🔗 [UNIVERSAL_CLIENT] Connecting to MongoDB Atlas');
    await initializeUserMongoDBConnection();
  }

  async close(): Promise<void> {
    // Close user database connection if open
    if (userClient) {
      await userClient.close();
      userClient = null;
      userDb = null;
      console.log('✅ [MONGODB_FRAMEWORK] User MongoDB connection closed');
    }
    // Close default database connection if open
    if (defaultClient) {
      await defaultClient.close();
      defaultClient = null;
      defaultDb = null;
      console.log('✅ [MONGODB_FRAMEWORK] Default MongoDB connection closed');
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
    // In Electron renderer, use IPC for database operations
    if (isElectronRenderer()) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.database?.find) {
        console.log(`🔗 [ELECTRON_IPC] find via IPC: ${this.collectionName}`);
        return {
          sort: (sortSpec: any) => ({
            limit: (limitSpec: any) => ({
              toArray: async () => {
                const findOptions = { ...options, sort: sortSpec, limit: limitSpec };
                return electronAPI.database.find(this.collectionName, filter, findOptions);
              }
            }),
            toArray: async () => {
              const findOptions = { ...options, sort: sortSpec };
              return electronAPI.database.find(this.collectionName, filter, findOptions);
            }
          }),
          limit: (limitSpec: any) => ({
            sort: (sortSpec: any) => ({
              toArray: async () => {
                const findOptions = { ...options, limit: limitSpec, sort: sortSpec };
                return electronAPI.database.find(this.collectionName, filter, findOptions);
              }
            }),
            toArray: async () => {
              const findOptions = { ...options, limit: limitSpec };
              return electronAPI.database.find(this.collectionName, filter, findOptions);
            }
          }),
          toArray: async () => {
            return electronAPI.database.find(this.collectionName, filter, options);
          }
        };
      }
    }

    // Direct database access for web or Electron main process - return cursor-like object
    console.log(`🔗 [DIRECT_DB] find direct access: ${this.collectionName}`);
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
    // In Electron renderer, use IPC for database operations
    if (isElectronRenderer()) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.database?.findOne) {
        console.log(`🔗 [ELECTRON_IPC] findOne via IPC: ${this.collectionName}`);
        return electronAPI.database.findOne(this.collectionName, filter);
      }
    }

    // Direct database access for web or Electron main process
    console.log(`🔗 [DIRECT_DB] findOne direct access: ${this.collectionName}`);
    const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
    const collection = db.collection(this.collectionName);
    return collection.findOne(filter, options);
  }

  /**
   * Universal insertOne operation
   */
  async insertOne(document: any): Promise<any> {
    // In Electron renderer, use IPC for database operations
    if (isElectronRenderer()) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.database?.insertOne) {
        console.log(`🔗 [ELECTRON_IPC] insertOne via IPC: ${this.collectionName}`);
        return electronAPI.database.insertOne(this.collectionName, document);
      }
    }

    // Direct database access for web or Electron main process
    console.log(`🔗 [DIRECT_DB] insertOne direct access: ${this.collectionName}`);
    const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
    const collection = db.collection(this.collectionName);
    return collection.insertOne(document);
  }

  /**
   * Universal updateOne operation
   */
  async updateOne(filter: any, update: any, options: any = {}): Promise<any> {
    // In Electron renderer, use IPC for database operations
    if (isElectronRenderer()) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.database?.updateOne) {
        console.log(`🔗 [ELECTRON_IPC] updateOne via IPC: ${this.collectionName}`);
        return electronAPI.database.updateOne(this.collectionName, filter, update, options);
      }
    }

    // Direct database access for web or Electron main process
    console.log(`🔗 [DIRECT_DB] updateOne direct access: ${this.collectionName}`);
    const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
    const collection = db.collection(this.collectionName);
    return collection.updateOne(filter, update, options);
  }

  /**
   * Universal deleteOne operation
   */
  async deleteOne(filter: any): Promise<any> {
    // In Electron renderer, use IPC for database operations
    if (isElectronRenderer()) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.database?.deleteOne) {
        console.log(`🔗 [ELECTRON_IPC] deleteOne via IPC: ${this.collectionName}`);
        return electronAPI.database.deleteOne(this.collectionName, filter);
      }
    }

    // Direct database access for web or Electron main process
    console.log(`🔗 [DIRECT_DB] deleteOne direct access: ${this.collectionName}`);
    const db = await getDatabaseForCollection(this.collectionName, this.requestedDbName);
    const collection = db.collection(this.collectionName);
    return collection.deleteOne(filter);
  }

  /**
   * Universal insertMany operation
   */
  async insertMany(documents: any[]): Promise<any> {
    // In Electron renderer, use individual insertOne calls or bulk IPC
    if (isElectronRenderer()) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.database?.insertOne) {
        console.log(`🔗 [ELECTRON_IPC] insertMany via multiple IPC calls: ${this.collectionName}`);
        const results = [];
        for (const doc of documents) {
          const result = await electronAPI.database.insertOne(this.collectionName, doc);
          results.push(result);
        }
        return { insertedIds: results.map(r => r.insertedId) };
      }
    }

    // Direct database access for web or Electron main process
    console.log(`🔗 [DIRECT_DB] insertMany direct access: ${this.collectionName}`);
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
    // In Electron renderer, use IPC for database operations
    if (isElectronRenderer()) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.database && 'aggregate' in electronAPI.database) {
        console.log(`🔗 [ELECTRON_IPC] aggregate via IPC: ${this.collectionName}`);
        return (electronAPI.database as any).aggregate(this.collectionName, pipeline);
      }
    }

    // Direct database access for web or Electron main process (complex for IPC)
    console.log(`🔗 [DIRECT_DB] aggregate direct access: ${this.collectionName}`);
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
    // In Electron renderer, use IPC for database operations
    if (isElectronRenderer()) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.database && 'countDocuments' in electronAPI.database) {
        console.log(`🔗 [ELECTRON_IPC] countDocuments via IPC: ${this.collectionName}`);
        return (electronAPI.database as any).countDocuments(this.collectionName, filter);
      }
    }

    // Direct database access for web or Electron main process
    console.log(`🔗 [DIRECT_DB] countDocuments direct access: ${this.collectionName}`);
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
