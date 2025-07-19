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
        return status.status === 'connected';
    });
    // Generic find operation
    const find = async (collectionName, query = {}) => {
        return executeQuery({ type: 'find', params: { collection: collectionName, query } });
    };
    // Generic findOne operation
    const findOne = async (collectionName, query) => {
        return executeQuery({ type: 'findOne', params: { collection: collectionName, query } });
    };
    // Generic insertOne operation
    const insertOne = async (collectionName, doc) => {
        return executeQuery({ type: 'insertOne', params: { collection: collectionName, payload: doc } });
    };
    // Status check --------------------------------------------------------------
    electron_1.ipcMain.handle('db:checkStatus', () => {
        const dsm = (0, DataSourceManager_1.getDataSourceManager)();
        return dsm.getActiveStatus();
    });
    // Generic updateOne operation
    const updateOne = async (collectionName, query, update, options) => {
        return executeQuery({ type: 'updateOne', params: { collection: collectionName, query, payload: update, options } });
    };
    // Generic deleteOne operation
    const deleteOne = async (collectionName, query) => {
        return executeQuery({ type: 'deleteOne', params: { collection: collectionName, query } });
    };
    // Refactored handlers
    electron_1.ipcMain.handle('db:getPatients', async (_event, query = {}) => find('patients', query));
    electron_1.ipcMain.handle('db:getPatient', async (_event, query) => findOne('patients', query));
    electron_1.ipcMain.handle('db:addPatient', async (_event, patient) => insertOne('patients', patient));
    electron_1.ipcMain.handle('db:updatePatient', async (_event, query, patient) => updateOne('patients', query, { $set: patient }));
    electron_1.ipcMain.handle('db:getEncounters', async (_event, query = {}) => find('encounters', query));
    electron_1.ipcMain.handle('db:addEncounter', async (_event, encounter) => insertOne('encounters', encounter));
    electron_1.ipcMain.handle('db:getObservations', async (_event, query = {}) => find('observations', query));
    electron_1.ipcMain.handle('db:addObservation', async (_event, observation) => insertOne('observations', observation));
    electron_1.ipcMain.handle('db:getPractitioners', async (_event, query = {}) => find('practitioners', query));
    electron_1.ipcMain.handle('db:addPractitioner', async (_event, practitioner) => insertOne('practitioners', practitioner));
    electron_1.ipcMain.handle('db:getMedications', async (_event, query = {}) => find('medications', query));
    electron_1.ipcMain.handle('db:addMedication', async (_event, medication) => insertOne('medications', medication));
    electron_1.ipcMain.handle('db:getMedicationRequests', async (_event, query = {}) => find('medicationRequests', query));
    electron_1.ipcMain.handle('db:addMedicationRequest', async (_event, request) => insertOne('medicationRequests', request));
    electron_1.ipcMain.handle('db:getAppointments', async (_event, query = {}) => find('appointments', query));
    electron_1.ipcMain.handle('db:addAppointment', async (_event, appointment) => insertOne('appointments', appointment));
    electron_1.ipcMain.handle('db:updateAppointment', async (_event, query, appointment) => updateOne('appointments', query, { $set: appointment }));
    electron_1.ipcMain.handle('db:deleteAppointment', async (_event, query) => deleteOne('appointments', query));
    electron_1.ipcMain.handle('db:getSOAPNotes', async (_event, query = {}) => find('soapNotes', query));
    electron_1.ipcMain.handle('db:addSOAPNote', async (_event, note) => insertOne('soapNotes', note));
    electron_1.ipcMain.handle('db:updateSOAPNote', async (_event, query, note) => updateOne('soapNotes', query, { $set: note }));
    electron_1.ipcMain.handle('db:getTasks', async (_event, query = {}) => find('tasks', query));
    electron_1.ipcMain.handle('db:addTask', async (_event, task) => insertOne('tasks', task));
    electron_1.ipcMain.handle('db:updateTask', async (_event, query, task) => updateOne('tasks', query, { $set: task }));
    electron_1.ipcMain.handle('db:deleteTask', async (_event, query) => deleteOne('tasks', query));
    electron_1.ipcMain.handle('db:getCodeMappings', async (_event, query = {}) => find('codeMappings', query));
    electron_1.ipcMain.handle('db:addCodeMapping', async (_event, mapping) => insertOne('codeMappings', mapping));
    electron_1.ipcMain.handle('db:getSettings', async (_event, query = {}) => find('settings', query));
    electron_1.ipcMain.handle('db:updateSetting', async (_event, key, value) => {
        return updateOne('settings', { key }, { $set: { value } }, { upsert: true });
    });
    electron_1.ipcMain.handle('db:getLogs', async (_event, query = {}) => find('logs', query));
    electron_1.ipcMain.handle('db:addLog', async (_event, log) => insertOne('logs', log));
    console.log('✅ [DB-IPC] Database handlers registered successfully');
}
//# sourceMappingURL=database-handlers.js.map