"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasMongoDbUri = hasMongoDbUri;
exports.initializeMongoDBConnection = initializeMongoDBConnection;
exports.checkDatabaseHealth = checkDatabaseHealth;
/**
 * Database Initialization Module
 *
 * This module provides functions for initializing MongoDB connections
 * from the Electron main process.
 */
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
/**
 * Path to settings file
 */
const SETTINGS_FILE_PATH = path_1.default.join(process.cwd(), 'healthtrack-settings.json');
/**
 * Check if settings file contains MongoDB URI
 */
function hasMongoDbUri() {
    try {
        if (fs_1.default.existsSync(SETTINGS_FILE_PATH)) {
            const settings = JSON.parse(fs_1.default.readFileSync(SETTINGS_FILE_PATH, 'utf8'));
            return !!settings.mongoUri;
        }
    }
    catch (error) {
        console.error('❌ [DATABASE] Error reading settings file:', error);
    }
    return false;
}
/**
 * Initialize MongoDB connection by calling the API endpoint
 * This approach uses the API layer to ensure consistency with the Next.js app
 */
async function initializeMongoDBConnection(baseUrl) {
    console.log('📊 [DATABASE] Initializing MongoDB connections via API...');
    if (!hasMongoDbUri()) {
        console.log('ℹ️ [DATABASE] No MongoDB URI found in settings. Skipping automatic connection.');
        return false;
    }
    try {
        // First call the database/status endpoint to trigger connections
        const statusUrl = `${baseUrl}/api/database/status`;
        console.log(`📊 [DATABASE] Calling API to check database status: ${statusUrl}`);
        const statusResponse = await (0, node_fetch_1.default)(statusUrl);
        const statusData = await statusResponse.json();
        if (statusData.connected) {
            console.log('✅ [DATABASE] Successfully connected to MongoDB via API');
            console.log(`📊 [DATABASE] Connected to: ${statusData.uri || 'unknown'}`);
            if (statusData.collections?.length) {
                console.log(`📊 [DATABASE] Available collections: ${statusData.collections.join(', ')}`);
            }
            if (statusData.caseEmbeddingsConnected) {
                console.log('✅ [DATABASE] Case embeddings database also connected');
            }
            return true;
        }
        else {
            console.log('⚠️ [DATABASE] Not connected according to status endpoint');
            // If not connected, try to force a connection
            const connectUrl = `${baseUrl}/api/database/connect`;
            console.log(`📊 [DATABASE] Attempting to connect via API: ${connectUrl}`);
            const settings = JSON.parse(fs_1.default.readFileSync(SETTINGS_FILE_PATH, 'utf8'));
            const connectResponse = await (0, node_fetch_1.default)(connectUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mongoUri: settings.mongoUri })
            });
            const connectData = await connectResponse.json();
            if (connectData.success) {
                console.log('✅ [DATABASE] Successfully connected to MongoDB via connect endpoint');
                return true;
            }
            else {
                console.error('❌ [DATABASE] Failed to connect to MongoDB:', connectData.error);
                return false;
            }
        }
    }
    catch (error) {
        console.error('❌ [DATABASE] Error initializing MongoDB connection:', error);
        return false;
    }
}
/**
 * Check database health
 */
async function checkDatabaseHealth(baseUrl) {
    try {
        const url = `${baseUrl}/api/database/status`;
        console.log(`📊 [DATABASE] Checking database health: ${url}`);
        const response = await (0, node_fetch_1.default)(url);
        const data = await response.json();
        if (data.connected) {
            console.log('✅ [DATABASE] Database health check passed');
        }
        else {
            console.log('⚠️ [DATABASE] Database health check failed, not connected');
        }
    }
    catch (error) {
        console.error('❌ [DATABASE] Error checking database health:', error);
    }
}
//# sourceMappingURL=database-init.js.map