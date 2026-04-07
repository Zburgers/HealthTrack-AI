import { ipcMain, dialog } from 'electron';
import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { getDataSourceManager } from '../lib/DataSourceManager';

// 🎯 Use Switchboard for central database management
const dataSourceManager = getDataSourceManager();

// Legacy MongoDB connections for Electron main process (bridged to Switchboard)
let defaultMongoClient: MongoClient | null = null; // For embeddings (always uses env URI)
let defaultMongoDb: Db | null = null;

let userMongoClient: MongoClient | null = null; // For user data (uses configurable URI)
let userMongoDb: Db | null = null;

// URI management
let userMongoUri: string | null = null;
const USER_URI_FILE_PATH = path.join(app.getPath('userData'), 'healthtrack-settings.json');

/**
 * Load user MongoDB URI from persistent storage
 */
function loadUserMongoUri(): string | null {
  try {
    // 1. Try to load from user data directory
    if (fs.existsSync(USER_URI_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(USER_URI_FILE_PATH, 'utf-8'));
      if (data.uri || data.mongoUri) {
        console.log('📄 [MONGODB_IPC] Found MongoDB URI in user data settings');
        return data.uri || data.mongoUri || null;
      }
    }
    
    // 2. Try to load from app root directory
    const appRootPath = path.join(process.cwd(), 'healthtrack-settings.json');
    if (fs.existsSync(appRootPath)) {
      const data = JSON.parse(fs.readFileSync(appRootPath, 'utf-8'));
      if (data.uri || data.mongoUri) {
        console.log('📄 [MONGODB_IPC] Found MongoDB URI in app root settings');
        return data.uri || data.mongoUri || null;
      }
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
    // Save to both locations for backward compatibility
    
    // 1. Save to user data directory (for electron app persistence)
    const dir = path.dirname(USER_URI_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Load existing settings if available to preserve other settings
    let userDataSettings = {};
    if (fs.existsSync(USER_URI_FILE_PATH)) {
      try {
        userDataSettings = JSON.parse(fs.readFileSync(USER_URI_FILE_PATH, 'utf-8'));
      } catch (parseError) {
        console.warn('⚠️ [MONGODB_IPC] Failed to parse existing user data settings, creating new file');
      }
    }
    
    // Merge with existing settings
    const updatedUserSettings = { 
      ...userDataSettings,
      uri, 
      mongoUri: uri  // Store under both keys for compatibility
    };
    
    fs.writeFileSync(USER_URI_FILE_PATH, JSON.stringify(updatedUserSettings, null, 2));
    
    // 2. Save to app root directory (for next.js server access)
    const appRootPath = path.join(process.cwd(), 'healthtrack-settings.json');
    
    // Load existing app root settings if available
    let appRootSettings = {};
    if (fs.existsSync(appRootPath)) {
      try {
        appRootSettings = JSON.parse(fs.readFileSync(appRootPath, 'utf-8'));
      } catch (parseError) {
        console.warn('⚠️ [MONGODB_IPC] Failed to parse existing app root settings, creating new file');
      }
    }
    
    // Merge with existing settings
    const updatedRootSettings = { 
      ...appRootSettings,
      uri, 
      mongoUri: uri  // Store under both keys for compatibility
    };
    
    fs.writeFileSync(appRootPath, JSON.stringify(updatedRootSettings, null, 2));
    
    // Update the local variable
    userMongoUri = uri;
    
    console.log('💾 [MONGODB_IPC] Saved MongoDB URI to both user data and app root directories');
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
    
    // 🎯 Try to use Switchboard first
    try {
      console.log('🎯 [MONGODB_IPC] Using Switchboard for case embeddings connection...');
      await dataSourceManager.connectDataSource('mongodb-atlas', {
        uri: MONGODB_URI,
        purpose: 'case-embeddings',
        autoConnect: true
      });
      
      // Get active source status to verify connection
      const status = await dataSourceManager.getActiveSourceConnectionInfo();
      if (!status) {
        throw new Error('Failed to get Switchboard connection status');
      }
      
      console.log('✅ [MONGODB_IPC] Default MongoDB connected via Switchboard');
      
      // For legacy compatibility, still initialize the direct connection
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
      
    } catch (switchboardError) {
      console.warn('⚠️ [MONGODB_IPC] Switchboard connection failed, falling back to direct connection:', switchboardError);
      
      // Fallback to direct connection
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
    }
    
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

  // Database health check with Switchboard integration
  ipcMain.handle('db-health', async (): Promise<any> => {
    try {
      console.log('🏥 [MONGODB_IPC] Checking MongoDB health via Switchboard...');
      
      // Check if we have an active source in the Switchboard
      const activeStatus = dataSourceManager.getActiveStatus();
      const connectionInfo = await dataSourceManager.getActiveSourceConnectionInfo();
      
      if (activeStatus && activeStatus.status === 'connected' && connectionInfo) {
        console.log('✅ [MONGODB_IPC] MongoDB health via Switchboard: ok');
        return {
          status: 'ok',
          timestamp: new Date().toISOString(),
          type: 'mongodb',
          details: 'MongoDB is responding to queries',
          connectionInfo: {
            uri: connectionInfo.uri || 'Not configured',
            database: connectionInfo.database || 'healthtrack',
            source: activeStatus.sourceId,
            sourceName: activeStatus.name
          }
        };
      }
      
      // Fallback to legacy connection if Switchboard has no active source
      console.log('🔄 [MONGODB_IPC] Fallback to legacy health check');
      await ensureUserConnection();
      
      const db = getMongoDatabase();
      await db.admin().ping();
      
      const result = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        type: 'mongodb',
        details: 'MongoDB is responding to queries (legacy connection)',
        connectionInfo: {
          uri: userMongoUri?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Not configured',
          database: 'healthtrack'
        }
      };
      console.log('✅ [MONGODB_IPC] MongoDB health: ok (legacy)');
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

  // Database info with Switchboard integration
  ipcMain.handle('db-getInfo', async (): Promise<any> => {
    try {
      console.log('🔍 [MONGODB_IPC] Getting MongoDB database info via Switchboard...');
      
      // Try to get data sources info from Switchboard
      const connectionInfo = dataSourceManager.getConnectionInfo();
      const activeSourceInfo = await dataSourceManager.getActiveSourceConnectionInfo();
      
      // If Switchboard has connections, use those first
      if (connectionInfo.length > 0) {
        try {
          // Get active source information
          const activeStatus = dataSourceManager.getActiveStatus();
          const mainSourceId = activeStatus.sourceId || connectionInfo[0].id;
          
          // Execute query through Switchboard for collections info
          const collectionsInfo = await dataSourceManager.executeActiveSourceQuery<any[]>({
            type: 'raw',
            params: {},
            rawQuery: async (db: any) => {
              const collections = await db.listCollections().toArray();
              const result = [];
              
              for (const collection of collections) {
                try {
                  const count = await db.collection(collection.name).estimatedDocumentCount();
                  result.push({
                    name: collection.name,
                    count: count,
                    location: collection.name === 'case_embeddings' ? 'remote (embeddings)' : 'remote (user)'
                  });
                } catch (countError) {
                  console.warn(`Failed to get count for collection ${collection.name}:`, countError);
                  result.push({
                    name: collection.name,
                    count: 0,
                    location: collection.name === 'case_embeddings' ? 'remote (embeddings)' : 'remote (user)'
                  });
                }
              }
              return result;
            }
          });
          
          return {
            type: 'remote',
            remoteHost: 'MongoDB Atlas (via Switchboard)',
            collections: collectionsInfo || [],
            totalSize: 'N/A',
            connectionInfo: {
              isConnected: activeSourceInfo?.isConnected || false,
              uri: activeSourceInfo?.uri || 'Not configured via Switchboard',
              host: `${activeStatus.name || 'MongoDB Atlas'} (${activeStatus.purpose || 'default'})`,
              database: activeSourceInfo?.database || 'healthtrack'
            },
            dataSources: connectionInfo.map(src => ({
              id: src.id,
              name: src.name,
              status: src.status,
              purpose: src.purpose,
              isActive: src.isActive
            })),
            lastBackup: null
          };
        } catch (switchboardError) {
          console.warn('⚠️ [MONGODB_IPC] Switchboard query failed, falling back to legacy:', switchboardError);
        }
      }
      
      // Fallback to legacy connection
      console.log('🔄 [MONGODB_IPC] Fallback to legacy database info');
      
      // Get info from both legacy connections
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
        remoteHost: 'MongoDB Atlas (Legacy)',
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
      
      // Try Switchboard first
      try {
        const result = await dataSourceManager.executeActiveSourceQuery<any>({
          type: `${collection}.findOne`,
          params: { filter: query },
          rawQuery: async (db: any) => {
            return await db.collection(collection).findOne(query);
          }
        });
        console.log(`✅ [MONGODB_IPC] findOne result for ${collection} via Switchboard:`, result ? 'found' : 'not found');
        return result;
      } catch (switchboardError) {
        console.warn(`⚠️ [MONGODB_IPC] Switchboard findOne failed, falling back to legacy:`, switchboardError);
      }
      
      // Fallback to legacy connection
      const db = getMongoDatabase(collection);
      const result = await db.collection(collection).findOne(query);
      console.log(`✅ [MONGODB_IPC] findOne result for ${collection} via legacy:`, result ? 'found' : 'not found');
      return result;
    } catch (error) {
      console.error(`❌ [MONGODB_IPC] Failed to findOne in ${collection}:`, error);
      throw error;
    }
  });

  ipcMain.handle('db-find', async (event, collection: string, query: any, options: any = {}) => {
    try {
      console.log(`🔍 [MONGODB_IPC] Finding in ${collection} with query:`, query, 'options:', options);
      
      // Try Switchboard first
      try {
        const result = await dataSourceManager.executeActiveSourceQuery<any[]>({
          type: `${collection}.find`,
          params: { filter: query, options },
          rawQuery: async (db: any) => {
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
            
            return await cursor.toArray();
          }
        });
        console.log(`✅ [MONGODB_IPC] find result for ${collection} via Switchboard: ${result.length} documents`);
        return result;
      } catch (switchboardError) {
        console.warn(`⚠️ [MONGODB_IPC] Switchboard find failed, falling back to legacy:`, switchboardError);
      }
      
      // Fallback to legacy connection
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
      console.log(`✅ [MONGODB_IPC] find result for ${collection} via legacy: ${result.length} documents`);
      return result;
    } catch (error) {
      console.error(`❌ [MONGODB_IPC] Failed to find in ${collection}:`, error);
      throw error;
    }
  });

  ipcMain.handle('db-insertOne', async (event, collection: string, document: any) => {
    try {
      console.log(`📝 [MONGODB_IPC] Inserting one in ${collection}:`, document);
      
      // Try Switchboard first
      try {
        const result = await dataSourceManager.executeActiveSourceQuery<any>({
          type: `${collection}.insertOne`,
          params: { document },
          rawQuery: async (db: any) => {
            return await db.collection(collection).insertOne(document);
          }
        });
        console.log(`✅ [MONGODB_IPC] insertOne result for ${collection} via Switchboard:`, result.insertedId);
        return result;
      } catch (switchboardError) {
        console.warn(`⚠️ [MONGODB_IPC] Switchboard insertOne failed, falling back to legacy:`, switchboardError);
      }
      
      // Fallback to legacy connection
      const db = getMongoDatabase(collection);
      const result = await db.collection(collection).insertOne(document);
      console.log(`✅ [MONGODB_IPC] insertOne result for ${collection} via legacy:`, result.insertedId);
      return result;
    } catch (error) {
      console.error(`❌ [MONGODB_IPC] Failed to insertOne in ${collection}:`, error);
      throw error;
    }
  });

  ipcMain.handle('db-updateOne', async (event, collection: string, filter: any, update: any, options: any = {}) => {
    try {
      console.log(`📝 [MONGODB_IPC] Updating one in ${collection}:`, filter, update);
      
      // Try Switchboard first
      try {
        const result = await dataSourceManager.executeActiveSourceQuery<any>({
          type: `${collection}.updateOne`,
          params: { filter, update, options },
          rawQuery: async (db: any) => {
            return await db.collection(collection).updateOne(filter, update, options);
          }
        });
        console.log(`✅ [MONGODB_IPC] updateOne result for ${collection} via Switchboard:`, result.modifiedCount, 'modified');
        return result;
      } catch (switchboardError) {
        console.warn(`⚠️ [MONGODB_IPC] Switchboard updateOne failed, falling back to legacy:`, switchboardError);
      }
      
      // Fallback to legacy connection
      const db = getMongoDatabase(collection);
      const result = await db.collection(collection).updateOne(filter, update, options);
      console.log(`✅ [MONGODB_IPC] updateOne result for ${collection} via legacy:`, result.modifiedCount, 'modified');
      return result;
    } catch (error) {
      console.error(`❌ [MONGODB_IPC] Failed to updateOne in ${collection}:`, error);
      throw error;
    }
  });

  ipcMain.handle('db-deleteOne', async (event, collection: string, filter: any) => {
    try {
      console.log(`🗑️ [MONGODB_IPC] Deleting one in ${collection}:`, filter);
      
      // Try Switchboard first
      try {
        const result = await dataSourceManager.executeActiveSourceQuery<any>({
          type: `${collection}.deleteOne`,
          params: { filter },
          rawQuery: async (db: any) => {
            return await db.collection(collection).deleteOne(filter);
          }
        });
        console.log(`✅ [MONGODB_IPC] deleteOne result for ${collection} via Switchboard:`, result.deletedCount, 'deleted');
        return result;
      } catch (switchboardError) {
        console.warn(`⚠️ [MONGODB_IPC] Switchboard deleteOne failed, falling back to legacy:`, switchboardError);
      }
      
      // Fallback to legacy connection
      const db = getMongoDatabase(collection);
      const result = await db.collection(collection).deleteOne(filter);
      console.log(`✅ [MONGODB_IPC] deleteOne result for ${collection} via legacy:`, result.deletedCount, 'deleted');
      return result;
    } catch (error) {
      console.error(`❌ [MONGODB_IPC] Failed to deleteOne in ${collection}:`, error);
      throw error;
    }
  });

  ipcMain.handle('db-countDocuments', async (event, collection: string, filter: any = {}) => {
    try {
      console.log(`📊 [MONGODB_IPC] Counting documents in ${collection}:`, filter);
      
      // Try Switchboard first
      try {
        const result = await dataSourceManager.executeActiveSourceQuery<number>({
          type: `${collection}.count`,
          params: { filter },
          rawQuery: async (db: any) => {
            return await db.collection(collection).countDocuments(filter);
          }
        });
        console.log(`✅ [MONGODB_IPC] countDocuments result for ${collection} via Switchboard:`, result);
        return result;
      } catch (switchboardError) {
        console.warn(`⚠️ [MONGODB_IPC] Switchboard count failed, falling back to legacy:`, switchboardError);
      }
      
      // Fallback to legacy connection
      const db = getMongoDatabase(collection);
      const result = await db.collection(collection).countDocuments(filter);
      console.log(`✅ [MONGODB_IPC] countDocuments result for ${collection} via legacy:`, result);
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
      
      // Try Switchboard first
      try {
        const result = await dataSourceManager.executeActiveSourceQuery<any[]>({
          type: `${collection}.aggregate`,
          params: { pipeline },
          rawQuery: async (db: any) => {
            return await db.collection(collection).aggregate(pipeline).toArray();
          }
        });
        console.log(`✅ [MONGODB_IPC] aggregate result for ${collection} via Switchboard: ${result.length} documents`);
        return result;
      } catch (switchboardError) {
        console.warn(`⚠️ [MONGODB_IPC] Switchboard aggregate failed, falling back to legacy:`, switchboardError);
      }
      
      // Fallback to legacy connection
      const db = getMongoDatabase(collection);
      const result = await db.collection(collection).aggregate(pipeline).toArray();
      console.log(`✅ [MONGODB_IPC] aggregate result for ${collection} via legacy: ${result.length} documents`);
      return result;
    } catch (error) {
      console.error(`❌ [MONGODB_IPC] Failed to aggregate in ${collection}:`, error);
      throw error;
    }
  });

  // URI Management handlers with Switchboard integration
  ipcMain.handle('db-getUserMongoUri', async (): Promise<string | null> => {
    try {
      console.log('🔍 [MONGODB_IPC] Getting user MongoDB URI...');
      
      // Try to get from Switchboard first
      try {
        const connectionInfo = await dataSourceManager.getActiveSourceConnectionInfo();
        if (connectionInfo?.uri) {
          console.log('✅ [MONGODB_IPC] User MongoDB URI found via Switchboard');
          return connectionInfo.uri;
        }
      } catch (switchboardError) {
        console.warn('⚠️ [MONGODB_IPC] Failed to get URI from Switchboard, falling back to legacy:', switchboardError);
      }
      
      // Fallback to legacy storage
      const uri = loadUserMongoUri();
      if (uri) {
        console.log('✅ [MONGODB_IPC] User MongoDB URI found via legacy storage');
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
      
      // Try to set via Switchboard first
      try {
        console.log('🎯 [MONGODB_IPC] Attempting to connect via Switchboard...');
        await dataSourceManager.connectDataSource('mongodb-atlas', {
          uri: uri,
          purpose: 'user-data',
          autoConnect: false,
          timestamp: Date.now()
        });
        console.log('✅ [MONGODB_IPC] MongoDB URI configured via Switchboard successfully');
        
        // Still save in legacy storage for backward compatibility
        console.log('💾 [MONGODB_IPC] Also saving URI to legacy storage...');
        saveUserMongoUri(uri);
        userMongoUri = uri;
        
        return true;
      } catch (switchboardError) {
        console.warn('⚠️ [MONGODB_IPC] Switchboard connection failed, falling back to legacy:', switchboardError);
      }

      // Fallback to legacy connection testing
      console.log('🧪 [MONGODB_IPC] Testing new MongoDB URI via legacy method...');
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

  // Add testConnection handler for compatibility with the UI
  ipcMain.handle('db-testConnection', async (event, uri: string): Promise<any> => {
    try {
      console.log('🧪 [MONGODB_IPC] Testing MongoDB URI via Switchboard...');
      
      if (!uri) {
        throw new Error('No MongoDB URI provided for testing');
      }
      
      // Try to test connection via Switchboard
      try {
        console.log('🎯 [MONGODB_IPC] Testing connection via Switchboard...');
        await dataSourceManager.connectDataSource('mongodb-atlas', {
          uri: uri,
          purpose: 'connection-test',
          autoConnect: false,
          timestamp: Date.now()
        });
        
        // Get connection status to verify
        const status = await dataSourceManager.getActiveSourceStatus();
        
        if (status && status.status === 'connected') {
          console.log('✅ [MONGODB_IPC] Connection test successful via Switchboard');
          
          // Disconnect from test connection to avoid keeping unnecessary connections
          await dataSourceManager.disconnectActiveSource();
          
          return {
            success: true,
            message: 'Successfully connected to MongoDB',
            status: 'connected'
          };
        } else {
          console.error('❌ [MONGODB_IPC] Connection test failed via Switchboard:', status?.error?.message);
          throw new Error(status?.error?.message || 'Failed to connect to MongoDB');
        }
      } catch (switchboardError) {
        console.warn('⚠️ [MONGODB_IPC] Switchboard test failed, falling back to legacy:', switchboardError);
      }
      
      // Fallback to legacy connection test
      console.log('🧪 [MONGODB_IPC] Testing new MongoDB URI via legacy method...');
      const testClient = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: false,
          deprecationErrors: true,
        },
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 5000,
        maxPoolSize: 1,
      });
      
      await Promise.race([
        testClient.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 5 seconds')), 5000)
        )
      ]);
      
      await Promise.race([
        testClient.db('admin').command({ ping: 1 }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Ping timeout after 3 seconds')), 3000)
        )
      ]);
      
      await testClient.close();
      
      console.log('✅ [MONGODB_IPC] Test connection successful via legacy');
      return {
        success: true,
        message: 'Successfully connected to MongoDB',
        status: 'connected'
      };
    } catch (error) {
      console.error('❌ [MONGODB_IPC] Connection test failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to connect to MongoDB',
        status: 'error'
      };
    }
  });

  console.log('✅ [MONGODB_IPC] MongoDB IPC handlers setup complete');
}

/**
 * Close MongoDB connections
 */
export async function closeMongoDBConnection(): Promise<void> {
  const promises = [];
  
  // First close connections via Switchboard
  try {
    console.log('🎯 [MONGODB_IPC] Disconnecting via Switchboard...');
    promises.push(dataSourceManager.disconnectActiveSource()
      .then(() => {
        console.log('✅ [MONGODB_IPC] Switchboard connections closed successfully');
      })
      .catch((error) => {
        console.error('❌ [MONGODB_IPC] Error closing Switchboard connections:', error);
      })
    );
  } catch (switchboardError) {
    console.warn('⚠️ [MONGODB_IPC] Error during Switchboard disconnect:', switchboardError);
  }
  
  // Also close legacy connections
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
