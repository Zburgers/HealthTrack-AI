import { MongoClient, ServerApiVersion } from 'mongodb';
import { MONGODB_URI as MONGODB_URI_FROM_CONFIG } from '@/config'; // Renamed import

let clientInstance: MongoClient | null = null;
let cachedDbClient: MongoClient | null = null;

/**
 * Establishes a persistent, cached connection to the database.
 * Used by the main application logic.
 */
export async function connectToDatabase() {
  if (cachedDbClient) {
    return cachedDbClient;
  }

  const MONGODB_URI = MONGODB_URI_FROM_CONFIG || process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    // This error will now only throw at runtime if the URI is missing when a connection is attempted
    throw new Error('MongoDB connection error: MONGODB_URI is not defined. Please set it in your environment variables.');
  }

  if (!clientInstance) {
    clientInstance = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false, // Allow $vectorSearch
        deprecationErrors: true,
      }
    });
  }

  try {
    await clientInstance.connect();
    console.log("Successfully connected to MongoDB for the application.");
    cachedDbClient = clientInstance;
    return cachedDbClient;
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    // Consider resetting clientInstance and cachedDbClient to null on critical connection failure
    // clientInstance = null;
    // cachedDbClient = null;
    throw error; // Re-throw the error to be handled by the caller
  }
}

/**
 * Creates a temporary, non-cached connection to verify database access.
 * This function connects, pings, and immediately closes the connection.
 * It is used for startup checks or diagnostics.
 */
export async function verifyDatabaseConnection() {
    const MONGODB_URI = MONGODB_URI_FROM_CONFIG || process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error('MongoDB verification error: MONGODB_URI is not defined. Please set it in your environment variables.');
    }

    const verificationClient = new MongoClient(MONGODB_URI, {
        serverApi: { version: ServerApiVersion.v1, strict: false, deprecationErrors: true }
    });

    try {
        await verificationClient.connect();
        await verificationClient.db("admin").command({ ping: 1 });
        console.log("MongoDB connection verified successfully via verifyDatabaseConnection.");
    } catch (error) {
        console.error("MongoDB connection verification failed:", error);
        throw error; // Re-throw the error
    } finally {
        // Ensures that the client will close when you finish/error
        await verificationClient.close();
    }
}
