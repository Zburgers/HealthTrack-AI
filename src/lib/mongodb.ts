import { MongoClient, ServerApiVersion } from 'mongodb';
import { MONGODB_URI } from '@/config';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// This is the main client used by the application.
const client = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false, // Allow $vectorSearch
    deprecationErrors: true,
  }
});

let cachedClient: MongoClient | null = null;

/**
 * Establishes a persistent, cached connection to the database.
 * Used by the main application logic.
 */
export async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB for the application.");
    cachedClient = client;
    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    throw error;
  }
}

/**
 * Creates a temporary, non-cached connection to verify database access.
 * This function connects, pings, and immediately closes the connection.
 * It is used for startup checks to avoid leaving open connections.
 */
export async function verifyDatabaseConnection() {
    const verificationClient = new MongoClient(MONGODB_URI, {
        serverApi: { version: ServerApiVersion.v1, strict: false, deprecationErrors: true } // Also update here for consistency
    });

    try {
        await verificationClient.connect();
        await verificationClient.db("admin").command({ ping: 1 });
        // The console log from the original implementation will be used here.
    } finally {
        // Ensures that the client will close when you finish/error
        await verificationClient.close();
    }
}
