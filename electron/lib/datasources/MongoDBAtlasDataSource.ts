/**
 * MongoDBAtlasDataSource - MongoDB Atlas Cloud Implementation
 * 
 * This data source wraps the existing, working MongoDB Atlas connection implementation
 * and makes it conform to the IDataSource interface.
 */

import { 
  IDataSource, 
  ConnectionStatus, 
  IQuery, 
  ConnectionInfo,
  DataSourceCapabilities 
} from './IDataSource';
import { 
  connectToAtlas,
  getAtlasDb,
  getAtlasClient,
  disconnectFromAtlas,
  isAtlasConnected
} from '../mongodb-atlas-bridge';
import { Db, MongoClient, Collection, ObjectId } from 'mongodb';
import { findSimilarCases } from '../shared/vectorSearch';
import { getEmbeddings } from '../shared/embedding';
import { getAICache, setAICache, makeAICacheKey } from '../shared/aiCache';
import { SimilarCasesApiInputSchema } from '../shared/similar-cases-logic';
import { CaseEmbeddingDocument } from '../../../types/similar-cases';

const MONGODB_COLLECTION_CASE_EMBEDDINGS = process.env.MONGODB_COLLECTION_CASE_EMBEDDINGS || 'case_embeddings';
const MONGODB_COLLECTION_AI_CACHE = process.env.MONGODB_COLLECTION_AI_CACHE || 'ai_cache';

export class MongoDBAtlasDataSource implements IDataSource {
  public readonly id = 'mongodb-atlas';
  public readonly name = 'MongoDB Atlas Cloud';
  public readonly description = 'Cloud-hosted MongoDB database for production use and remote access';
  
  public status: ConnectionStatus = 'disconnected';
  public error: Error | null = null;
  public config?: Record<string, any>;
  
  private db: Db | null = null;
  private client: MongoClient | null = null;
  private connectionUri: string | null = null;
  
  async initialize(): Promise<void> {
    console.log(`🔧 [${this.id}] Initializing MongoDB Atlas data source...`);
    this.status = 'initializing_source';
  }
  
  async ping(): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    try {
      await this.client.db().command({ ping: 1 });
      return true;
    } catch (error) {
      console.error('Ping failed:', error);
      return false;
    }
  }

  async connect(config: Record<string, any>): Promise<void> {
    console.log(`🔌 [${this.id}] Connecting to MongoDB Atlas...`);
    this.status = 'connecting';
    this.config = config;
    this.connectionUri = config.uri;

    try {
      await connectToAtlas(this.connectionUri!);
      this.db = getAtlasDb();
      this.client = getAtlasClient();
      this.status = 'connected';
      console.log(`✅ [${this.id}] Connected to MongoDB Atlas`);
    } catch (error) {
      this.status = 'error';
      this.error = error as Error;
      console.error(`❌ [${this.id}] Connection failed:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    console.log(`🔌 [${this.id}] Disconnecting from MongoDB Atlas...`);
    await disconnectFromAtlas();
    this.status = 'disconnected';
    this.db = null;
    this.client = null;
    this.connectionUri = null;
    console.log(`✅ [${this.id}] Disconnected`);
  }

  async executeQuery<T>(query: IQuery): Promise<T> {
    if (!this.db) {
      throw new Error('Not connected to MongoDB Atlas');
    }

    const { type, params } = query;
    if (!type || typeof type !== 'string') {
      throw new Error('Query type must be a string');
    }

    const [collectionName, operation] = type.split('.');

    if (!collectionName || !operation) {
      throw new Error(`Invalid query type format: ${type}`);
    }

    const collection = this.db.collection(collectionName);

    try {
      switch (type) {
        case 'patients.getById':
          return collection.findOne({ _id: new ObjectId(params.id) }) as Promise<T>;

        case 'patients.find':
        case 'case_embeddings.find':
          return collection.find(params.filter || {}, params.options || {}).toArray() as Promise<T>;

        case 'patients.insertOne':
          return collection.insertOne(params.document) as Promise<T>;

        case 'patients.updateOne':
          return collection.updateOne(params.filter, params.update, params.options || {}) as Promise<T>;

        case 'patients.deleteOne':
          return collection.deleteOne(params.filter) as Promise<T>;

        case 'similar-cases.find': {
          const validationResult = SimilarCasesApiInputSchema.safeParse(params);
          if (!validationResult.success) {
            throw new Error(`Invalid input for similar-cases.find: ${validationResult.error.message}`);
          }
          
          const { note, limit = 5, minScore = 0.7 } = {
            ...validationResult.data,
            limit: (params as any).limit || 5,
            minScore: (params as any).minScore || 0.7
          };
          
          const embeddings = await getEmbeddings([note]);
          const embedding = embeddings[0];
          
          const caseEmbeddingsCollection = this.db.collection<CaseEmbeddingDocument>(MONGODB_COLLECTION_CASE_EMBEDDINGS);
          const similarCases = await findSimilarCases(
            caseEmbeddingsCollection,
            embedding,
            150, // numCandidates
            limit,
            { minConfidence: minScore }
          );
          
          return similarCases as unknown as T;
        }

        default:
          throw new Error(`Unsupported query type: ${type}`);
      }
    } catch (error) {
      console.error(`❌ [${this.id}] Failed to execute query:`, error);
      throw error;
    }
  }

  async getConnectionInfo(): Promise<ConnectionInfo> {
    if (!isAtlasConnected() || !this.db || !this.client) {
      return { isConnected: false };
    }
    try {
      const adminDb = this.db.admin();
      const serverInfo = await adminDb.serverInfo();
      const collections = await this.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);

      return {
        isConnected: this.status === 'connected',
        uri: this.sanitizeUri(this.connectionUri),
        database: this.db.databaseName,
        collections: collectionNames,
        lastConnected: new Date(),
        serverInfo: {
          type: 'MongoDB Atlas',
          version: serverInfo.version,
          host: serverInfo.host
        }
      };
    } catch (error) {
      console.error(`❌ [${this.id}] Failed to get connection info:`, error);
      return { isConnected: false };
    }
  }

  private sanitizeUri(uri: string | null): string | undefined {
    if (!uri) return undefined;
    return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  }

  getCapabilities(): DataSourceCapabilities {
    return {
      configSchema: {
        type: 'object',
        properties: {
          uri: {
            type: 'string',
            description: 'MongoDB Atlas connection string',
            pattern: '^mongodb(\\+srv)?://.*',
            title: 'MongoDB URI'
          }
        },
        required: ['uri']
      },
      supportedOperations: [
        'patients.getById',
        'patients.find',
        'patients.insertOne',
        'patients.updateOne',
        'patients.deleteOne',
        'case_embeddings.find',
        'similar-cases.find'
      ],
      features: [
        'cloud-hosted',
        'vector-search',
        'production-ready',
        'scalable'
      ]
    };
  }
}
