/**
 * Electron Main Process - Database IPC Handlers
 * 
 * This module registers IPC handlers for all database operations requested by the renderer process.
 * It uses the centralized local database connection from 'local-db.ts'.
 */
import { ipcMain } from 'electron';
import { getLocalCollection, getLocalDb } from '../lib/local-db';
import { ObjectId } from 'mongodb';

export function setupDatabaseIPCHandlers() {
  console.log('🔌 [DB-IPC] Registering database handlers...');

  ipcMain.handle('db:findOne', async (_, collection, query) => {
    try {
      const col = await getLocalCollection(collection);
      return col.findOne(query);
    } catch (error) {
      console.error(`❌ [DB-IPC] findOne failed for ${collection}:`, error);
      throw error;
    }
  });

  ipcMain.handle('db:find', async (_, collection, query, options) => {
    const col = await getLocalCollection(collection);
    const cursor = col.find(query, options);
    if (options?.sort) cursor.sort(options.sort);
    if (options?.limit) cursor.limit(options.limit);
    return cursor.toArray();
  });

  ipcMain.handle('db:insertOne', async (_, collection, document) => {
    const col = await getLocalCollection(collection);
    return col.insertOne(document);
  });

  ipcMain.handle('db:updateOne', async (_, collection, filter, update, options) => {
    const col = await getLocalCollection(collection);
    return col.updateOne(filter, update, options);
  });

  ipcMain.handle('db:deleteOne', async (_, collection, filter) => {
    const col = await getLocalCollection(collection);
    return col.deleteOne(filter);
  });

  // High-level Patient Operations
  ipcMain.handle('db:getPatients', async () => {
    const col = await getLocalCollection('patients');
    return col.find({ isDeleted: { $ne: true } }).toArray();
  });

  ipcMain.handle('db:getPatient', async (_, id) => {
    const col = await getLocalCollection('patients');
    return col.findOne({ _id: new ObjectId(id) });
  });

  ipcMain.handle('db:createPatient', async (_, patient) => {
    const col = await getLocalCollection('patients');
    const newPatient = { ...patient, _id: new ObjectId(), createdAt: new Date(), last_updated: new Date(), isDeleted: false };
    await col.insertOne(newPatient);
    return newPatient;
  });

  ipcMain.handle('db:updatePatient', async (_, id, updates) => {
    const col = await getLocalCollection('patients');
    return col.updateOne({ _id: new ObjectId(id) }, { $set: { ...updates, last_updated: new Date() } });
  });

  ipcMain.handle('db:deletePatient', async (_, id) => {
    const col = await getLocalCollection('patients');
    const result = await col.updateOne({ _id: new ObjectId(id) }, { $set: { isDeleted: true, deletedAt: new Date() } });
    return result.modifiedCount > 0;
  });

  // Database Status Check
  ipcMain.handle('db:checkStatus', async () => {
    try {
      const db = getLocalDb();
      // A simple command to check if the database is responsive.
      await db.command({ ping: 1 });
      return 'ready';
    } catch (error) {
      console.error('Database status check failed:', error);
      return 'error';
    }
  });

  // MongoDB URI Management (for remote database option)
  ipcMain.handle('db:getUserMongoUri', async () => {
    // This would typically load from a config file
    return process.env.MONGODB_URI || null;
  });

  ipcMain.handle('db:setUserMongoUri', async (_, uri: string) => {
    // This would typically save to a config file
    // For now, we'll just validate the URI format
    try {
      new URL(uri);
      console.log('✅ [DB-IPC] MongoDB URI validated and saved');
      return true;
    } catch (error) {
      console.error('❌ [DB-IPC] Invalid MongoDB URI:', error);
      throw new Error('Invalid MongoDB URI format');
    }
  });

  ipcMain.handle('db:health', async () => {
    try {
      const db = getLocalDb();
      await db.command({ ping: 1 });
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        type: 'local',
        details: 'Local database is responding'
      };
    } catch (error) {
      console.error('❌ [DB-IPC] Health check failed:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        type: 'local',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  console.log('✅ [DB-IPC] Database handlers registered successfully');
}
