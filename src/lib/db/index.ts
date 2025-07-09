import { connectToDatabase as connectToMongoDB } from '../mongodb';

// Collection routing configuration  
const LOCAL_COLLECTIONS = new Set([
  'patients',
  'ai_cache', 
  'notes',
  'local_embeddings',
  'db_metadata'
]);

const REMOTE_COLLECTIONS = new Set([
  'case_embeddings'
]);

export function isElectronEnvironment() {
  return process.env.IS_ELECTRON === 'true' || process.env.ELECTRON_ENV === 'true';
}

export function isLocalCollection(collectionName: string): boolean {
  return LOCAL_COLLECTIONS.has(collectionName);
}

export function isRemoteCollection(collectionName: string): boolean {
  return REMOTE_COLLECTIONS.has(collectionName);
}

/**
 * Get the appropriate database connection
 * Now uses MongoDB for all collections in all environments
 * Returns a proper MongoDB client with collection() method
 */
export async function getDb(collectionName?: string) {
  try {
    console.log(`🔍 Database routing for collection "${collectionName}": MongoDB Atlas`);
    
    // Check if we're in Electron environment (renderer process)
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      console.log('🔗 Using Electron IPC for database operations');
      
      // Return IPC proxy that mimics MongoDB client interface
      return {
        collection: (name: string) => ({
          find: async (filter: any = {}, options: any = {}) => {
            try {
              const result = await (window as any).electronAPI.database.find(name, filter, options);
              return result || [];
            } catch (error) {
              console.error(`❌ IPC find failed for ${name}:`, error);
              throw new Error(`Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
          findOne: async (filter: any) => {
            try {
              return await (window as any).electronAPI.database.findOne(name, filter);
            } catch (error) {
              console.error(`❌ IPC findOne failed for ${name}:`, error);
              throw new Error(`Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
          insertOne: async (document: any) => {
            try {
              return await (window as any).electronAPI.database.insertOne(name, document);
            } catch (error) {
              console.error(`❌ IPC insertOne failed for ${name}:`, error);
              throw new Error(`Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
          updateOne: async (filter: any, update: any, options: any = {}) => {
            try {
              return await (window as any).electronAPI.database.updateOne(name, filter, update, options);
            } catch (error) {
              console.error(`❌ IPC updateOne failed for ${name}:`, error);
              throw new Error(`Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
          deleteOne: async (filter: any) => {
            try {
              return await (window as any).electronAPI.database.deleteOne(name, filter);
            } catch (error) {
              console.error(`❌ IPC deleteOne failed for ${name}:`, error);
              throw new Error(`Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
          countDocuments: async (filter: any = {}) => {
            try {
              const result = await (window as any).electronAPI.database.find(name, filter);
              return result?.length || 0;
            } catch (error) {
              console.error(`❌ IPC countDocuments failed for ${name}:`, error);
              throw new Error(`Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        })
      };
    }
    
    // For web environment or Electron main process, use direct MongoDB connection
    const client = await connectToMongoDB();
    
    // Ensure we have a proper MongoDB client
    if (!client || !client.db) {
      throw new Error('Failed to get valid MongoDB client. Please check your MONGODB_URI configuration.');
    }
    
    return client.db('healthtrack');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    
    // Create a more informative error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const helpMessage = 'Please configure your MongoDB URI in the database settings or contact your administrator for help.';
    
    throw new Error(`Database connection failed: ${errorMessage}. ${helpMessage}`);
  }
}
