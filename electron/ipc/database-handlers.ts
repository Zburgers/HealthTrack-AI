// Electron Main Process – Database IPC Handlers (Switchboard-only)
// -----------------------------------------------------------------------------
// Thin IPC bridge that forwards every database call to the DataSourceManager
// (a.k.a. "Switchboard").  All legacy channels are preserved but simply map to
// the unified IQuery shape.  There is NO local-database fallback anymore.
// -----------------------------------------------------------------------------

import { ipcMain } from 'electron';
import type { IQuery } from '../lib/datasources/IDataSource';
import { getDataSourceManager } from '../lib/DataSourceManager';

const dsm = getDataSourceManager();

// Throws if there is no active connected source.  Keeps legacy handlers honest.
function assertConnected(): void {
  const status = dsm.getActiveStatus();
  if (!status.sourceId || status.status !== 'connected') {
    throw new Error('No active data source connected. Please configure a remote database in Settings → Database.');
  }
}

/**
 * Registers the IPC handlers.  Call this from `electron/main.ts` once, early in
 * the app lifecycle.
 */
export function setupDatabaseIPCHandlers(): void {
  console.log('🔌 [DB-IPC] Installing Switchboard-only IPC handlers…');

  // Generic entry – preferred path for new code.
  ipcMain.handle('db:query', async (_e, query: IQuery) => {
    assertConnected();
    return dsm.executeActiveSourceQuery(query);
  });

  // Legacy wrappers ----------------------------------------------------------
  ipcMain.handle('db:findOne', async (_e, collection: string, filter: Record<string, unknown>) => {
    assertConnected();
    return dsm.executeActiveSourceQuery({ type: `${collection}.findOne`, params: { filter } });
  });

  ipcMain.handle('db:find', async (_e, collection: string, filter: Record<string, unknown> = {}, options: Record<string, unknown> = {}) => {
    assertConnected();
    return dsm.executeActiveSourceQuery({ type: `${collection}.find`, params: { filter, options } });
  });

  ipcMain.handle('db:insertOne', async (_e, collection: string, document: Record<string, unknown>) => {
    assertConnected();
    return dsm.executeActiveSourceQuery({ type: `${collection}.insertOne`, params: { document } });
  });

  ipcMain.handle('db:updateOne', async (_e, collection: string, filter: Record<string, unknown>, update: Record<string, unknown>, options: Record<string, unknown> = {}) => {
    assertConnected();
    return dsm.executeActiveSourceQuery({ type: `${collection}.updateOne`, params: { filter, update, options } });
  });

  ipcMain.handle('db:deleteOne', async (_e, collection: string, filter: Record<string, unknown>) => {
    assertConnected();
    return dsm.executeActiveSourceQuery({ type: `${collection}.deleteOne`, params: { filter } });
  });

  // Convenience helpers ------------------------------------------------------
  ipcMain.handle('db:getPatients', async () => {
    assertConnected();
    return dsm.executeActiveSourceQuery({ type: 'patients.find', params: { filter: {} } });
  });

  ipcMain.handle('db:getPatientById', async (_e, id: string) => {
    assertConnected();
    return dsm.executeActiveSourceQuery({ type: 'patients.getById', params: { id } });
  });

  ipcMain.handle('db:findSimilarCases', async (_e, params: { patientData: Record<string, unknown>, filters?: Record<string, unknown> }) => {
    assertConnected();
    return dsm.executeActiveSourceQuery({ type: 'similar-cases.find', params });
  });

  // Remote-URI management -----------------------------------------------------
  ipcMain.handle('db:setUserMongoUri', async (_e, uri: string) => {
    // Delegate connection logic to the Switchboard.
    await dsm.connectDataSource('mongodb-atlas', { uri, purpose: 'user-data', autoConnect: true });
    return true;
  });

  ipcMain.handle('db:checkStatus', () => {
    return dsm.getActiveStatus();
  });

  ipcMain.handle('db:health', async () => {
    try {
      assertConnected();
      const info = await dsm.getActiveSourceConnectionInfo();
      return { status: 'ok', sourceInfo: info };
    } catch (err) {
      return { status: 'error', error: (err as Error).message };
    }
  });

  console.log('✅ [DB-IPC] Handlers ready (Switchboard-only).');
}
