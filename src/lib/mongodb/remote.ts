/**
 * Remote MongoDB Connection Module
 * 
 * Handles connections to MongoDB Atlas for remote-only collections
 * and web application database operations
 */

import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import { MONGODB_URI as MONGODB_URI_FROM_CONFIG } from '@/config';
import { DATABASE_NAMES, MONGODB_CONFIG } from './config';

let remoteClient: MongoClient | null = null;
let remoteDb: Db | null = null;

/**
 * Connect to remote MongoDB Atlas
 */
export async function connectToRemoteDatabase(): Promise<Db> {
  if (remoteDb && remoteClient) {
    // Return existing connection if available
    return remoteDb;
  }

  const MONGODB_URI = MONGODB_URI_FROM_CONFIG || process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      'MongoDB connection error: MONGODB_URI is not defined. Please set it in your environment variables.'
    );
  }

  try {
    // Create new client if needed
    if (!remoteClient) {
      remoteClient = new MongoClient(MONGODB_URI, {
        ...MONGODB_CONFIG.REMOTE_OPTIONS,
        serverApi: {
          version: ServerApiVersion.v1,
          strict: false, // Allow $vectorSearch
          deprecationErrors: true,
        },
      });
    }

    // Connect if not already connected
    if (!remoteDb) {
      await remoteClient.connect();
      remoteDb = remoteClient.db(DATABASE_NAMES.REMOTE);
      console.log('✅ Connected to remote MongoDB Atlas');
    }

    return remoteDb;
  } catch (error) {
    console.error('❌ Failed to connect to remote MongoDB:', error);
    
    // Reset connections on failure
    remoteClient = null;
    remoteDb = null;
    
    throw new Error(
      `Remote MongoDB connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get the remote database instance (throws if not connected)
 */
export function getRemoteDatabase(): Db {
  if (!remoteDb) {
    throw new Error(
      'Remote database not connected. Call connectToRemoteDatabase() first.'
    );
  }
  return remoteDb;
}

/**
 * Get the remote MongoDB client
 */
export function getRemoteClient(): MongoClient {
  if (!remoteClient) {
    throw new Error('Remote MongoDB client not available.');
  }
  return remoteClient;
}

/**
 * Check if remote database is connected
 */
export function isRemoteDatabaseConnected(): boolean {
  return remoteClient !== null && remoteDb !== null;
}

/**
 * Disconnect from remote MongoDB
 */
export async function disconnectFromRemoteDatabase(): Promise<void> {
  try {
    if (remoteClient) {
      await remoteClient.close();
      console.log('✅ Disconnected from remote MongoDB');
    }
  } catch (error) {
    console.error('❌ Error disconnecting from remote MongoDB:', error);
  } finally {
    remoteClient = null;
    remoteDb = null;
  }
}

/**
 * Health check for remote database
 */
export async function remoteHealthCheck(): Promise<boolean> {
  try {
    if (!remoteDb) return false;
    
    // Ping the database
    await remoteDb.admin().ping();
    return true;
  } catch (error) {
    console.error('❌ Remote database health check failed:', error);
    return false;
  }
}

/**
 * Verify remote database connection (creates temporary connection)
 */
export async function verifyRemoteDatabaseConnection(): Promise<void> {
  const MONGODB_URI = MONGODB_URI_FROM_CONFIG || process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      'MongoDB verification error: MONGODB_URI is not defined. Please set it in your environment variables.'
    );
  }

  const verificationClient = new MongoClient(MONGODB_URI, {
    serverApi: { 
      version: ServerApiVersion.v1, 
      strict: false, 
      deprecationErrors: true 
    }
  });

  try {
    await verificationClient.connect();
    await verificationClient.db('admin').command({ ping: 1 });
    console.log('✅ Remote MongoDB connection verified successfully');
  } catch (error) {
    console.error('❌ Remote MongoDB connection verification failed:', error);
    throw error;
  } finally {
    await verificationClient.close();
  }
}
