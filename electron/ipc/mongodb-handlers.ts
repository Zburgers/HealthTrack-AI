import { ipcMain, dialog } from 'electron';
import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// MongoDB connections for Electron main process
let defaultMongoClient: MongoClient | null = null; // For embeddings (always uses env URI)
let defaultMongoDb: Db | null = null;

let userMongoClient: MongoClient | null = null; // For user data (uses configurable URI)
let userMongoDb: Db | null = null;

// URI management
let userMongoUri: string | null = null;
const USER_URI_FILE_PATH = path.join(app.getPath('userData'), 'mongodb-uri.json');

/**
 * Load user MongoDB URI from persistent storage
 */
function loadUserMongoUri(): string | null {
  try {
    if (fs.existsSync(USER_URI_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(USER_URI_FILE_PATH, 'utf-8'));
      return data.uri || null;
    }
  } catch (error) {
    console.warn('❌ [MONGODB_IPC] Failed to load user MongoDB URI:', error);
  }
  return null;
}

/**
 * Save user MongoDB URI to persistent storage
 */
function saveUserMongoUri(uri: string): void {
  try {
    const dir = path.dirname(USER_URI_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(USER_URI_FILE_PATH, JSON.stringify({ uri }));
  } catch (error) {
    console.error('❌ [MONGODB_IPC] Failed to save user MongoDB URI:', error);
    throw error;
  }
}

/**
 * Initialize default MongoDB connection (for embeddings - always uses env URI)
 */
async function initializeDefaultMongoDBConnection(): Promise<void> {
  if (defaultMongoDb) {
    return; // Already connected
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable not set');
    }

    console.log('🔗 [MONGODB_IPC] Initializing default MongoDB connection (embeddings)...');
    
    defaultMongoClient = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false, // Allow $vectorSearch
        deprecationErrors: true,
      },
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    await defaultMongoClient.connect();
    defaultMongoDb = defaultMongoClient.db('healthtrack');
    
    console.log('✅ [MONGODB_IPC] Default MongoDB connected (embeddings)');
  } catch (error) {
    console.error('❌ [MONGODB_IPC] Failed to connect to default MongoDB:', error);
    throw error;
  }
}

/**
 * Initialize user MongoDB connection (for user data - uses configurable URI)
 */
async function initializeUserMongoDBConnection(): Promise<void> {
  try {
    // Load user URI, fallback to env URI if not configured
    userMongoUri = loadUserMongoUri() || process.env.MONGODB_URI || null;
    
    if (!userMongoUri) {
      throw new Error('No MongoDB URI available for user data. Please configure your database connection.');
    }

    console.log('🔗 [MONGODB_IPC] Initializing user MongoDB connection...');
    
    // Close existing connection if any
    if (userMongoClient) {
      await userMongoClient.close();
    }
    
    userMongoClient = new MongoClient(userMongoUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
      },
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000, // Increased timeout for better UX
      connectTimeoutMS: 8000,
    });

    await userMongoClient.connect();
    
    // Test the connection with a ping
    await userMongoClient.db('admin').command({ ping: 1 });
    
    userMongoDb = userMongoClient.db('healthtrack');
    
    console.log('✅ [MONGODB_IPC] User MongoDB connected successfully');
  } catch (error) {
    console.error('❌ [MONGODB_IPC] Failed to connect to user MongoDB:', error);
    
    // Clean up failed connection
    if (userMongoClient) {
      try {
        await userMongoClient.close();
      } catch (closeError) {
        console.error('Error closing failed connection:', closeError);
      }
      userMongoClient = null;
      userMongoDb = null;
    }
    
    throw error;
  }
}

/**
 * Get appropriate MongoDB database instance based on collection
 */
function getMongoDatabase(collection?: string): Db {
  // Use default DB for embeddings, user DB for everything else
  if (collection === 'case_embeddings') {
    if (!defaultMongoDb) {
      throw new Error('Default MongoDB not initialized. Call initializeDefaultMongoDBConnection() first.');
    }
    return defaultMongoDb;
  } else {
    if (!userMongoDb) {
      throw new Error('User MongoDB not initialized. Call initializeUserMongoDBConnection() first.');
    }
    return userMongoDb;
  }
}

/**
 * Setup MongoDB-based IPC handlers
 */
export function setupMongoDBIpcHandlers(): void {
  console.log('🔌 [MONGODB_IPC] Setting up MongoDB IPC handlers...');

  // Initialize default MongoDB connection for embeddings (lazy loading)
  let defaultInitialized = false;
  const ensureDefaultConnection = async () => {
    if (!defaultInitialized) {
      await initializeDefaultMongoDBConnection();
      defaultInitialized = true;
    }
  };

  // Initialize user MongoDB connection (lazy loading)
  let userInitialized = false;
  const ensureUserConnection = async () => {
    if (!userInitialized) {
      await initializeUserMongoDBConnection();
      userInitialized = true;
    }
  };

  // Database health check with lazy loading
  ipcMain.handle('db-health', async (): Promise<any> => {
    try {
      console.log('🏥 [MONGODB_IPC] Checking MongoDB health...');
      
      // Ensure user connection is initialized
      await ensureUserConnection();
      
      const db = getMongoDatabase();
      await db.admin().ping();
      
      const result = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        type: 'mongodb',
        details: 'MongoDB is responding to queries',
        connectionInfo: {
          uri: userMongoUri?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Not configured',
          database: 'healthtrack'
        }
      };
      console.log('✅ [MONGODB_IPC] MongoDB health: ok');
      return result;
    } catch (error) {
      console.error('❌ [MONGODB_IPC] Health check failed:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        type: 'mongodb',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to connect to MongoDB. Please check your connection string and ensure your IP is whitelisted.'
      };
    }
  });

  // Database info
  ipcMain.handle('db-getInfo', async (): Promise<any> => {
    try {
      console.log('🔍 [MONGODB_IPC] Getting MongoDB database info...');
      
      // Get info from both connections
      const defaultDb = getMongoDatabase('case_embeddings');
      const userDb = getMongoDatabase('patients');
      
      // Get collection information
      const collections = await userDb.listCollections().toArray();
      const collectionsInfo = [];
      
      for (const collection of collections) {
        try {
          const count = await userDb.collection(collection.name).estimatedDocumentCount();
          collectionsInfo.push({
            name: collection.name,
            count: count,
            location: collection.name === 'case_embeddings' ? 'remote (embeddings)' : 'remote (user)'
          });
        } catch (error) {
          console.warn(`Failed to get count for collection ${collection.name}:`, error);
          collectionsInfo.push({
            name: collection.name,
            count: 0,
            location: collection.name === 'case_embeddings' ? 'remote (embeddings)' : 'remote (user)'
          });
        }
      }

      // Add embeddings collection info if it's not in the user DB
      if (!collectionsInfo.find(c => c.name === 'case_embeddings')) {
        try {
          const embeddingsCount = await defaultDb.collection('case_embeddings').estimatedDocumentCount();
          collectionsInfo.push({
            name: 'case_embeddings',
            count: embeddingsCount,
            location: 'remote (embeddings)'
          });
        } catch (error) {
          console.warn('Failed to get embeddings collection count:', error);
          collectionsInfo.push({
            name: 'case_embeddings',
            count: 0,
            location: 'remote (embeddings)'
          });
        }
      }

      return {
        type: 'remote',
        remoteHost: 'MongoDB Atlas',
        collections: collectionsInfo,
        totalSize: 'N/A',
        connectionInfo: {
          isConnected: !!defaultMongoDb,
          uri: process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Not configured',
          host: 'MongoDB Atlas (Embeddings)',
          database: 'healthtrack'
        },
        remoteConnectionInfo: {
          isConnected: !!userMongoDb,
          uri: userMongoUri?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Not configured',
          host: 'MongoDB Atlas (User Data)',
          database: 'healthtrack'
        },
        lastBackup: null
      };
    } catch (error) {
      console.error('❌ [MONGODB_IPC] Failed to get database info:', error);
      throw error;
    }
  });

  // Database operations
  ipcMain.handle('db-findOne', async (event, collection: string, query: any) => {
    try {
      console.log(`🔍 [MONGODB_IPC] Finding one in ${collection} with query:`, query);
      const db = getMongoDatabase(collection);
      const result = await db.collection(collection).findOne(query);
      console.log(`✅ [MONGODB_IPC] findOne result for ${collection}:`, result ? 'found' : 'not found');
      return result;
    } catch (error) {
      console.error(`❌ [MONGODB_IPC] Failed to findOne in ${collection}:`, error);
      throw error;
    }
  });

  ipcMain.handle('db-find', async (event, collection: string, query: any, options: any = {}) => {
    try {
      console.log(`🔍 [MONGODB_IPC] Finding in ${collection} with query:`, query, 'options:', options);
      const db = getMongoDatabase(collection);
      
      let cursor = db.collection(collection).find(query);
      
      if (options.sort) {
        cursor = cursor.sort(options.sort);
      }
      if (options.limit) {
        cursor = cursor.limit(options.limit);
      }
      if (options.skip) {
        cursor = cursor.skip(options.skip);
      }
      
      const result = await cursor.toArray();
      console.log(`✅ [MONGODB_IPC] find result for ${collection}: ${result.length} documents`);
      return result;
    } catch (error) {
      console.error(`❌ [MONGODB_IPC] Failed to find in ${collection}:`, error);
      throw error;
    }
  });

  ipcMain.handle('db-insertOne', async (event, collection: string, document: any) => {
    try {
      console.log(`📝 [MONGODB_IPC] Inserting one in ${collection}:`, document);
      const db = getMongoDatabase(collection);
      const result = await db.collection(collection).insertOne(document);
      console.log(`✅ [MONGODB_IPC] insertOne result for ${collection}:`, result.insertedId);
      return result;
    } catch (error) {
      console.error(`❌ [MONGODB_IPC] Failed to insertOne in ${collection}:`, error);
      throw error;
    }
  });

  ipcMain.handle('db-updateOne', async (event, collection: string, filter: any, update: any, options: any = {}) => {
    try {
      console.log(`📝 [MONGODB_IPC] Updating one in ${collection}:`, filter, update);
      const db = getMongoDatabase(collection);
      const result = await db.collection(collection).updateOne(filter, update, options);
      console.log(`✅ [MONGODB_IPC] updateOne result for ${collection}:`, result.modifiedCount, 'modified');
      return result;
    } catch (error) {
      console.error(`❌ [MONGODB_IPC] Failed to updateOne in ${collection}:`, error);
      throw error;
    }
  });

  ipcMain.handle('db-deleteOne', async (event, collection: string, filter: any) => {
    try {
      console.log(`🗑️ [MONGODB_IPC] Deleting one in ${collection}:`, filter);
      const db = getMongoDatabase(collection);
      const result = await db.collection(collection).deleteOne(filter);
      console.log(`✅ [MONGODB_IPC] deleteOne result for ${collection}:`, result.deletedCount, 'deleted');
      return result;
    } catch (error) {
      console.error(`❌ [MONGODB_IPC] Failed to deleteOne in ${collection}:`, error);
      throw error;
    }
  });

  ipcMain.handle('db-countDocuments', async (event, collection: string, filter: any = {}) => {
    try {
      console.log(`📊 [MONGODB_IPC] Counting documents in ${collection}:`, filter);
      const db = getMongoDatabase(collection);
      const result = await db.collection(collection).countDocuments(filter);
      console.log(`✅ [MONGODB_IPC] countDocuments result for ${collection}:`, result);
      return result;
    } catch (error) {
      console.error(`❌ [MONGODB_IPC] Failed to countDocuments in ${collection}:`, error);
      throw error;
    }
  });

  // Database operations for aggregate queries
  ipcMain.handle('db-aggregate', async (event, collection: string, pipeline: any[]) => {
    try {
      console.log(`🔍 [MONGODB_IPC] Aggregating in ${collection} with pipeline:`, pipeline);
      const db = getMongoDatabase(collection);
      const result = await db.collection(collection).aggregate(pipeline).toArray();
      console.log(`✅ [MONGODB_IPC] aggregate result for ${collection}: ${result.length} documents`);
      return result;
    } catch (error) {
      console.error(`❌ [MONGODB_IPC] Failed to aggregate in ${collection}:`, error);
      throw error;
    }
  });

  // URI Management handlers
  ipcMain.handle('db-getUserMongoUri', async (): Promise<string | null> => {
    try {
      console.log('🔍 [MONGODB_IPC] Getting user MongoDB URI...');
      const uri = loadUserMongoUri();
      if (uri) {
        console.log('✅ [MONGODB_IPC] User MongoDB URI found');
      } else {
        console.log('ℹ️ [MONGODB_IPC] No user MongoDB URI configured');
      }
      return uri;
    } catch (error) {
      console.error('❌ [MONGODB_IPC] Failed to get user MongoDB URI:', error);
      return null;
    }
  });

  ipcMain.handle('db-setUserMongoUri', async (event, uri: string): Promise<boolean> => {
    try {
      console.log('🔧 [MONGODB_IPC] Setting user MongoDB URI...');
      
      // Validate URI format
      const url = new URL(uri);
      if (!url.protocol.startsWith('mongodb')) {
        throw new Error('Invalid MongoDB URI: must start with mongodb:// or mongodb+srv://');
      }

      // Test the connection before saving
      console.log('🧪 [MONGODB_IPC] Testing new MongoDB URI...');
      const testClient = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: false,
          deprecationErrors: true,
        },
        serverSelectionTimeoutMS: 5000,  // Reduced timeout
        connectTimeoutMS: 5000,          // Reduced timeout
        socketTimeoutMS: 5000,           // Added socket timeout
        maxPoolSize: 1,                  // Minimal pool for testing
      });

      try {
        console.log('🔗 [MONGODB_IPC] Attempting test connection...');
        await Promise.race([
          testClient.connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout after 5 seconds')), 5000)
          )
        ]);
        
        console.log('🏓 [MONGODB_IPC] Performing ping test...');
        await Promise.race([
          testClient.db('admin').command({ ping: 1 }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Ping timeout after 3 seconds')), 3000)
          )
        ]);
        
        console.log('🔒 [MONGODB_IPC] Closing test connection...');
        await testClient.close();
        console.log('✅ [MONGODB_IPC] Test connection successful');
        
      } catch (testError) {
        console.error('❌ [MONGODB_IPC] Connection test failed:', testError);
        try {
          await testClient.close();
        } catch (closeError) {
          console.warn('⚠️ [MONGODB_IPC] Error closing test client:', closeError);
        }
        throw new Error(`Connection test failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`);
      }

      // Save the URI and reinitialize connection
      console.log('💾 [MONGODB_IPC] Saving MongoDB URI to persistent storage...');
      saveUserMongoUri(uri);
      userMongoUri = uri;
      
      // Reset the user connection to force reinitialization
      if (userMongoClient) {
        console.log('🔄 [MONGODB_IPC] Resetting existing connection...');
        await userMongoClient.close();
        userMongoClient = null;
        userMongoDb = null;
      }

      console.log('✅ [MONGODB_IPC] MongoDB URI saved and validated successfully');
      return true;
    } catch (error) {
      console.error('❌ [MONGODB_IPC] Failed to set user MongoDB URI:', error);
      throw error;
    }
  });

  console.log('✅ [MONGODB_IPC] MongoDB IPC handlers setup complete');
}

/**
 * Close MongoDB connections
 */
export async function closeMongoDBConnection(): Promise<void> {
  const promises = [];
  
  if (defaultMongoClient) {
    promises.push(defaultMongoClient.close().then(() => {
      defaultMongoClient = null;
      defaultMongoDb = null;
      console.log('✅ [MONGODB_IPC] Default MongoDB connection closed');
    }));
  }
  
  if (userMongoClient) {
    promises.push(userMongoClient.close().then(() => {
      userMongoClient = null;
      userMongoDb = null;
      console.log('✅ [MONGODB_IPC] User MongoDB connection closed');
    }));
  }
  
  await Promise.all(promises);
  console.log('✅ [MONGODB_IPC] All MongoDB connections closed');
}

/**
 * Health check for default MongoDB connection (embeddings)
 */
async function checkDefaultMongoHealth(): Promise<{ connected: boolean; error?: string; uri?: string }> {
  try {
    if (!defaultMongoClient || !defaultMongoDb) {
      await initializeDefaultMongoDBConnection();
    }
    
    await defaultMongoDb!.admin().ping();
    return { 
      connected: true, 
      uri: process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Not configured'
    };
  } catch (error) {
    console.error('❌ [MONGODB_IPC] Default MongoDB health check failed:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      uri: process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Not configured'
    };
  }
}

/**
 * Health check for user MongoDB connection (user data)
 */
async function checkUserMongoHealth(): Promise<{ connected: boolean; error?: string; uri?: string }> {
  try {
    if (!userMongoClient || !userMongoDb) {
      await initializeUserMongoDBConnection();
    }
    
    await userMongoDb!.admin().ping();
    return { 
      connected: true,
      uri: userMongoUri?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Using default URI'
    };
  } catch (error) {
    console.error('❌ [MONGODB_IPC] User MongoDB health check failed:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      uri: userMongoUri?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Using default URI'
    };
  }
}
