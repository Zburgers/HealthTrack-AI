/**
 * Electron Main Process - Local Database Manager
 * 
 * This module manages the in-memory MongoDB server instance for the Electron app.
 * It ensures that a single, consistent local database is available for the main process to access.
 */


import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { DATABASE_NAMES, MONGODB_CONFIG } from '../config/constants';
import { getDataSourceManager } from './DataSourceManager';

let mongod: MongoMemoryServer | null = null;
let localClient: MongoClient | null = null;
let localDb: Db | null = null;

/**
 * Starts the local MongoDB server and establishes a connection.
 * Now with Switchboard integration for unified management.
 */
export async function startLocalDatabase(): Promise<void> {
  if (mongod) {
    console.log('📊 [LOCAL-DB] Database already running');
    return;
  }
  try {
    console.log('📊 [LOCAL-DB] Starting MongoDB memory server...');
    mongod = await MongoMemoryServer.create({ instance: { port: MONGODB_CONFIG.LOCAL_PORT } });
    const uri = mongod.getUri();
    
    console.log('📊 [LOCAL-DB] Connecting to database...');
    localClient = new MongoClient(uri, MONGODB_CONFIG.LOCAL_OPTIONS);
    await localClient.connect();
    localDb = localClient.db(DATABASE_NAMES.LOCAL);
    
    // Register with Switchboard after successful connection
    try {
      const dataSourceManager = getDataSourceManager();
      
      // Connect the memory data source through Switchboard
      await dataSourceManager.connectDataSource('mongodb-memory', { 
        autoConnect: true,
        purpose: 'local-development',
        uri: uri
      });
      
      console.log('📊 [LOCAL-DB] Connected to Switchboard architecture');
    } catch (switchboardError) {
      console.warn('⚠️ [LOCAL-DB] Failed to register with Switchboard:', switchboardError);
      console.log('📊 [LOCAL-DB] Continuing with direct connection');
    }
    
    console.log(`✅ [LOCAL-DB] Database ready at ${uri}`);
  } catch (error) {
    console.error('❌ [LOCAL-DB] Failed to start database:', error);
    await stopLocalDatabase();
    throw error;
  }
}

/**
 * Stops the local MongoDB server and closes the connection.
 */
export async function stopLocalDatabase(): Promise<void> {
  try {
    // Try to disconnect via Switchboard first
    try {
      const dataSourceManager = getDataSourceManager();
      const sources = dataSourceManager.getConnectionInfo();
      const memorySource = sources.find(s => s.id === 'mongodb-memory' && s.isActive);
      
      if (memorySource) {
        await dataSourceManager.disconnectActiveSource();
        console.log('📊 [LOCAL-DB] Disconnected from Switchboard architecture');
      }
    } catch (switchboardError) {
      console.warn('⚠️ [LOCAL-DB] Failed to disconnect from Switchboard:', switchboardError);
    }
    
    // Proceed with direct disconnection
    if (localClient) {
      await localClient.close();
      localClient = null;
      localDb = null;
      console.log('Local MongoDB client disconnected.');
    }
    if (mongod) {
      await mongod.stop();
      mongod = null;
      console.log('Local MongoDB server stopped.');
    }
  } catch (error) {
    console.error('❌ Error stopping local database:', error);
  }
}

/**
 * Check if local database is initialized either directly or via Switchboard
 */
export function isLocalDatabaseInitialized(): boolean {
  // Check direct connection first
  if (!!localDb) {
    return true;
  }
  
  // Also check Switchboard connection
  try {
    const dataSourceManager = getDataSourceManager();
    const status = dataSourceManager.getActiveStatus();
    if (status.sourceId === 'mongodb-memory' && status.status === 'connected') {
      return true;
    }
  } catch (error) {
    // Ignore errors checking Switchboard
  }
  
  return false;
}

/**
 * Gets the local database instance.
 * @throws {Error} if the database is not connected.
 */
export function getLocalDb(): Db {
  // Try direct access first
  if (localDb) {
    return localDb;
  }
  
  // Try to access via Switchboard as fallback
  try {
    const dataSourceManager = getDataSourceManager();
    const status = dataSourceManager.getActiveStatus();
    
    if (status.sourceId === 'mongodb-memory' && status.status === 'connected') {
      // Instead of throwing, trigger a lazy connection
      console.log('🔄 [LOCAL-DB] Using Switchboard connection...');
      
      // Return a dummy Db that will forward queries to Switchboard
      // This is a temporary solution during migration
      const dummyDb = {
        collection: (collectionName: string) => {
          return {
            find: (query: any, options?: any) => {
              const cursor = {
                sort: () => cursor,
                limit: () => cursor,
                skip: () => cursor,
                toArray: async () => {
                  return dataSourceManager.executeActiveSourceQuery({
                    type: `${collectionName}.find`,
                    params: { filter: query, options },
                    rawQuery: null
                  });
                }
              };
              return cursor;
            },
            findOne: async (query: any) => {
              return dataSourceManager.executeActiveSourceQuery({
                type: `${collectionName}.findOne`,
                params: { filter: query },
                rawQuery: null
              });
            },
            insertOne: async (doc: any) => {
              return dataSourceManager.executeActiveSourceQuery({
                type: `${collectionName}.insertOne`,
                params: { document: doc },
                rawQuery: null
              });
            },
            updateOne: async (filter: any, update: any, options?: any) => {
              return dataSourceManager.executeActiveSourceQuery({
                type: `${collectionName}.updateOne`,
                params: { filter, update, options },
                rawQuery: null
              });
            },
            deleteOne: async (filter: any) => {
              return dataSourceManager.executeActiveSourceQuery({
                type: `${collectionName}.deleteOne`,
                params: { filter },
                rawQuery: null
              });
            },
            countDocuments: async (filter: any = {}) => {
              return dataSourceManager.executeActiveSourceQuery({
                type: `${collectionName}.count`,
                params: { filter },
                rawQuery: null
              });
            }
          };
        },
        command: async (command: any) => {
          if (command.ping) {
            return { ok: 1 }; // Mock ping response
          }
          throw new Error('Command not implemented in Switchboard bridge');
        },
        admin: () => {
          return {
            ping: async () => ({ ok: 1 }) // Mock admin ping
          };
        }
      } as unknown as Db;
      
      return dummyDb;
    }
  } catch (error) {
    console.error('❌ [LOCAL-DB] Failed to get Switchboard database:', error);
  }
  
  // Still no database, throw error
  throw new Error('Local database is not connected. Call startLocalDatabase() first.');
}

/**
 * Gets a specific collection from the local database.
 */
export async function getLocalCollection<T extends Document = Document>(collectionName: string) {
  const db = getLocalDb();
  return db.collection<T>(collectionName);
}
