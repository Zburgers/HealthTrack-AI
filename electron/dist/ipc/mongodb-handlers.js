"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMongoDBIpcHandlers = setupMongoDBIpcHandlers;
exports.closeMongoDBConnection = closeMongoDBConnection;
const electron_1 = require("electron");
const mongodb_1 = require("mongodb");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_2 = require("electron");
// MongoDB connections for Electron main process
let defaultMongoClient = null; // For embeddings (always uses env URI)
let defaultMongoDb = null;
let userMongoClient = null; // For user data (uses configurable URI)
let userMongoDb = null;
// URI management
let userMongoUri = null;
const USER_URI_FILE_PATH = path.join(electron_2.app.getPath('userData'), 'mongodb-uri.json');
/**
 * Load user MongoDB URI from persistent storage
 */
function loadUserMongoUri() {
    try {
        if (fs.existsSync(USER_URI_FILE_PATH)) {
            const data = JSON.parse(fs.readFileSync(USER_URI_FILE_PATH, 'utf-8'));
            return data.uri || null;
        }
    }
    catch (error) {
        console.warn('❌ [MONGODB_IPC] Failed to load user MongoDB URI:', error);
    }
    return null;
}
/**
 * Save user MongoDB URI to persistent storage
 */
function saveUserMongoUri(uri) {
    try {
        const dir = path.dirname(USER_URI_FILE_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(USER_URI_FILE_PATH, JSON.stringify({ uri }));
    }
    catch (error) {
        console.error('❌ [MONGODB_IPC] Failed to save user MongoDB URI:', error);
        throw error;
    }
}
/**
 * Initialize default MongoDB connection (for embeddings - always uses env URI)
 */
async function initializeDefaultMongoDBConnection() {
    if (defaultMongoDb) {
        return; // Already connected
    }
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable not set');
        }
        console.log('🔗 [MONGODB_IPC] Initializing default MongoDB connection (embeddings)...');
        defaultMongoClient = new mongodb_1.MongoClient(MONGODB_URI, {
            serverApi: {
                version: mongodb_1.ServerApiVersion.v1,
                strict: false, // Allow $vectorSearch
                deprecationErrors: true,
            },
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });
        await defaultMongoClient.connect();
        defaultMongoDb = defaultMongoClient.db('healthtrack');
        console.log('✅ [MONGODB_IPC] Default MongoDB connected (embeddings)');
    }
    catch (error) {
        console.error('❌ [MONGODB_IPC] Failed to connect to default MongoDB:', error);
        throw error;
    }
}
/**
 * Initialize user MongoDB connection (for user data - uses configurable URI)
 */
async function initializeUserMongoDBConnection() {
    try {
        // Load user URI, fallback to env URI if not configured
        userMongoUri = loadUserMongoUri() || process.env.MONGODB_URI || null;
        if (!userMongoUri) {
            throw new Error('No MongoDB URI available for user data');
        }
        console.log('🔗 [MONGODB_IPC] Initializing user MongoDB connection...');
        // Close existing connection if any
        if (userMongoClient) {
            await userMongoClient.close();
        }
        userMongoClient = new mongodb_1.MongoClient(userMongoUri, {
            serverApi: {
                version: mongodb_1.ServerApiVersion.v1,
                strict: false,
                deprecationErrors: true,
            },
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });
        await userMongoClient.connect();
        userMongoDb = userMongoClient.db('healthtrack');
        console.log('✅ [MONGODB_IPC] User MongoDB connected');
    }
    catch (error) {
        console.error('❌ [MONGODB_IPC] Failed to connect to user MongoDB:', error);
        throw error;
    }
}
/**
 * Get appropriate MongoDB database instance based on collection
 */
function getMongoDatabase(collection) {
    // Use default DB for embeddings, user DB for everything else
    if (collection === 'case_embeddings') {
        if (!defaultMongoDb) {
            throw new Error('Default MongoDB not initialized. Call initializeDefaultMongoDBConnection() first.');
        }
        return defaultMongoDb;
    }
    else {
        if (!userMongoDb) {
            throw new Error('User MongoDB not initialized. Call initializeUserMongoDBConnection() first.');
        }
        return userMongoDb;
    }
}
/**
 * Setup MongoDB-based IPC handlers
 */
function setupMongoDBIpcHandlers() {
    console.log('🔌 [MONGODB_IPC] Setting up MongoDB IPC handlers...');
    // Initialize MongoDB connections on startup
    Promise.all([
        initializeDefaultMongoDBConnection(),
        initializeUserMongoDBConnection()
    ]).catch((error) => {
        console.error('❌ [MONGODB_IPC] Failed to initialize MongoDB connections:', error);
    });
    // Database health check
    electron_1.ipcMain.handle('db-health', async () => {
        try {
            console.log('🏥 [MONGODB_IPC] Checking MongoDB health...');
            const db = getMongoDatabase();
            await db.admin().ping();
            const result = {
                status: 'ok',
                timestamp: new Date().toISOString(),
                type: 'mongodb',
                details: 'MongoDB is responding to queries'
            };
            console.log('✅ [MONGODB_IPC] MongoDB health: ok');
            return result;
        }
        catch (error) {
            console.error('❌ [MONGODB_IPC] Health check failed:', error);
            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                type: 'mongodb',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });
    // Database info
    electron_1.ipcMain.handle('db-getInfo', async () => {
        try {
            console.log('🔍 [MONGODB_IPC] Getting MongoDB database info...');
            // Get info from both connections
            const defaultDb = getMongoDatabase('case_embeddings');
            const userDb = getMongoDatabase('patients');
            // Get collection information
            const collections = await userDb.listCollections().toArray();
            const collectionsInfo = [];
            for (const collection of collections) {
                try {
                    const count = await userDb.collection(collection.name).estimatedDocumentCount();
                    collectionsInfo.push({
                        name: collection.name,
                        count: count,
                        location: collection.name === 'case_embeddings' ? 'remote (embeddings)' : 'remote (user)'
                    });
                }
                catch (error) {
                    console.warn(`Failed to get count for collection ${collection.name}:`, error);
                    collectionsInfo.push({
                        name: collection.name,
                        count: 0,
                        location: collection.name === 'case_embeddings' ? 'remote (embeddings)' : 'remote (user)'
                    });
                }
            }
            // Add embeddings collection info if it's not in the user DB
            if (!collectionsInfo.find(c => c.name === 'case_embeddings')) {
                try {
                    const embeddingsCount = await defaultDb.collection('case_embeddings').estimatedDocumentCount();
                    collectionsInfo.push({
                        name: 'case_embeddings',
                        count: embeddingsCount,
                        location: 'remote (embeddings)'
                    });
                }
                catch (error) {
                    console.warn('Failed to get embeddings collection count:', error);
                    collectionsInfo.push({
                        name: 'case_embeddings',
                        count: 0,
                        location: 'remote (embeddings)'
                    });
                }
            }
            return {
                type: 'remote',
                remoteHost: 'MongoDB Atlas',
                collections: collectionsInfo,
                totalSize: 'N/A',
                connectionInfo: {
                    isConnected: !!defaultMongoDb,
                    uri: process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Not configured',
                    host: 'MongoDB Atlas (Embeddings)',
                    database: 'healthtrack'
                },
                remoteConnectionInfo: {
                    isConnected: !!userMongoDb,
                    uri: userMongoUri?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Not configured',
                    host: 'MongoDB Atlas (User Data)',
                    database: 'healthtrack'
                },
                lastBackup: null
            };
        }
        catch (error) {
            console.error('❌ [MONGODB_IPC] Failed to get database info:', error);
            throw error;
        }
    });
    // Database operations
    electron_1.ipcMain.handle('db-findOne', async (event, collection, query) => {
        try {
            console.log(`🔍 [MONGODB_IPC] Finding one in ${collection} with query:`, query);
            const db = getMongoDatabase(collection);
            const result = await db.collection(collection).findOne(query);
            console.log(`✅ [MONGODB_IPC] findOne result for ${collection}:`, result ? 'found' : 'not found');
            return result;
        }
        catch (error) {
            console.error(`❌ [MONGODB_IPC] Failed to findOne in ${collection}:`, error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('db-find', async (event, collection, query, options = {}) => {
        try {
            console.log(`🔍 [MONGODB_IPC] Finding in ${collection} with query:`, query, 'options:', options);
            const db = getMongoDatabase(collection);
            let cursor = db.collection(collection).find(query);
            if (options.sort) {
                cursor = cursor.sort(options.sort);
            }
            if (options.limit) {
                cursor = cursor.limit(options.limit);
            }
            if (options.skip) {
                cursor = cursor.skip(options.skip);
            }
            const result = await cursor.toArray();
            console.log(`✅ [MONGODB_IPC] find result for ${collection}: ${result.length} documents`);
            return result;
        }
        catch (error) {
            console.error(`❌ [MONGODB_IPC] Failed to find in ${collection}:`, error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('db-insertOne', async (event, collection, document) => {
        try {
            console.log(`📝 [MONGODB_IPC] Inserting one in ${collection}:`, document);
            const db = getMongoDatabase(collection);
            const result = await db.collection(collection).insertOne(document);
            console.log(`✅ [MONGODB_IPC] insertOne result for ${collection}:`, result.insertedId);
            return result;
        }
        catch (error) {
            console.error(`❌ [MONGODB_IPC] Failed to insertOne in ${collection}:`, error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('db-updateOne', async (event, collection, filter, update, options = {}) => {
        try {
            console.log(`📝 [MONGODB_IPC] Updating one in ${collection}:`, filter, update);
            const db = getMongoDatabase(collection);
            const result = await db.collection(collection).updateOne(filter, update, options);
            console.log(`✅ [MONGODB_IPC] updateOne result for ${collection}:`, result.modifiedCount, 'modified');
            return result;
        }
        catch (error) {
            console.error(`❌ [MONGODB_IPC] Failed to updateOne in ${collection}:`, error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('db-deleteOne', async (event, collection, filter) => {
        try {
            console.log(`🗑️ [MONGODB_IPC] Deleting one in ${collection}:`, filter);
            const db = getMongoDatabase(collection);
            const result = await db.collection(collection).deleteOne(filter);
            console.log(`✅ [MONGODB_IPC] deleteOne result for ${collection}:`, result.deletedCount, 'deleted');
            return result;
        }
        catch (error) {
            console.error(`❌ [MONGODB_IPC] Failed to deleteOne in ${collection}:`, error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('db-countDocuments', async (event, collection, filter = {}) => {
        try {
            console.log(`📊 [MONGODB_IPC] Counting documents in ${collection}:`, filter);
            const db = getMongoDatabase(collection);
            const result = await db.collection(collection).countDocuments(filter);
            console.log(`✅ [MONGODB_IPC] countDocuments result for ${collection}:`, result);
            return result;
        }
        catch (error) {
            console.error(`❌ [MONGODB_IPC] Failed to countDocuments in ${collection}:`, error);
            throw error;
        }
    });
    // Database operations for aggregate queries
    electron_1.ipcMain.handle('db-aggregate', async (event, collection, pipeline) => {
        try {
            console.log(`🔍 [MONGODB_IPC] Aggregating in ${collection} with pipeline:`, pipeline);
            const db = getMongoDatabase(collection);
            const result = await db.collection(collection).aggregate(pipeline).toArray();
            console.log(`✅ [MONGODB_IPC] aggregate result for ${collection}: ${result.length} documents`);
            return result;
        }
        catch (error) {
            console.error(`❌ [MONGODB_IPC] Failed to aggregate in ${collection}:`, error);
            throw error;
        }
    });
    // URI Management handlers
    electron_1.ipcMain.handle('db-getUserMongoUri', async () => {
        try {
            console.log('🔍 [MONGODB_IPC] Getting user MongoDB URI...');
            return userMongoUri;
        }
        catch (error) {
            console.error('❌ [MONGODB_IPC] Failed to get user MongoDB URI:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('db-setUserMongoUri', async (event, uri) => {
        try {
            console.log('🔧 [MONGODB_IPC] Setting user MongoDB URI...');
            // Validate the URI by attempting to connect
            const testClient = new mongodb_1.MongoClient(uri, {
                serverApi: {
                    version: mongodb_1.ServerApiVersion.v1,
                    strict: false,
                    deprecationErrors: true,
                },
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
            });
            await testClient.connect();
            await testClient.db('healthtrack').admin().ping();
            await testClient.close();
            // Save the URI and reconnect
            saveUserMongoUri(uri);
            await initializeUserMongoDBConnection();
            console.log('✅ [MONGODB_IPC] User MongoDB URI updated successfully');
            return { success: true };
        }
        catch (error) {
            console.error('❌ [MONGODB_IPC] Failed to set user MongoDB URI:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    });
    electron_1.ipcMain.handle('db-validateMongoUri', async (event, uri) => {
        try {
            console.log('🔍 [MONGODB_IPC] Validating MongoDB URI...');
            const testClient = new mongodb_1.MongoClient(uri, {
                serverApi: {
                    version: mongodb_1.ServerApiVersion.v1,
                    strict: false,
                    deprecationErrors: true,
                },
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
            });
            await testClient.connect();
            await testClient.db('healthtrack').admin().ping();
            await testClient.close();
            console.log('✅ [MONGODB_IPC] MongoDB URI validation successful');
            return { valid: true };
        }
        catch (error) {
            console.error('❌ [MONGODB_IPC] MongoDB URI validation failed:', error);
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    });
    // Specific collection handlers for better abstraction
    // Patient operations
    electron_1.ipcMain.handle('db-getPatients', async () => {
        try {
            console.log('🔍 [MONGODB_IPC] Getting all patients...');
            const db = getMongoDatabase('patients');
            const result = await db.collection('patients').find({}).sort({ last_updated: -1 }).toArray();
            console.log(`✅ [MONGODB_IPC] Found ${result.length} patients`);
            return result;
        }
        catch (error) {
            console.error('❌ [MONGODB_IPC] Failed to get patients:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('db-getPatient', async (event, id) => {
        try {
            console.log(`🔍 [MONGODB_IPC] Getting patient with ID: ${id}`);
            const db = getMongoDatabase('patients');
            const result = await db.collection('patients').findOne({ id });
            console.log(`✅ [MONGODB_IPC] Patient found: ${result ? 'yes' : 'no'}`);
            return result;
        }
        catch (error) {
            console.error('❌ [MONGODB_IPC] Failed to get patient:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('db-createPatient', async (event, patient) => {
        try {
            console.log('➕ [MONGODB_IPC] Creating new patient...');
            // Generate ID if not present and add timestamps
            const patientWithId = {
                ...patient,
                id: patient.id || Date.now().toString(),
                created_at: patient.created_at || new Date().toISOString(),
                last_updated: new Date().toISOString()
            };
            const db = getMongoDatabase('patients');
            const result = await db.collection('patients').insertOne(patientWithId);
            console.log(`✅ [MONGODB_IPC] Patient created with ID: ${patientWithId.id}`);
            return { insertedId: result.insertedId, acknowledged: result.acknowledged };
        }
        catch (error) {
            console.error('❌ [MONGODB_IPC] Failed to create patient:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('db-updatePatient', async (event, id, updates) => {
        try {
            console.log(`✏️ [MONGODB_IPC] Updating patient with ID: ${id}`);
            // Add last_updated timestamp
            const updateData = {
                ...updates,
                last_updated: new Date().toISOString()
            };
            const db = getMongoDatabase('patients');
            const result = await db.collection('patients').updateOne({ id }, { $set: updateData });
            console.log(`✅ [MONGODB_IPC] Patient updated: ${result.modifiedCount} modified`);
            return result;
        }
        catch (error) {
            console.error('❌ [MONGODB_IPC] Failed to update patient:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('db-deletePatient', async (event, id) => {
        try {
            console.log(`❌ [MONGODB_IPC] Deleting patient with ID: ${id}`);
            const db = getMongoDatabase('patients');
            const result = await db.collection('patients').deleteOne({ id });
            console.log(`✅ [MONGODB_IPC] Patient deleted: ${result.deletedCount} deleted`);
            return result.deletedCount > 0;
        }
        catch (error) {
            console.error('❌ [MONGODB_IPC] Failed to delete patient:', error);
            throw error;
        }
    });
    // AI Cache operations
    electron_1.ipcMain.handle('db-getAICache', async (event, key) => {
        try {
            console.log(`🧠 [MONGODB_IPC] Getting AI cache for key: ${key}`);
            const db = getMongoDatabase('ai_cache');
            const result = await db.collection('ai_cache').findOne({ key });
            // Check if expired
            if (result && result.expires_at && new Date(result.expires_at) < new Date()) {
                console.log(`⏰ [MONGODB_IPC] AI cache expired for key: ${key}, removing...`);
                await db.collection('ai_cache').deleteOne({ key });
                return null;
            }
            console.log(`✅ [MONGODB_IPC] AI cache found: ${result ? 'yes' : 'no'}`);
            return result;
        }
        catch (error) {
            console.error('❌ [MONGODB_IPC] Failed to get AI cache:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('db-setAICache', async (event, key, workflow, input, output, expiryMs) => {
        try {
            const expiryTime = expiryMs ? new Date(Date.now() + expiryMs).toISOString() : null;
            console.log(`🧠 [MONGODB_IPC] Setting AI cache for key: ${key}, workflow: ${workflow}`);
            const cacheDocument = {
                key,
                workflow,
                input: JSON.stringify(input),
                output: JSON.stringify(output),
                created_at: new Date().toISOString(),
                expires_at: expiryTime
            };
            const db = getMongoDatabase('ai_cache');
            const result = await db.collection('ai_cache').replaceOne({ key }, cacheDocument, { upsert: true });
            console.log(`✅ [MONGODB_IPC] AI cache set for key: ${key}`);
            return { insertedId: key, ...result };
        }
        catch (error) {
            console.error('❌ [MONGODB_IPC] Failed to set AI cache:', error);
            throw error;
        }
    });
    // Database export handler
    electron_1.ipcMain.handle('db-exportData', async () => {
        try {
            console.log('📤 [MONGODB_IPC] Starting database export...');
            const { dialog } = require('electron');
            // Show save dialog
            const result = await dialog.showSaveDialog({
                title: 'Export MongoDB Database',
                defaultPath: `healthtrack-mongodb-export-${new Date().toISOString().split('T')[0]}.json`,
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });
            if (result.canceled || !result.filePath) {
                return { success: false, cancelled: true };
            }
            const exportData = {
                metadata: {
                    exportType: 'MongoDB',
                    appVersion: process.env.npm_package_version || 'unknown',
                    exportDate: new Date().toISOString(),
                    databases: {
                        default: process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Not configured',
                        user: userMongoUri?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Using default URI'
                    }
                },
                collections: {}
            };
            let totalDocuments = 0;
            let collectionsExported = 0;
            // Export user data collections
            const userDataCollections = ['patients', 'ai_cache', 'notes', 'local_embeddings', 'db_metadata'];
            for (const collectionName of userDataCollections) {
                try {
                    const db = getMongoDatabase(collectionName);
                    const documents = await db.collection(collectionName).find({}).toArray();
                    exportData.collections[collectionName] = documents;
                    totalDocuments += documents.length;
                    collectionsExported++;
                    console.log(`✅ [MONGODB_IPC] Exported ${documents.length} documents from ${collectionName}`);
                }
                catch (error) {
                    console.warn(`⚠️ [MONGODB_IPC] Failed to export collection ${collectionName}:`, error);
                    exportData.collections[collectionName] = [];
                }
            }
            // Write to file
            const fs = require('fs').promises;
            await fs.writeFile(result.filePath, JSON.stringify(exportData, null, 2), 'utf8');
            console.log(`✅ [MONGODB_IPC] Database export completed: ${collectionsExported} collections, ${totalDocuments} documents`);
            return {
                success: true,
                filePath: result.filePath,
                collectionsExported,
                totalDocuments
            };
        }
        catch (error) {
            console.error('❌ [MONGODB_IPC] Database export failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    });
    // Storage settings handlers (placeholder for compatibility)
    electron_1.ipcMain.handle('db-getStorageSettings', async () => {
        return {
            type: 'mongodb',
            defaultUri: process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Not configured',
            userUri: userMongoUri?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Using default URI',
            lastUpdated: new Date().toISOString()
        };
    });
    electron_1.ipcMain.handle('db-chooseStorageLocation', async () => {
        return {
            success: false,
            message: 'Storage location is managed via MongoDB URI configuration'
        };
    });
    // Health check handlers
    electron_1.ipcMain.handle('db-healthCheck', async () => {
        try {
            console.log('🏥 [MONGODB_IPC] Performing comprehensive health check...');
            const defaultHealth = await checkDefaultMongoHealth();
            const userHealth = await checkUserMongoHealth();
            const overallStatus = defaultHealth.connected && userHealth.connected ? 'healthy' : 'issues';
            return {
                status: overallStatus,
                timestamp: new Date().toISOString(),
                type: 'mongodb',
                details: {
                    default: defaultHealth,
                    user: userHealth
                }
            };
        }
        catch (error) {
            console.error('❌ [MONGODB_IPC] Health check failed:', error);
            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                type: 'mongodb',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });
    // Separate health checks for each database
    electron_1.ipcMain.handle('db-healthCheckDefault', async () => {
        try {
            return await checkDefaultMongoHealth();
        }
        catch (error) {
            console.error('❌ [MONGODB_IPC] Default health check failed:', error);
            return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    electron_1.ipcMain.handle('db-healthCheckUser', async () => {
        try {
            return await checkUserMongoHealth();
        }
        catch (error) {
            console.error('❌ [MONGODB_IPC] User health check failed:', error);
            return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    console.log('✅ [MONGODB_IPC] MongoDB IPC handlers setup complete');
}
/**
 * Close MongoDB connections
 */
async function closeMongoDBConnection() {
    const promises = [];
    if (defaultMongoClient) {
        promises.push(defaultMongoClient.close().then(() => {
            defaultMongoClient = null;
            defaultMongoDb = null;
            console.log('✅ [MONGODB_IPC] Default MongoDB connection closed');
        }));
    }
    if (userMongoClient) {
        promises.push(userMongoClient.close().then(() => {
            userMongoClient = null;
            userMongoDb = null;
            console.log('✅ [MONGODB_IPC] User MongoDB connection closed');
        }));
    }
    await Promise.all(promises);
    console.log('✅ [MONGODB_IPC] All MongoDB connections closed');
}
/**
 * Health check for default MongoDB connection (embeddings)
 */
async function checkDefaultMongoHealth() {
    try {
        if (!defaultMongoClient || !defaultMongoDb) {
            await initializeDefaultMongoDBConnection();
        }
        await defaultMongoDb.admin().ping();
        return {
            connected: true,
            uri: process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Not configured'
        };
    }
    catch (error) {
        console.error('❌ [MONGODB_IPC] Default MongoDB health check failed:', error);
        return {
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            uri: process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Not configured'
        };
    }
}
/**
 * Health check for user MongoDB connection (user data)
 */
async function checkUserMongoHealth() {
    try {
        if (!userMongoClient || !userMongoDb) {
            await initializeUserMongoDBConnection();
        }
        await userMongoDb.admin().ping();
        return {
            connected: true,
            uri: userMongoUri?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Using default URI'
        };
    }
    catch (error) {
        console.error('❌ [MONGODB_IPC] User MongoDB health check failed:', error);
        return {
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            uri: userMongoUri?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'Using default URI'
        };
    }
}
//# sourceMappingURL=mongodb-handlers.js.map