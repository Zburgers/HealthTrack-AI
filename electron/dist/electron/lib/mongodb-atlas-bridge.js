"use strict";
/**
 * MongoDB Connection Bridge
 *
 * This module provides access to the MongoDB connection utilities
 * from within the Electron main process while respecting TypeScript
 * module boundaries.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToAtlas = connectToAtlas;
exports.getAtlasDb = getAtlasDb;
exports.getAtlasClient = getAtlasClient;
exports.disconnectFromAtlas = disconnectFromAtlas;
exports.isAtlasConnected = isAtlasConnected;
// Since we can't directly import from src/ in electron/, we'll re-export
// the needed functionality or create our own MongoDB Atlas connection logic
const mongodb_1 = require("mongodb");
// MongoDB Atlas connection state
let atlasClient = null;
let atlasDb = null;
let atlasConnectedUri = null;
/**
 * Connect to MongoDB Atlas with the provided URI
 */
async function connectToAtlas(uri) {
    // If already connected to the same URI, return existing client
    if (atlasClient && atlasConnectedUri === uri) {
        console.log('📊 [ATLAS-BRIDGE] Using existing Atlas connection');
        return atlasClient;
    }
    // Close existing connection if connecting to different URI
    if (atlasClient) {
        console.log('📊 [ATLAS-BRIDGE] Closing previous Atlas connection');
        await atlasClient.close();
        atlasClient = null;
        atlasDb = null;
        atlasConnectedUri = null;
    }
    try {
        console.log('📊 [ATLAS-BRIDGE] Connecting to Atlas...');
        const client = new mongodb_1.MongoClient(uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        await client.connect();
        atlasClient = client;
        atlasDb = client.db(); // Use default database from URI
        atlasConnectedUri = uri;
        console.log('✅ [ATLAS-BRIDGE] Successfully connected to Atlas');
        return client;
    }
    catch (error) {
        console.error('❌ [ATLAS-BRIDGE] Failed to connect to Atlas:', error);
        throw error;
    }
}
/**
 * Get the current Atlas database instance
 */
function getAtlasDb() {
    if (!atlasDb) {
        throw new Error('Atlas database not connected. Call connectToAtlas first.');
    }
    return atlasDb;
}
/**
 * Get the current Atlas client instance
 */
function getAtlasClient() {
    if (!atlasClient) {
        throw new Error('Atlas client not connected. Call connectToAtlas first.');
    }
    return atlasClient;
}
/**
 * Disconnect from Atlas
 */
async function disconnectFromAtlas() {
    if (atlasClient) {
        console.log('📊 [ATLAS-BRIDGE] Disconnecting from Atlas...');
        await atlasClient.close();
        atlasClient = null;
        atlasDb = null;
        atlasConnectedUri = null;
        console.log('✅ [ATLAS-BRIDGE] Disconnected from Atlas');
    }
}
/**
 * Check if Atlas is connected
 */
function isAtlasConnected() {
    return atlasClient !== null && atlasDb !== null;
}
//# sourceMappingURL=mongodb-atlas-bridge.js.map