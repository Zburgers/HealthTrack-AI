"use strict";
/**
 * MongoDBAtlasDataSource - MongoDB Atlas Cloud Implementation
 *
 * This data source wraps the existing, working MongoDB Atlas connection implementation
 * from src/lib/mongodb/connection.ts and makes it conform to the IDataSource interface.
 *
 * This preserves all existing functionality while enabling it to work
 * within Clara's Switchboard architecture.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBAtlasDataSource = void 0;
const mongodb_atlas_bridge_1 = require("../mongodb-atlas-bridge");
const mongodb_1 = require("mongodb");
/**
 * Utility function to serialize MongoDB documents for JSON transport
 * Converts ObjectId instances to strings and handles nested objects
 */
function serializeDocument(doc) {
    if (!doc)
        return doc;
    if (doc instanceof mongodb_1.ObjectId) {
        return doc.toString();
    }
    if (Array.isArray(doc)) {
        return doc.map(item => serializeDocument(item));
    }
    if (typeof doc === 'object' && doc !== null) {
        const serialized = {};
        for (const [key, value] of Object.entries(doc)) {
            if (key === '_id' && value instanceof mongodb_1.ObjectId) {
                serialized[key] = value.toString();
            }
            else {
                serialized[key] = serializeDocument(value);
            }
        }
        return serialized;
    }
    return doc;
}
class MongoDBAtlasDataSource {
    constructor() {
        // IDataSource implementation
        this.id = 'mongodb-atlas';
        this.name = 'MongoDB Atlas Cloud';
        this.description = 'Cloud-hosted MongoDB database for production use and remote access';
        // State Management
        this.status = 'disconnected';
        this.error = null;
        this.db = null;
        this.client = null;
        this.connectionUri = null;
    }
    /**
     * Initialize the MongoDB Atlas data source
     */
    async initialize() {
        console.log(`🔧 [${this.id}] Initializing MongoDB Atlas data source...`);
        this.status = 'initializing_source';
        try {
            // No special initialization needed for MongoDB Atlas
            // The actual connection happens in connect()
            console.log(`✅ [${this.id}] Data source initialized successfully`);
        }
        catch (error) {
            this.status = 'error';
            this.error = error;
            console.error(`❌ [${this.id}] Initialization failed:`, error);
            throw error;
        }
    }
    /**
     * Connect to MongoDB Atlas
     */
    async connect(config) {
        console.log(`🔌 [${this.id}] Connecting to MongoDB Atlas...`);
        this.status = 'connecting';
        this.error = null;
        this.config = config; // Store configuration
        try {
            this.status = 'validating_config';
            // Extract connection URI from config
            const uri = config.uri || config.mongoUri;
            if (!uri) {
                throw new Error('MongoDB Atlas URI is required in config');
            }
            // Validate URI format
            if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
                throw new Error('Invalid MongoDB URI format. Must start with mongodb:// or mongodb+srv://');
            }
            // Ensure database name is in URI for Atlas connections
            let validatedUri = uri;
            const databaseName = config.database || 'healthtrack-base'; // Use healthtrack-base as default
            if (!uri.includes('/', uri.indexOf('://') + 3)) {
                // Add default database if not specified
                const separator = uri.includes('?') ? '&' : '?';
                validatedUri = uri.replace('?', `/${databaseName}?`).replace(/\/$/, `/${databaseName}`);
                console.log(`📊 [${this.id}] Added database '${databaseName}' to URI`);
            }
            this.status = 'authenticating';
            console.log(`🔌 [${this.id}] Attempting connection to Atlas...`);
            // Use the bridge functions for Atlas connection with retry logic
            let lastError = null;
            let retryCount = 0;
            const maxRetries = 3;
            while (retryCount < maxRetries) {
                try {
                    this.client = await (0, mongodb_atlas_bridge_1.connectToAtlas)(validatedUri);
                    this.db = (0, mongodb_atlas_bridge_1.getAtlasDb)();
                    this.connectionUri = validatedUri;
                    break; // Success, exit retry loop
                }
                catch (connectionError) {
                    lastError = connectionError;
                    retryCount++;
                    if (retryCount < maxRetries) {
                        console.log(`⚠️ [${this.id}] Connection attempt ${retryCount} failed, retrying in 2s...`);
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
                    }
                }
            }
            if (!this.client || !this.db) {
                throw lastError || new Error('Failed to connect after all retries');
            }
            this.status = 'connected';
            console.log(`✅ [${this.id}] Successfully connected to MongoDB Atlas`);
        }
        catch (error) {
            this.status = 'connection_failed';
            this.error = error;
            // Enhanced error logging with troubleshooting tips
            console.error(`❌ [${this.id}] Connection failed:`, error);
            if (error instanceof Error) {
                if (error.message.includes('Server selection timed out')) {
                    console.error(`💡 [${this.id}] Troubleshooting tips:`);
                    console.error(`   - Check your internet connection`);
                    console.error(`   - Verify your IP address is whitelisted in MongoDB Atlas`);
                    console.error(`   - Ensure the cluster is active and not paused`);
                    console.error(`   - Check if the connection string is correct`);
                }
                else if (error.message.includes('Authentication failed')) {
                    console.error(`💡 [${this.id}] Authentication issue - check username/password`);
                }
            }
            throw error;
        }
    }
    /**
     * Disconnect from MongoDB Atlas
     */
    async disconnect() {
        console.log(`🔌 [${this.id}] Disconnecting from MongoDB Atlas...`);
        try {
            if (this.client) {
                await (0, mongodb_atlas_bridge_1.disconnectFromAtlas)();
            }
            this.client = null;
            this.db = null;
            this.connectionUri = null;
            this.status = 'disconnected';
            this.error = null;
            console.log(`✅ [${this.id}] Disconnected successfully`);
        }
        catch (error) {
            this.status = 'error';
            this.error = error;
            console.error(`❌ [${this.id}] Disconnection failed:`, error);
            throw error;
        }
    }
    /**
     * Execute a query - this is the core unified data access method
     */
    async executeQuery(query) {
        if (!this.db) {
            throw new Error(`${this.id}: Not connected to database`);
        }
        console.log(`🎯 [${this.id}] Executing query: ${query.type}`);
        try {
            const result = await this.routeQuery(query);
            console.log(`✅ [${this.id}] Query executed successfully`);
            return result;
        }
        catch (error) {
            console.error(`❌ [${this.id}] Query execution failed:`, error);
            throw error;
        }
    }
    /**
     * Route queries to appropriate MongoDB operations
     */
    async routeQuery(query) {
        const { type, params, rawQuery } = query;
        // Ensure we have a database connection
        if (!this.db) {
            throw new Error(`${this.id}: Database connection is null`);
        }
        // Handle raw queries (escape hatch for complex operations)
        if (type === 'raw' && rawQuery) {
            console.log(`🔧 [${this.id}] Executing raw query`);
            return rawQuery(this.db);
        }
        // Parse query type (e.g., 'patient.getById' -> collection: 'patients', operation: 'getById')
        const [collection, operation] = type.split('.');
        if (!collection || !operation) {
            throw new Error(`Invalid query type format: ${type}. Expected format: 'collection.operation'`);
        }
        // Get the MongoDB collection
        const mongoCollection = this.db.collection(collection);
        // Route to specific operations
        switch (operation) {
            case 'getById':
                // Convert string ID to ObjectId if needed
                const idFilter = typeof params.id === 'string' && params.id.match(/^[0-9a-fA-F]{24}$/)
                    ? { _id: new mongodb_1.ObjectId(params.id) }
                    : { _id: params.id };
                const document = await mongoCollection.findOne(idFilter);
                return serializeDocument(document);
            case 'findOne':
                const oneDoc = await mongoCollection.findOne(params.filter || {}, params.options || {});
                return serializeDocument(oneDoc);
            case 'search':
            case 'find':
                const cursor = mongoCollection.find(params.filter || {}, params.options || {});
                if (params.limit)
                    cursor.limit(params.limit);
                if (params.skip)
                    cursor.skip(params.skip);
                if (params.sort)
                    cursor.sort(params.sort);
                const documents = await cursor.toArray();
                return serializeDocument(documents);
            case 'create':
            case 'insertOne':
                // Ensure document is valid for insertion
                if (!params.document) {
                    throw new Error('Document is required for insertOne operation');
                }
                const insertResult = await mongoCollection.insertOne(params.document);
                return serializeDocument({
                    acknowledged: insertResult.acknowledged,
                    insertedId: insertResult.insertedId,
                    ...params.document,
                    _id: insertResult.insertedId
                });
            case 'insertMany':
                if (!params.documents || !Array.isArray(params.documents)) {
                    throw new Error('Documents array is required for insertMany operation');
                }
                const insertManyResult = await mongoCollection.insertMany(params.documents);
                return {
                    acknowledged: insertManyResult.acknowledged,
                    insertedCount: insertManyResult.insertedCount,
                    insertedIds: insertManyResult.insertedIds
                };
            case 'update':
            case 'updateOne':
                if (!params.filter) {
                    throw new Error('Filter is required for updateOne operation');
                }
                if (!params.update) {
                    throw new Error('Update is required for updateOne operation');
                }
                const updateResult = await mongoCollection.updateOne(params.filter, params.update, params.options || {});
                return {
                    acknowledged: updateResult.acknowledged,
                    matchedCount: updateResult.matchedCount,
                    modifiedCount: updateResult.modifiedCount,
                    upsertedId: updateResult.upsertedId
                };
            case 'updateMany':
                if (!params.filter) {
                    throw new Error('Filter is required for updateMany operation');
                }
                if (!params.update) {
                    throw new Error('Update is required for updateMany operation');
                }
                const updateManyResult = await mongoCollection.updateMany(params.filter, params.update, params.options || {});
                return {
                    acknowledged: updateManyResult.acknowledged,
                    matchedCount: updateManyResult.matchedCount,
                    modifiedCount: updateManyResult.modifiedCount,
                    upsertedId: updateManyResult.upsertedId
                };
            case 'replaceOne':
                if (!params.filter) {
                    throw new Error('Filter is required for replaceOne operation');
                }
                if (!params.replacement) {
                    throw new Error('Replacement document is required for replaceOne operation');
                }
                const replaceResult = await mongoCollection.replaceOne(params.filter, params.replacement, params.options || {});
                return {
                    acknowledged: replaceResult.acknowledged,
                    matchedCount: replaceResult.matchedCount,
                    modifiedCount: replaceResult.modifiedCount,
                    upsertedId: replaceResult.upsertedId
                };
            case 'delete':
            case 'deleteOne':
                const deleteResult = await mongoCollection.deleteOne(params.filter);
                return deleteResult;
            case 'deleteMany':
                const deleteManyResult = await mongoCollection.deleteMany(params.filter);
                return deleteManyResult;
            case 'count':
                return mongoCollection.countDocuments(params.filter || {});
            case 'aggregate':
                return mongoCollection.aggregate(params.pipeline || []).toArray();
            case 'vectorSearch':
                // Special handling for vector search operations
                return mongoCollection.aggregate([
                    {
                        $vectorSearch: {
                            index: params.index || 'vector_index',
                            path: params.path || 'embedding',
                            queryVector: params.queryVector,
                            numCandidates: params.numCandidates || 100,
                            limit: params.limit || 10
                        }
                    }
                ]).toArray();
            default:
                throw new Error(`Unsupported operation: ${operation} on collection: ${collection}`);
        }
    }
    /**
     * Health check - ping the database
     */
    async ping() {
        try {
            if (!this.db)
                return false;
            // Simple ping using admin command
            await this.db.admin().ping();
            return true;
        }
        catch (error) {
            console.error(`❌ [${this.id}] Ping failed:`, error);
            return false;
        }
    }
    /**
     * Get detailed connection information
     */
    async getConnectionInfo() {
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
            // Get server info
            const serverInfo = await this.db.admin().serverStatus();
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
            return {
                isConnected: false
            };
        }
    }
    /**
     * Sanitize URI for display (hide credentials)
     */
    sanitizeUri(uri) {
        if (!uri)
            return undefined;
        return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    }
    /**
     * Get configuration capabilities (for dynamic UI generation)
     */
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
                    },
                    database: {
                        type: 'string',
                        description: 'Database name (optional, can be in URI)',
                        title: 'Database Name'
                    }
                },
                required: ['uri']
            },
            supportedOperations: [
                'patient.getById',
                'patient.findOne',
                'patient.search',
                'patient.find',
                'patient.create',
                'patient.insertOne',
                'patient.insertMany',
                'patient.update',
                'patient.updateOne',
                'patient.updateMany',
                'patient.replaceOne',
                'patient.delete',
                'patient.deleteOne',
                'patient.deleteMany',
                'patient.count',
                'patient.aggregate',
                'patients.getById',
                'patients.findOne',
                'patients.search',
                'patients.find',
                'patients.create',
                'patients.insertOne',
                'patients.insertMany',
                'patients.update',
                'patients.updateOne',
                'patients.updateMany',
                'patients.replaceOne',
                'patients.delete',
                'patients.deleteOne',
                'patients.deleteMany',
                'patients.count',
                'patients.aggregate',
                'notes.getById',
                'notes.findOne',
                'notes.search',
                'notes.find',
                'notes.create',
                'notes.insertOne',
                'notes.insertMany',
                'notes.update',
                'notes.updateOne',
                'notes.updateMany',
                'notes.replaceOne',
                'notes.delete',
                'notes.deleteOne',
                'notes.deleteMany',
                'notes.count',
                'notes.aggregate',
                'ai_cache.getById',
                'ai_cache.findOne',
                'ai_cache.create',
                'ai_cache.insertOne',
                'ai_cache.update',
                'ai_cache.updateOne',
                'ai_cache.replaceOne',
                'ai_cache.delete',
                'ai_cache.deleteOne',
                'case_embeddings.findOne',
                'case_embeddings.vectorSearch',
                'case_embeddings.search',
                'case_embeddings.find',
                'case_embeddings.create',
                'case_embeddings.insertOne',
                'case_embeddings.update',
                'case_embeddings.updateOne',
                'case_embeddings.replaceOne',
                'case_embeddings.delete',
                'case_embeddings.deleteOne',
                'raw'
            ],
            features: [
                'cloud-hosted',
                'vector-search',
                'full-text-search',
                'aggregation-pipeline',
                'atlas-search',
                'production-ready',
                'scalable'
            ]
        };
    }
}
exports.MongoDBAtlasDataSource = MongoDBAtlasDataSource;
//# sourceMappingURL=MongoDBAtlasDataSource.js.map