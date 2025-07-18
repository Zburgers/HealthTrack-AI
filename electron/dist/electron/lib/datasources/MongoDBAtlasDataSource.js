"use strict";
/**
 * MongoDBAtlasDataSource - MongoDB Atlas Cloud Implementation
 *
 * This data source wraps the existing, working MongoDB Atlas connection implementation
 * and makes it conform to the IDataSource interface.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBAtlasDataSource = void 0;
const mongodb_atlas_bridge_1 = require("../mongodb-atlas-bridge");
const mongodb_1 = require("mongodb");
const vectorSearch_1 = require("../shared/vectorSearch");
const embedding_1 = require("../shared/embedding");
const similar_cases_logic_1 = require("../shared/similar-cases-logic");
const MONGODB_COLLECTION_CASE_EMBEDDINGS = process.env.MONGODB_COLLECTION_CASE_EMBEDDINGS || 'case_embeddings';
const MONGODB_COLLECTION_AI_CACHE = process.env.MONGODB_COLLECTION_AI_CACHE || 'ai_cache';
class MongoDBAtlasDataSource {
    constructor() {
        this.id = 'mongodb-atlas';
        this.name = 'MongoDB Atlas Cloud';
        this.description = 'Cloud-hosted MongoDB database for production use and remote access';
        this.status = 'disconnected';
        this.error = null;
        this.db = null;
        this.client = null;
        this.connectionUri = null;
    }
    async initialize() {
        console.log(`🔧 [${this.id}] Initializing MongoDB Atlas data source...`);
        this.status = 'initializing_source';
    }
    async ping() {
        if (!this.client) {
            return false;
        }
        try {
            await this.client.db().command({ ping: 1 });
            return true;
        }
        catch (error) {
            console.error('Ping failed:', error);
            return false;
        }
    }
    async connect(config) {
        console.log(`🔌 [${this.id}] Connecting to MongoDB Atlas...`);
        this.status = 'connecting';
        this.config = config;
        this.connectionUri = config.uri;
        try {
            await (0, mongodb_atlas_bridge_1.connectToAtlas)(this.connectionUri);
            this.db = (0, mongodb_atlas_bridge_1.getAtlasDb)();
            this.client = (0, mongodb_atlas_bridge_1.getAtlasClient)();
            this.status = 'connected';
            console.log(`✅ [${this.id}] Connected to MongoDB Atlas`);
        }
        catch (error) {
            this.status = 'error';
            this.error = error;
            console.error(`❌ [${this.id}] Connection failed:`, error);
            throw error;
        }
    }
    async disconnect() {
        console.log(`🔌 [${this.id}] Disconnecting from MongoDB Atlas...`);
        await (0, mongodb_atlas_bridge_1.disconnectFromAtlas)();
        this.status = 'disconnected';
        this.db = null;
        this.client = null;
        this.connectionUri = null;
        console.log(`✅ [${this.id}] Disconnected`);
    }
    async executeQuery(query) {
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
                    return collection.findOne({ _id: new mongodb_1.ObjectId(params.id) });
                case 'patients.find':
                case 'case_embeddings.find':
                    return collection.find(params.filter || {}, params.options || {}).toArray();
                case 'patients.insertOne':
                    return collection.insertOne(params.document);
                case 'patients.updateOne':
                    return collection.updateOne(params.filter, params.update, params.options || {});
                case 'patients.deleteOne':
                    return collection.deleteOne(params.filter);
                case 'similar-cases.find': {
                    const validationResult = similar_cases_logic_1.SimilarCasesApiInputSchema.safeParse(params);
                    if (!validationResult.success) {
                        throw new Error(`Invalid input for similar-cases.find: ${validationResult.error.message}`);
                    }
                    const { note, limit = 5, minScore = 0.7 } = {
                        ...validationResult.data,
                        limit: params.limit || 5,
                        minScore: params.minScore || 0.7
                    };
                    const embeddings = await (0, embedding_1.getEmbeddings)([note]);
                    const embedding = embeddings[0];
                    const caseEmbeddingsCollection = this.db.collection(MONGODB_COLLECTION_CASE_EMBEDDINGS);
                    const similarCases = await (0, vectorSearch_1.findSimilarCases)(caseEmbeddingsCollection, embedding, 150, // numCandidates
                    limit, { minConfidence: minScore });
                    return similarCases;
                }
                default:
                    throw new Error(`Unsupported query type: ${type}`);
            }
        }
        catch (error) {
            console.error(`❌ [${this.id}] Failed to execute query:`, error);
            throw error;
        }
    }
    async getConnectionInfo() {
        if (!(0, mongodb_atlas_bridge_1.isAtlasConnected)() || !this.db || !this.client) {
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
        }
        catch (error) {
            console.error(`❌ [${this.id}] Failed to get connection info:`, error);
            return { isConnected: false };
        }
    }
    sanitizeUri(uri) {
        if (!uri)
            return undefined;
        return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    }
    getCapabilities() {
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
exports.MongoDBAtlasDataSource = MongoDBAtlasDataSource;
//# sourceMappingURL=MongoDBAtlasDataSource.js.map