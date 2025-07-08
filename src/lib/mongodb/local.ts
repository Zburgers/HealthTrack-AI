/**
 * Local MongoDB Connection Module
 * 
 * Handles connections to local embedded MongoDB for Electron app
 * This module provides direct database access for the main process
 */

import { MongoClient, Db } from 'mongodb';
import { DATABASE_NAMES, MONGODB_CONFIG } from './config';

let localClient: MongoClient | null = null;
let localDb: Db | null = null;
let localDbUri: string | null = null;

/**
 * Connect to local MongoDB (for use in Electron main process)
 */
export async function connectToLocalDatabase(uri?: string): Promise<Db> {
  if (localDb && localClient) {
    // Return existing connection if available
    return localDb;
  }

  if (!uri && !localDbUri) {
    throw new Error(
      'Local database URI not provided. Please provide URI or call initializeLocalDatabase first.'
    );
  }

  const connectionUri = uri || localDbUri;
  if (!connectionUri) {
    throw new Error('No local database URI available');
  }

  try {
    // Create new client if needed
    if (!localClient) {
      localClient = new MongoClient(connectionUri, MONGODB_CONFIG.LOCAL_OPTIONS);
    }

    // Connect if not already connected
    if (!localDb) {
      await localClient.connect();
      localDb = localClient.db(DATABASE_NAMES.LOCAL);
      localDbUri = connectionUri;
      console.log('✅ Connected to local MongoDB');
    }

    return localDb;
  } catch (error) {
    console.error('❌ Failed to connect to local MongoDB:', error);
    
    // Reset connections on failure
    localClient = null;
    localDb = null;
    localDbUri = null;
    
    throw new Error(
      `Local MongoDB connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get the local database instance (throws if not connected)
 */
export function getLocalDatabase(): Db {
  if (!localDb) {
    throw new Error(
      'Local database not connected. Call connectToLocalDatabase() first.'
    );
  }
  return localDb;
}

/**
 * Get the local MongoDB client
 */
export function getLocalClient(): MongoClient {
  if (!localClient) {
    throw new Error('Local MongoDB client not available.');
  }
  return localClient;
}

/**
 * Check if local database is connected
 */
export function isLocalDatabaseConnected(): boolean {
  return localClient !== null && localDb !== null;
}

/**
 * Set the local database URI (called from Electron main process)
 */
export function setLocalDatabaseUri(uri: string): void {
  localDbUri = uri;
}

/**
 * Get the current local database URI
 */
export function getLocalDatabaseUri(): string | null {
  return localDbUri;
}

/**
 * Disconnect from local MongoDB
 */
export async function disconnectFromLocalDatabase(): Promise<void> {
  try {
    if (localClient) {
      await localClient.close();
      console.log('✅ Disconnected from local MongoDB');
    }
  } catch (error) {
    console.error('❌ Error disconnecting from local MongoDB:', error);
  } finally {
    localClient = null;
    localDb = null;
    localDbUri = null;
  }
}

/**
 * Health check for local database
 */
export async function localHealthCheck(): Promise<boolean> {
  try {
    if (!localDb) return false;
    
    // Ping the database
    await localDb.admin().ping();
    return true;
  } catch (error) {
    console.error('❌ Local database health check failed:', error);
    return false;
  }
}

/**
 * Initialize local database connection from Electron main process
 * This function should be called from the Electron main process after
 * the local MongoDB server is started
 */
export async function initializeLocalConnection(uri: string): Promise<Db> {
  setLocalDatabaseUri(uri);
  return await connectToLocalDatabase(uri);
}
