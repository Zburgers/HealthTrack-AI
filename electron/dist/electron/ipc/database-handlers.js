"use strict";
// Electron Main Process – Database IPC Handlers (Switchboard-only)
// -----------------------------------------------------------------------------
// Thin IPC bridge that forwards every database call to the DataSourceManager
// (a.k.a. "Switchboard").  All legacy channels are preserved but simply map to
// the unified IQuery shape.  There is NO local-database fallback anymore.
// -----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatabaseIPCHandlers = setupDatabaseIPCHandlers;
const electron_1 = require("electron");
const DataSourceManager_1 = require("../lib/DataSourceManager");
const dsm = (0, DataSourceManager_1.getDataSourceManager)();
// Throws if there is no active connected source.  Keeps legacy handlers honest.
function assertConnected() {
    const status = dsm.getActiveStatus();
    if (!status.sourceId || status.status !== 'connected') {
        throw new Error('No active data source connected. Please configure a remote database in Settings → Database.');
    }
}
/**
 * Registers the IPC handlers.  Call this from `electron/main.ts` once, early in
 * the app lifecycle.
 */
function setupDatabaseIPCHandlers() {
    console.log('🔌 [DB-IPC] Installing Switchboard-only IPC handlers…');
    // Generic entry – preferred path for new code.
    electron_1.ipcMain.handle('db:query', async (_e, query) => {
        assertConnected();
        return dsm.executeActiveSourceQuery(query);
    });
    // Legacy wrappers ----------------------------------------------------------
    electron_1.ipcMain.handle('db:findOne', async (_e, collection, filter) => {
        assertConnected();
        return dsm.executeActiveSourceQuery({ type: `${collection}.findOne`, params: { filter } });
    });
    electron_1.ipcMain.handle('db:find', async (_e, collection, filter = {}, options = {}) => {
        assertConnected();
        return dsm.executeActiveSourceQuery({ type: `${collection}.find`, params: { filter, options } });
    });
    electron_1.ipcMain.handle('db:insertOne', async (_e, collection, document) => {
        assertConnected();
        return dsm.executeActiveSourceQuery({ type: `${collection}.insertOne`, params: { document } });
    });
    electron_1.ipcMain.handle('db:updateOne', async (_e, collection, filter, update, options = {}) => {
        assertConnected();
        return dsm.executeActiveSourceQuery({ type: `${collection}.updateOne`, params: { filter, update, options } });
    });
    electron_1.ipcMain.handle('db:deleteOne', async (_e, collection, filter) => {
        assertConnected();
        return dsm.executeActiveSourceQuery({ type: `${collection}.deleteOne`, params: { filter } });
    });
    // Convenience helpers ------------------------------------------------------
    electron_1.ipcMain.handle('db:getPatients', async () => {
        assertConnected();
        return dsm.executeActiveSourceQuery({ type: 'patients.find', params: { filter: {} } });
    });
    electron_1.ipcMain.handle('db:getPatientById', async (_e, id) => {
        assertConnected();
        return dsm.executeActiveSourceQuery({ type: 'patients.getById', params: { id } });
    });
    electron_1.ipcMain.handle('db:findSimilarCases', async (_e, params) => {
        assertConnected();
        return dsm.executeActiveSourceQuery({ type: 'similar-cases.find', params });
    });
    // Remote-URI management -----------------------------------------------------
    electron_1.ipcMain.handle('db:setUserMongoUri', async (_e, uri) => {
        // Delegate connection logic to the Switchboard.
        await dsm.connectDataSource('mongodb-atlas', { uri, purpose: 'user-data', autoConnect: true });
        return true;
    });
    electron_1.ipcMain.handle('db:checkStatus', () => {
        return dsm.getActiveStatus();
    });
    electron_1.ipcMain.handle('db:health', async () => {
        try {
            assertConnected();
            const info = await dsm.getActiveSourceConnectionInfo();
            return { status: 'ok', sourceInfo: info };
        }
        catch (err) {
            return { status: 'error', error: err.message };
        }
    });
    console.log('✅ [DB-IPC] Handlers ready (Switchboard-only).');
}
//# sourceMappingURL=database-handlers.js.map