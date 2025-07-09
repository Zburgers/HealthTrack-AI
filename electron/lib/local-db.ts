/**
 * Electron Main Process - Local Database Manager
 * 
 * This module manages the in-memory MongoDB server instance for the Electron app.
 * It ensures that a single, consistent local database is available for the main process to access.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { DATABASE_NAMES, MONGODB_CONFIG } from '../config/constants';

let mongod: MongoMemoryServer | null = null;
let localClient: MongoClient | null = null;
let localDb: Db | null = null;

/**
 * Starts the local MongoDB server and establishes a connection.
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
 * Gets the local database instance.
 * @throws {Error} if the database is not connected.
 */
export function getLocalDb(): Db {
  if (!localDb) {
    throw new Error('Local database is not connected. Call startLocalDatabase() first.');
  }
  return localDb;
}

/**
 * Gets a specific collection from the local database.
 */
export async function getLocalCollection<T extends Document = Document>(collectionName: string) {
  const db = getLocalDb();
  return db.collection<T>(collectionName);
}
