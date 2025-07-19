/**
 * MongoDBMemoryDataSource - MongoDB Memory Server Implementation
 * 
 * This data source wraps the existing, working MongoDB Memory Server implementation
 * from local-db.ts and makes it conform to the IDataSource interface.
 * 
 * This preserves all existing functionality while enabling it to work
 * within Clara's Switchboard architecture.
 */

import { 
  IDataSource, 
  ConnectionStatus, 
  IQuery, 
  ConnectionInfo,
  DataSourceCapabilities 
} from './IDataSource';
import { 
  startLocalDatabase, 
  stopLocalDatabase, 
  getLocalDb,
  getLocalCollection
} from '../local-db';
import { Db } from 'mongodb';

export class MongoDBMemoryDataSource implements IDataSource {
  // IDataSource implementation
  public readonly id = 'mongodb-memory';
  public readonly name = 'Local MongoDB Memory Server';
  public readonly description = 'In-memory MongoDB server for local development and offline usage';
  
  // State Management
  public status: ConnectionStatus = 'disconnected';
  public error: Error | null = null;
  public config?: Record<string, any>;
  
  private db: Db | null = null;
  
  /**
   * Initialize the MongoDB Memory Server data source
   */
  async initialize(): Promise<void> {
    console.log(`🔧 [${this.id}] Initializing MongoDB Memory Server data source...`);
    this.status = 'initializing_source';
    
    try {
      // No special initialization needed for MongoDB Memory Server
      // The actual server start happens in connect()
      console.log(`✅ [${this.id}] Data source initialized successfully`);
    } catch (error) {
      this.status = 'error';
      this.error = error as Error;
      console.error(`❌ [${this.id}] Initialization failed:`, error);
      throw error;
    }
  }
  
  /**
   * Connect to MongoDB Memory Server
   */
  async connect(config: Record<string, any>): Promise<void> {
    console.log(`🔌 [${this.id}] Connecting to MongoDB Memory Server...`);
    this.status = 'connecting';
    this.error = null;
    this.config = config; // Store configuration
    
    try {
      // Use the existing working startLocalDatabase function
      await startLocalDatabase();
      
      // Get the database instance
      this.db = getLocalDb();
      
      this.status = 'connected';
      console.log(`✅ [${this.id}] Successfully connected to MongoDB Memory Server`);
    } catch (error) {
      this.status = 'connection_failed';
      this.error = error as Error;
      console.error(`❌ [${this.id}] Connection failed:`, error);
      throw error;
    }
  }
  
  /**
   * Disconnect from MongoDB Memory Server
   */
  async disconnect(): Promise<void> {
    console.log(`🔌 [${this.id}] Disconnecting from MongoDB Memory Server...`);
    
    try {
      // Use the existing working stopLocalDatabase function
      await stopLocalDatabase();
      
      this.db = null;
      this.status = 'disconnected';
      this.error = null;
      
      console.log(`✅ [${this.id}] Disconnected successfully`);
    } catch (error) {
      this.status = 'error';
      this.error = error as Error;
      console.error(`❌ [${this.id}] Disconnection failed:`, error);
      throw error;
    }
  }
  
  /**
   * Execute a query - this is the core unified data access method
   */
  async executeQuery<T>(query: IQuery): Promise<T> {
    if (!this.db) {
      throw new Error(`${this.id}: Not connected to database`);
    }
    
    console.log(`🎯 [${this.id}] Executing query: ${query.type}`);
    
    try {
      const result = await this.routeQuery<T>(query);
      console.log(`✅ [${this.id}] Query executed successfully`);
      return result;
    } catch (error) {
      console.error(`❌ [${this.id}] Query execution failed:`, error);
      throw error;
    }
  }
  
  /**
   * Route queries to appropriate MongoDB operations
   */
  private async routeQuery<T>(query: IQuery): Promise<T> {
    const { type, params, rawQuery } = query;
    
    // Handle raw queries (escape hatch for complex operations)
    if (type === 'raw' && rawQuery) {
      console.log(`🔧 [${this.id}] Executing raw query`);
      return rawQuery(this.db) as T;
    }
    
    // Parse query type (e.g., 'patient.getById' -> collection: 'patients', operation: 'getById')
    const [collection, operation] = type.split('.');
    
    if (!collection || !operation) {
      throw new Error(`Invalid query type format: ${type}. Expected format: 'collection.operation'`);
    }
    
    // Get the MongoDB collection
    const mongoCollection = await getLocalCollection(collection);
    
    // Route to specific operations
    switch (operation) {
      case 'getById':
        return mongoCollection.findOne({ _id: params.id }) as T;
        
      case 'search':
      case 'find':
        return mongoCollection.find(params.filter || {}, params.options || {}).toArray() as T;
        
      case 'create':
      case 'insertOne':
        const insertResult = await mongoCollection.insertOne(params.document);
        return { ...params.document, _id: insertResult.insertedId } as T;
        
      case 'update':
      case 'updateOne':
        const updateResult = await mongoCollection.updateOne(params.filter, params.update);
        return updateResult as T;
        
      case 'delete':
      case 'deleteOne':
        const deleteResult = await mongoCollection.deleteOne(params.filter);
        return deleteResult as T;
        
      case 'count':
        return mongoCollection.countDocuments(params.filter || {}) as T;
        
      default:
        throw new Error(`Unsupported operation: ${operation} on collection: ${collection}`);
    }
  }
  
  /**
   * Health check - ping the database
   */
  async ping(): Promise<boolean> {
    try {
      if (!this.db) return false;
      
      // Simple ping using admin command
      await this.db.admin().ping();
      return true;
    } catch (error) {
      console.error(`❌ [${this.id}] Ping failed:`, error);
      return false;
    }
  }
  
  /**
   * Get detailed connection information
   */
  async getConnectionInfo(): Promise<ConnectionInfo> {
    try {
      if (!this.db) {
        return {
          isConnected: false,
          database: undefined,
          collections: [],
          lastConnected: undefined
        };
      }
      
      // Get collections list
      const collections = await this.db.listCollections().toArray();
      const collectionNames = collections.map(col => col.name);
      
      return {
        isConnected: this.status === 'connected',
        uri: 'mongodb://localhost:27018',  // MongoDB Memory Server default
        database: this.db.databaseName,
        collections: collectionNames,
        lastConnected: new Date(),
        serverInfo: {
          type: 'MongoDB Memory Server',
          version: 'In-Memory'
        }
      };
    } catch (error) {
      console.error(`❌ [${this.id}] Failed to get connection info:`, error);
      return {
        isConnected: false
      };
    }
  }
  
  /**
   * Get configuration capabilities (for dynamic UI generation)
   */
  getCapabilities(): DataSourceCapabilities {
    return {
      configSchema: {
        type: 'object',
        properties: {
          // MongoDB Memory Server doesn't need configuration
          autoStart: {
            type: 'boolean',
            description: 'Automatically start the memory server',
            default: true
          }
        }
      },
      supportedOperations: [
        'patient.getById',
        'patient.search',
        'patient.create',
        'patient.update',
        'patient.delete',
        'notes.getById',
        'notes.search',
        'notes.create',
        'notes.update',
        'notes.delete',
        'ai_cache.getById',
        'ai_cache.create',
        'ai_cache.update',
        'raw'
      ],
      features: [
        'local-storage',
        'offline-capable',
        'in-memory',
        'development-ready'
      ]
    };
  }
}
