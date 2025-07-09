import {
  ipcMain,
  app,
  shell,
  dialog,
  IpcMainInvokeEvent,
  OpenDialogReturnValue,
  SaveDialogReturnValue,
} from 'electron';
import { setupMongoDBIpcHandlers, closeMongoDBConnection } from './mongodb-handlers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Setup IPC handlers for secure communication between main and renderer processes
 */
export function setupIpcHandlers(): void {
  console.log('🔌 Setting up IPC handlers...');
  // Database operations (MongoDB-based)
  setupMongoDBIpcHandlers();
  // App information handlers
  setupAppHandlers();
  // System operation handlers
  setupSystemHandlers();
  console.log('✅ IPC handlers setup complete');
}

/**
 * App information handlers
 */
function setupAppHandlers(): void {
  // App version
  ipcMain.handle('app:getVersion', async (): Promise<string> => {
    return app.getVersion();
  });

  // Platform info
  ipcMain.handle('app:getPlatform', async (): Promise<string> => {
    return process.platform;
  });

  // Online status
  ipcMain.handle('app:isOnline', async (): Promise<boolean> => {
    // Simple network check - in a real app you might want to ping a server
    return true;
  });

  // Data path
  ipcMain.handle('app:getDataPath', async (): Promise<string> => {
    return app.getPath('userData');
  });

  console.log('✅ App handlers setup complete');
}

/**
 * System operation handlers
 */
function setupSystemHandlers(): void {
  // Open external URL
  ipcMain.handle('system:openExternal', async (event: IpcMainInvokeEvent, url: string): Promise<void> => {
    await shell.openExternal(url);
  });

  // Show item in folder
  ipcMain.handle('system:showItemInFolder', async (event: IpcMainInvokeEvent, fullPath: string): Promise<void> => {
    shell.showItemInFolder(fullPath);
  });

  console.log('✅ System handlers setup complete');
}

/**
 * Cleanup function to close all database connections
 */
export async function cleanup(): Promise<void> {
  console.log('🧹 Cleaning up IPC handlers...');
  try {
    await closeMongoDBConnection();
    console.log('✅ IPC cleanup complete');
  } catch (error) {
    console.error('❌ IPC cleanup failed:', error);
  }
}
