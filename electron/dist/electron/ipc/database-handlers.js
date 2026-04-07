"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatabaseIPCHandlers = setupDatabaseIPCHandlers;
/**
 * Electron Main Process - Database IPC Handlers
 *
 * This module registers IPC handlers for all database operations requested by the renderer process.
 * It uses the centralized local database connection from 'local-db.ts'.
 */
const electron_1 = require("electron");
const DataSourceManager_1 = require("../lib/DataSourceManager"); // Import the Switchboard
const data_mappers_1 = require("../lib/shared/data-mappers");
const executeQuery = async (query) => {
    const dataSourceManager = (0, DataSourceManager_1.getDataSourceManager)();
    return dataSourceManager.executeActiveSourceQuery(query);
};
function setupDatabaseIPCHandlers() {
    console.log('🔌 [DB-IPC] Registering database handlers with Switchboard...');
    // Health check
    electron_1.ipcMain.handle('db:ready', async () => {
        const dataSourceManager = (0, DataSourceManager_1.getDataSourceManager)();
        const status = dataSourceManager.getActiveSourceStatus();
        return status && status.status === 'connected';
    });
    // Status check --------------------------------------------------------------
    electron_1.ipcMain.handle('db:checkStatus', () => {
        const dsm = (0, DataSourceManager_1.getDataSourceManager)();
        return dsm.getActiveStatus();
    });
    // Generic database operations - These are used by the legacy API
    electron_1.ipcMain.handle('db:findOne', async (_event, collection, query) => {
        return executeQuery({
            type: `${collection}.findOne`,
            params: { filter: query }
        });
    });
    electron_1.ipcMain.handle('db:find', async (_event, collection, query, options = {}) => {
        return executeQuery({
            type: `${collection}.find`,
            params: { filter: query, options }
        });
    });
    electron_1.ipcMain.handle('db:insertOne', async (_event, collection, document) => {
        return executeQuery({
            type: `${collection}.insertOne`,
            params: { document }
        });
    });
    electron_1.ipcMain.handle('db:updateOne', async (_event, collection, filter, update, options = {}) => {
        return executeQuery({
            type: `${collection}.updateOne`,
            params: { filter, update: { $set: update }, options }
        });
    });
    electron_1.ipcMain.handle('db:deleteOne', async (_event, collection, filter) => {
        return executeQuery({
            type: `${collection}.deleteOne`,
            params: { filter }
        });
    });
    electron_1.ipcMain.handle('db:deleteMany', async (_event, collection, filter) => {
        return executeQuery({
            type: `${collection}.deleteMany`,
            params: { filter }
        });
    });
    // MongoDB specific health check and connection management
    electron_1.ipcMain.handle('db:health', async () => {
        try {
            const dsm = (0, DataSourceManager_1.getDataSourceManager)();
            const status = dsm.getActiveStatus();
            const connectionInfo = await dsm.getActiveSourceConnectionInfo();
            // Fix: Properly check status object and handle null cases
            if (status && status.status === 'connected' && connectionInfo) {
                console.log('✅ [DB-IPC] MongoDB health via Switchboard: ok');
                return {
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                    type: 'mongodb',
                    details: 'MongoDB is responding to queries via Switchboard',
                    connectionInfo: {
                        uri: connectionInfo.uri || 'Not configured',
                        database: connectionInfo.database || 'healthtrack',
                        source: status.sourceId,
                        sourceName: status.name
                    }
                };
            }
            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                type: 'mongodb',
                error: 'No active connection',
                details: 'No active database connection available'
            };
        }
        catch (error) {
            console.error('❌ [DB-IPC] Health check failed:', error);
            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                type: 'mongodb',
                error: error instanceof Error ? error.message : 'Unknown error',
                details: 'Failed to connect to MongoDB. Please check your connection string and ensure your IP is whitelisted.'
            };
        }
    });
    // Database info handler
    electron_1.ipcMain.handle('db:getInfo', async () => {
        try {
            console.log('🔍 [DB-IPC] Getting database info via Switchboard...');
            const dsm = (0, DataSourceManager_1.getDataSourceManager)();
            const connectionInfo = dsm.getConnectionInfo();
            const activeSourceInfo = await dsm.getActiveSourceConnectionInfo();
            if (connectionInfo.length > 0) {
                try {
                    const activeStatus = dsm.getActiveStatus();
                    // Fix: Check if activeStatus exists and has required properties
                    if (!activeStatus || !activeStatus.status) {
                        throw new Error('No active data source available');
                    }
                    // Execute query through Switchboard for collections info
                    const collectionsInfo = await dsm.executeActiveSourceQuery({
                        type: 'raw',
                        params: {},
                        rawQuery: async (db) => {
                            const collections = await db.listCollections().toArray();
                            const result = [];
                            for (const collection of collections) {
                                try {
                                    const count = await db.collection(collection.name).estimatedDocumentCount();
                                    result.push({
                                        name: collection.name,
                                        count: count,
                                        location: collection.name === 'case_embeddings' ? 'remote (embeddings)' : 'remote (user)'
                                    });
                                }
                                catch (countError) {
                                    console.warn(`Failed to get count for collection ${collection.name}:`, countError);
                                    result.push({
                                        name: collection.name,
                                        count: 0,
                                        location: collection.name === 'case_embeddings' ? 'remote (embeddings)' : 'remote (user)'
                                    });
                                }
                            }
                            return result;
                        }
                    });
                    return {
                        type: 'remote',
                        remoteHost: 'MongoDB Atlas (via Switchboard)',
                        collections: collectionsInfo || [],
                        totalSize: 'N/A',
                        connectionInfo: {
                            isConnected: activeSourceInfo?.isConnected || false,
                            uri: activeSourceInfo?.uri || 'Not configured via Switchboard',
                            host: `${activeStatus.name || 'MongoDB Atlas'} (${activeStatus.purpose || 'default'})`,
                            database: activeSourceInfo?.database || 'healthtrack'
                        },
                        dataSources: connectionInfo.map(src => ({
                            id: src.id,
                            name: src.name,
                            status: src.status,
                            purpose: src.purpose,
                            isActive: src.isActive
                        })),
                        lastBackup: null
                    };
                }
                catch (switchboardError) {
                    console.warn('⚠️ [DB-IPC] Switchboard query failed:', switchboardError);
                }
            }
            return {
                type: 'remote',
                remoteHost: 'MongoDB Atlas',
                collections: [],
                totalSize: 'N/A',
                connectionInfo: {
                    isConnected: false,
                    uri: 'Not configured',
                    host: 'MongoDB Atlas',
                    database: 'healthtrack'
                },
                lastBackup: null
            };
        }
        catch (error) {
            console.error('❌ [DB-IPC] Failed to get database info:', error);
            throw error;
        }
    });
    // User MongoDB URI management
    electron_1.ipcMain.handle('db:getUserMongoUri', async () => {
        try {
            const dsm = (0, DataSourceManager_1.getDataSourceManager)();
            const connectionInfo = await dsm.getActiveSourceConnectionInfo();
            return connectionInfo?.uri || null;
        }
        catch (error) {
            console.error('❌ [DB-IPC] Get URI failed:', error);
            return null;
        }
    });
    electron_1.ipcMain.handle('db:setUserMongoUri', async (_event, uri) => {
        try {
            const dsm = (0, DataSourceManager_1.getDataSourceManager)();
            await dsm.connectDataSource('mongodb-atlas', { uri });
            return true;
        }
        catch (error) {
            console.error('❌ [DB-IPC] Set URI failed:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('db:testConnection', async (_event, uri) => {
        try {
            const dsm = (0, DataSourceManager_1.getDataSourceManager)();
            // Test connection without switching active source
            await dsm.connectDataSource('mongodb-atlas', { uri, purpose: 'test', autoConnect: true });
            return { success: true };
        }
        catch (error) {
            console.error('❌ [DB-IPC] Test connection failed:', error);
            return { success: false, error: error.message };
        }
    });
    // Refactored handlers
    electron_1.ipcMain.handle('db:getPatients', async (_event, query = {}) => {
        const patients = await executeQuery({ type: 'patients.find', params: { filter: query } });
        return patients.map(data_mappers_1.mapDbPatientToFrontendPatient).filter(Boolean);
    });
    electron_1.ipcMain.handle('db:getPatient', async (_event, query) => {
        const patient = await executeQuery({ type: 'patients.findOne', params: { filter: query } });
        return (0, data_mappers_1.mapDbPatientToFrontendPatient)(patient);
    });
    electron_1.ipcMain.handle('db:getArchivedPatients', async () => {
        const patients = await executeQuery({ type: 'patients.find', params: { filter: { isDeleted: true } } });
        return patients.map(data_mappers_1.mapDbPatientToFrontendPatient).filter(Boolean);
    });
    electron_1.ipcMain.handle('db:createPatient', async (_event, patient) => {
        const result = await executeQuery({ type: 'patients.insertOne', params: { document: patient } });
        return { patientId: result._id.toString() };
    });
    electron_1.ipcMain.handle('db:addPatient', async (_event, patient) => {
        const result = await executeQuery({ type: 'patients.insertOne', params: { document: patient } });
        return { patientId: result._id.toString() };
    });
    electron_1.ipcMain.handle('db:updatePatient', async (_event, query, patient) => executeQuery({ type: 'patients.updateOne', params: { filter: query, update: { $set: patient } } }));
    electron_1.ipcMain.handle('db:deletePatient', async (_event, { id, reason, deletedBy }) => {
        return executeQuery({
            type: 'patients.updateOne',
            params: {
                filter: { _id: id },
                update: {
                    $set: {
                        isDeleted: true,
                        deletedAt: new Date(),
                        deletionReason: reason,
                        deletedBy: deletedBy,
                    },
                },
            },
        });
    });
    electron_1.ipcMain.handle('db:getEncounters', async (_event, query = {}) => executeQuery({ type: 'encounters.find', params: { filter: query } }));
    electron_1.ipcMain.handle('db:addEncounter', async (_event, encounter) => executeQuery({ type: 'encounters.insertOne', params: { document: encounter } }));
    electron_1.ipcMain.handle('db:getObservations', async (_event, query = {}) => executeQuery({ type: 'observations.find', params: { filter: query } }));
    electron_1.ipcMain.handle('db:addObservation', async (_event, observation) => executeQuery({ type: 'observations.insertOne', params: { document: observation } }));
    electron_1.ipcMain.handle('db:getPractitioners', async (_event, query = {}) => executeQuery({ type: 'practitioners.find', params: { filter: query } }));
    electron_1.ipcMain.handle('db:addPractitioner', async (_event, practitioner) => executeQuery({ type: 'practitioners.insertOne', params: { document: practitioner } }));
    electron_1.ipcMain.handle('db:getMedications', async (_event, query = {}) => executeQuery({ type: 'medications.find', params: { filter: query } }));
    electron_1.ipcMain.handle('db:addMedication', async (_event, medication) => executeQuery({ type: 'medications.insertOne', params: { document: medication } }));
    electron_1.ipcMain.handle('db:getMedicationRequests', async (_event, query = {}) => executeQuery({ type: 'medicationRequests.find', params: { filter: query } }));
    electron_1.ipcMain.handle('db:addMedicationRequest', async (_event, request) => executeQuery({ type: 'medicationRequests.insertOne', params: { document: request } }));
    electron_1.ipcMain.handle('db:getAppointments', async (_event, query = {}) => executeQuery({ type: 'appointments.find', params: { filter: query } }));
    electron_1.ipcMain.handle('db:addAppointment', async (_event, appointment) => executeQuery({ type: 'appointments.insertOne', params: { document: appointment } }));
    electron_1.ipcMain.handle('db:updateAppointment', async (_event, query, appointment) => executeQuery({ type: 'appointments.updateOne', params: { filter: query, update: { $set: appointment } } }));
    electron_1.ipcMain.handle('db:deleteAppointment', async (_event, query) => executeQuery({ type: 'appointments.deleteOne', params: { filter: query } }));
    electron_1.ipcMain.handle('db:getSOAPNotes', async (_event, query = {}) => executeQuery({ type: 'soapNotes.find', params: { filter: query } }));
    electron_1.ipcMain.handle('db:addSOAPNote', async (_event, note) => executeQuery({ type: 'soapNotes.insertOne', params: { document: note } }));
    electron_1.ipcMain.handle('db:updateSOAPNote', async (_event, query, note) => executeQuery({ type: 'soapNotes.updateOne', params: { filter: query, update: { $set: note } } }));
    electron_1.ipcMain.handle('db:getTasks', async (_event, query = {}) => executeQuery({ type: 'tasks.find', params: { filter: query } }));
    electron_1.ipcMain.handle('db:addTask', async (_event, task) => executeQuery({ type: 'tasks.insertOne', params: { document: task } }));
    electron_1.ipcMain.handle('db:updateTask', async (_event, query, task) => executeQuery({ type: 'tasks.updateOne', params: { filter: query, update: { $set: task } } }));
    electron_1.ipcMain.handle('db:deleteTask', async (_event, query) => executeQuery({ type: 'tasks.deleteOne', params: { filter: query } }));
    electron_1.ipcMain.handle('db:getCodeMappings', async (_event, query = {}) => executeQuery({ type: 'codeMappings.find', params: { filter: query } }));
    electron_1.ipcMain.handle('db:addCodeMapping', async (_event, mapping) => executeQuery({ type: 'codeMappings.insertOne', params: { document: mapping } }));
    electron_1.ipcMain.handle('db:getSettings', async (_event, query = {}) => executeQuery({ type: 'settings.find', params: { filter: query } }));
    electron_1.ipcMain.handle('db:updateSetting', async (_event, key, value) => {
        return executeQuery({ type: 'settings.updateOne', params: { filter: { key }, update: { $set: { value } }, options: { upsert: true } } });
    });
    electron_1.ipcMain.handle('db:getLogs', async (_event, query = {}) => executeQuery({ type: 'logs.find', params: { filter: query } }));
    electron_1.ipcMain.handle('db:addLog', async (_event, log) => executeQuery({ type: 'logs.insertOne', params: { document: log } }));
    // AI Cache operations
    electron_1.ipcMain.handle('db:getAICache', async (_event, key) => {
        try {
            const cache = await executeQuery({
                type: 'ai_cache.findOne',
                params: { filter: { key } }
            });
            if (!cache)
                return null;
            // Check if cache is expired
            const expiryTime = cache.expiryTime || 0;
            if (expiryTime && expiryTime < Date.now()) {
                // Cache expired, delete it
                await executeQuery({ type: 'ai_cache.deleteOne', params: { filter: { key } } });
                return null;
            }
            return cache;
        }
        catch (error) {
            console.error('❌ [DB-IPC] Get AI cache failed:', error);
            return null;
        }
    });
    electron_1.ipcMain.handle('db:setAICache', async (_event, key, workflow, input, output, expiryMs = 86400000) => {
        try {
            const expiryTime = Date.now() + expiryMs;
            await executeQuery({
                type: 'ai_cache.updateOne',
                params: {
                    filter: { key },
                    update: {
                        $set: {
                            key,
                            workflow,
                            input,
                            output,
                            expiryTime,
                            createdAt: Date.now()
                        }
                    },
                    options: { upsert: true }
                }
            });
            return true;
        }
        catch (error) {
            console.error('❌ [DB-IPC] Set AI cache failed:', error);
            return false;
        }
    });
    // Additional database operations
    electron_1.ipcMain.handle('db:countDocuments', async (_event, collection, filter = {}) => {
        try {
            console.log(`📊 [DB-IPC] Counting documents in ${collection}:`, filter);
            const result = await executeQuery({
                type: `${collection}.count`,
                params: { filter }
            });
            console.log(`✅ [DB-IPC] countDocuments result for ${collection}:`, result);
            return result;
        }
        catch (error) {
            console.error(`❌ [DB-IPC] Failed to countDocuments in ${collection}:`, error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('db:aggregate', async (_event, collection, pipeline) => {
        try {
            console.log(`🔍 [DB-IPC] Aggregating in ${collection} with pipeline:`, pipeline);
            const result = await executeQuery({
                type: `${collection}.aggregate`,
                params: { pipeline }
            });
            console.log(`✅ [DB-IPC] aggregate result for ${collection}: ${result.length} documents`);
            return result;
        }
        catch (error) {
            console.error(`❌ [DB-IPC] Failed to aggregate in ${collection}:`, error);
            throw error;
        }
    });
    console.log('✅ [DB-IPC] Database handlers registered successfully');
}
//# sourceMappingURL=database-handlers.js.map