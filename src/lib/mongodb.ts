/**
 * MongoDB Connection Module - Universal Database Framework
 * 
 * This module provides seamless access to MongoDB Atlas database.
 */

import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import { MONGODB_URI } from '@/config';

// Global client instance
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

/**
 * Main connection function that works in all environments
 * Returns a MongoDB client with proper collection() method
 */
export async function connectToDatabase() {
  if (mongoClient && mongoDb) {
    return mongoClient;
  }

  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not configured. Please set up your MongoDB connection string.');
    }

    console.log("🔗 Connecting to MongoDB Atlas...");
    
    mongoClient = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false, // Allow $vectorSearch
        deprecationErrors: true,
      },
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    await mongoClient.connect();
    mongoDb = mongoClient.db('healthtrack');
    
    // Test the connection
    await mongoDb.admin().ping();
    
    console.log("✅ Successfully connected to MongoDB Atlas");
    return mongoClient;
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB Atlas:", error);
    
    // Clean up failed connection
    if (mongoClient) {
      try {
        await mongoClient.close();
      } catch (closeError) {
        console.error("Failed to close failed MongoDB connection:", closeError);
      }
      mongoClient = null;
      mongoDb = null;
    }
    
    throw error;
  }
}

/**
 * Legacy verification function for backward compatibility
 */
export async function verifyDatabaseConnection() {
  try {
    await connectToDatabase();
    console.log("✅ Database connection verified successfully");
  } catch (error) {
    console.error("❌ Database connection verification failed:", error);
    throw error;
  }
}

/**
 * Close MongoDB connection
 */
export async function closeDatabaseConnection() {
  if (mongoClient) {
    try {
      await mongoClient.close();
      console.log("✅ MongoDB connection closed");
    } catch (error) {
      console.error("❌ Failed to close MongoDB connection:", error);
    } finally {
      mongoClient = null;
      mongoDb = null;
    }
  }
}

// Re-export all the existing exports from the mongodb/index.ts file
export * from './mongodb/index';
