/**
 * @module lib/mongodb/connection
 * @description Handles the logic for creating, managing, and testing MongoDB connections.
 * This module provides a centralized place for all connection-related activities,
 * ensuring a single source of truth for the database connection state.
 */
import { MongoClient, Db } from 'mongodb';
import { MONGODB_CONFIG } from './config';
import { promises as fs } from 'fs';
import path from 'path';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'healthtrack-settings.json');

// Active client and database instances for main database
let client: MongoClient | null = null;
let db: Db | null = null;
let connectedUri: string | null = null;
let connectionPromise: Promise<MongoClient> | null = null;

// Active client and database instances for case embeddings
let embeddingsClient: MongoClient | null = null;
let embeddingsDb: Db | null = null;
let embeddingsConnectedUri: string | null = null;
let embeddingsConnectionPromise: Promise<MongoClient> | null = null;

/**
 * Retrieves the MongoDB URI from the settings file.
 * This is used to automatically reconnect to the database on application restart.
 * The MongoDB URI is stored in the healthtrack-settings.json file at the application root.
 * 
 * @returns {Promise<string | undefined>} The MongoDB URI if found, or undefined if not set
 */
async function getMongoUriFromSettings(): Promise<string | undefined> {
  try {
    const data = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
    const settings = JSON.parse(data);
    return settings.mongoUri;
  } catch (error) {
    // File might not exist, which is fine.
    console.log('No MongoDB URI found in settings file or file does not exist');
    return undefined;
  }
}

/**
 * Establishes a connection to the main MongoDB database using the provided URI.
 * It uses a singleton pattern to ensure only one connection is active at a time.
 *
 * @param {string} [uri] - The MongoDB connection string. If not provided, it will try to load from settings.
 * @returns {Promise<MongoClient>} A promise that resolves to the connected MongoClient instance.
 */
export const connectToDatabase = async (uri?: string): Promise<MongoClient> => {
  let mongoUri = uri;

  if (!mongoUri) {
    mongoUri = await getMongoUriFromSettings();
  }
  
  if (!mongoUri) {
    throw new Error('MongoDB connection URI is not defined. Either provide a URI or set it in healthtrack-settings.json');
  }

  if (client && connectedUri === mongoUri) {
    console.log('📊 [DATABASE] Using existing MongoDB connection');
    return Promise.resolve(client);
  }

  if (connectionPromise && connectedUri === mongoUri) {
    console.log('📊 [DATABASE] Connection already in progress, waiting for it to complete');
    return connectionPromise;
  }

  // If connecting to a new URI, close the old connection first
  if (client) {
    console.log(`📊 [DATABASE] Switching MongoDB connection from ${sanitizeMongoUri(connectedUri!)} to ${sanitizeMongoUri(mongoUri)}`);
    await client.close();
    client = null;
    db = null;
    connectedUri = null;
  }

  connectionPromise = (async () => {
    try {
      console.log(`📊 [DATABASE] Attempting to connect to MongoDB at ${sanitizeMongoUri(mongoUri)}...`);
      const newClient = new MongoClient(mongoUri, MONGODB_CONFIG.REMOTE_OPTIONS);
      await newClient.connect();
      
      client = newClient;
      db = client.db(); // Use the default DB from the connection string
      connectedUri = mongoUri;
      connectionPromise = null;

      console.log('✅ [DATABASE] Successfully connected to main MongoDB database');

      client.on('close', () => {
        console.log('📊 [DATABASE] MongoDB connection closed');
        client = null;
        db = null;
        connectedUri = null;
      });

      return client;
    } catch (error) {
      connectionPromise = null;
      console.error('❌ [DATABASE] Failed to connect to MongoDB:', error);
      throw error; // Re-throw to be caught by the caller
    }
  })();

  return connectionPromise;
};

/**
 * Establishes a connection to the case embeddings MongoDB database using the env variable.
 * This is kept separate from the main database connection.
 *
 * @returns {Promise<MongoClient>} A promise that resolves to the connected MongoClient instance.
 */
export const connectToCaseEmbeddingsDatabase = async (): Promise<MongoClient> => {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error('Case embeddings MongoDB URI is not defined. Set MONGODB_URI environment variable.');
  }

  if (embeddingsClient && embeddingsConnectedUri === mongoUri) {
    console.log('📊 [EMBEDDINGS] Using existing case embeddings connection');
    return Promise.resolve(embeddingsClient);
  }

  if (embeddingsConnectionPromise && embeddingsConnectedUri === mongoUri) {
    console.log('📊 [EMBEDDINGS] Connection already in progress, waiting for it to complete');
    return embeddingsConnectionPromise;
  }

  // If connecting to a new URI, close the old connection first
  if (embeddingsClient) {
    console.log(`📊 [EMBEDDINGS] Switching case embeddings connection from ${sanitizeMongoUri(embeddingsConnectedUri!)} to ${sanitizeMongoUri(mongoUri)}`);
    await embeddingsClient.close();
    embeddingsClient = null;
    embeddingsDb = null;
    embeddingsConnectedUri = null;
  }

  embeddingsConnectionPromise = (async () => {
    try {
      console.log(`📊 [EMBEDDINGS] Attempting to connect to case embeddings MongoDB at ${sanitizeMongoUri(mongoUri)}...`);
      const newClient = new MongoClient(mongoUri, MONGODB_CONFIG.REMOTE_OPTIONS);
      await newClient.connect();
      
      embeddingsClient = newClient;
      embeddingsDb = embeddingsClient.db(); // Use the default DB from the connection string
      embeddingsConnectedUri = mongoUri;
      embeddingsConnectionPromise = null;

      console.log('✅ [EMBEDDINGS] Successfully connected to case embeddings MongoDB');

      embeddingsClient.on('close', () => {
        console.log('📊 [EMBEDDINGS] Case embeddings MongoDB connection closed');
        embeddingsClient = null;
        embeddingsDb = null;
        embeddingsConnectedUri = null;
      });

      return embeddingsClient;
    } catch (error) {
      embeddingsConnectionPromise = null;
      console.error('❌ [EMBEDDINGS] Failed to connect to case embeddings MongoDB:', error);
      throw error; // Re-throw to be caught by the caller
    }
  })();

  return embeddingsConnectionPromise;
};

/**
 * Returns the current main database instance.
 * Throws an error if the database is not connected.
 *
 * @returns {Db} The database instance.
 */
export const getDb = (): Db => {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase first.');
  }
  return db;
};

/**
 * Returns the current MongoClient instance for the main database.
 * Throws an error if the client is not connected.
 *
 * @returns {MongoClient} The MongoClient instance.
 */
export const getClient = (): MongoClient => {
  if (!client) {
    throw new Error('MongoClient not connected. Call connectToDatabase first.');
  }
  return client;
};

/**
 * Returns the current case embeddings database instance.
 * Throws an error if the database is not connected.
 *
 * @returns {Db} The case embeddings database instance.
 */
export const getEmbeddingsDb = (): Db => {
  if (!embeddingsDb) {
    throw new Error('Case embeddings database not connected. Call connectToCaseEmbeddingsDatabase first.');
  }
  return embeddingsDb;
};

/**
 * Returns the current MongoClient instance for the case embeddings database.
 * Throws an error if the client is not connected.
 *
 * @returns {MongoClient} The MongoClient instance for case embeddings.
 */
export const getEmbeddingsClient = (): MongoClient => {
  if (!embeddingsClient) {
    throw new Error('Case embeddings MongoClient not connected. Call connectToCaseEmbeddingsDatabase first.');
  }
  return embeddingsClient;
};

/**
 * Checks the current connection status for both databases.
 *
 * @returns {{ 
 *   connected: boolean; 
 *   uri: string | null;
 *   caseEmbeddingsConnected: boolean;
 *   caseEmbeddingsUri: string | null
 * }} An object indicating both connection statuses and their sanitized URIs.
 */
export const getConnectionStatus = () => {
  return {
    connected: !!client, // If client exists, it's considered connected
    uri: connectedUri ? sanitizeMongoUri(connectedUri) : null,
    caseEmbeddingsConnected: !!embeddingsClient,
    caseEmbeddingsUri: embeddingsConnectedUri ? sanitizeMongoUri(embeddingsConnectedUri) : null
  };
};

/**
 * Initializes all required database connections during application startup.
 * Attempts to connect to both the main database and case embeddings database.
 * Does not throw errors if connections fail, but logs the results.
 */
export const initializeAllDatabaseConnections = async (): Promise<void> => {
  console.log('📊 [DATABASE] Initializing all database connections...');
  
  // Try to connect to main database
  try {
    const mongoUri = await getMongoUriFromSettings();
    if (mongoUri) {
      await connectToDatabase(mongoUri);
      console.log('✅ [DATABASE] Successfully initialized main database connection');
    } else {
      console.log('ℹ️ [DATABASE] No main database URI found in settings. Skipping connection.');
    }
  } catch (error) {
    console.error('❌ [DATABASE] Failed to initialize main database connection:', error);
  }
  
  // Try to connect to case embeddings database
  try {
    if (process.env.MONGODB_URI) {
      await connectToCaseEmbeddingsDatabase();
      console.log('✅ [DATABASE] Successfully initialized case embeddings database connection');
    } else {
      console.log('ℹ️ [DATABASE] No case embeddings URI found in environment. Skipping connection.');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [DATABASE] Failed to initialize case embeddings database connection [${error instanceof Error ? error.name : 'UnknownError'}]: ${errorMessage}`);
  }
  
  // Log overall status
  const status = getConnectionStatus();
  console.log('📊 [DATABASE] Connection status:', {
    mainDatabase: status.connected ? 'Connected' : 'Not connected',
    caseEmbeddingsDatabase: status.caseEmbeddingsConnected ? 'Connected' : 'Not connected'
  });
};

/**
 * Closes all MongoDB connections.
 */
export const closeAllConnections = async () => {
  console.log('📊 [DATABASE] Closing all database connections...');
  
  const promises = [];
  
  if (client) {
    promises.push(client.close().then(() => {
      console.log('✅ [DATABASE] Main database connection closed');
    }));
  }
  
  if (embeddingsClient) {
    promises.push(embeddingsClient.close().then(() => {
      console.log('✅ [DATABASE] Case embeddings database connection closed');
    }));
  }
  
  await Promise.all(promises);
};

/**
 * Sanitizes a MongoDB URI by removing the username and password.
 *
 * @param {string} uri - The MongoDB URI to sanitize.
 * @returns {string} The sanitized URI.
 */
export const sanitizeMongoUri = (uri: string): string => {
  try {
    const url = new URL(uri);
    url.username = '';
    url.password = '';
    return url.toString();
  } catch (error) {
    // If URI is malformed, try a simpler regex approach or return a generic string
    return uri.replace(/\/\/(.*?)@/, '//<credentials>@');
  }
};