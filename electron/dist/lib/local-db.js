"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startLocalDatabase = startLocalDatabase;
exports.stopLocalDatabase = stopLocalDatabase;
exports.getLocalDb = getLocalDb;
exports.getLocalCollection = getLocalCollection;
/**
 * Electron Main Process - Local Database Manager
 *
 * This module manages the in-memory MongoDB server instance for the Electron app.
 * It ensures that a single, consistent local database is available for the main process to access.
 */
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongodb_1 = require("mongodb");
const constants_1 = require("../config/constants");
let mongod = null;
let localClient = null;
let localDb = null;
/**
 * Starts the local MongoDB server and establishes a connection.
 */
async function startLocalDatabase() {
    if (mongod) {
        console.log('📊 [LOCAL-DB] Database already running');
        return;
    }
    try {
        console.log('📊 [LOCAL-DB] Starting MongoDB memory server...');
        mongod = await mongodb_memory_server_1.MongoMemoryServer.create({ instance: { port: constants_1.MONGODB_CONFIG.LOCAL_PORT } });
        const uri = mongod.getUri();
        console.log('📊 [LOCAL-DB] Connecting to database...');
        localClient = new mongodb_1.MongoClient(uri, constants_1.MONGODB_CONFIG.LOCAL_OPTIONS);
        await localClient.connect();
        localDb = localClient.db(constants_1.DATABASE_NAMES.LOCAL);
        console.log(`✅ [LOCAL-DB] Database ready at ${uri}`);
    }
    catch (error) {
        console.error('❌ [LOCAL-DB] Failed to start database:', error);
        await stopLocalDatabase();
        throw error;
    }
}
/**
 * Stops the local MongoDB server and closes the connection.
 */
async function stopLocalDatabase() {
    try {
        if (localClient) {
            await localClient.close();
            localClient = null;
            localDb = null;
            console.log('Local MongoDB client disconnected.');
        }
        if (mongod) {
            await mongod.stop();
            mongod = null;
            console.log('Local MongoDB server stopped.');
        }
    }
    catch (error) {
        console.error('❌ Error stopping local database:', error);
    }
}
/**
 * Gets the local database instance.
 * @throws {Error} if the database is not connected.
 */
function getLocalDb() {
    if (!localDb) {
        throw new Error('Local database is not connected. Call startLocalDatabase() first.');
    }
    return localDb;
}
/**
 * Gets a specific collection from the local database.
 */
async function getLocalCollection(collectionName) {
    const db = getLocalDb();
    return db.collection(collectionName);
}
//# sourceMappingURL=local-db.js.map