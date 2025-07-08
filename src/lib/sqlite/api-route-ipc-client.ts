/**
 * IPC-based database client for Next.js API routes
 * 
 * This client allows Next.js API routes to communicate with the Electron main process
 * to access the SQLite database without native module conflicts.
 */

import { BrowserWindow } from 'electron';

export class APIRouteIPCClient {
  private static instance: APIRouteIPCClient | null = null;

  public static getInstance(): APIRouteIPCClient {
    if (!APIRouteIPCClient.instance) {
      APIRouteIPCClient.instance = new APIRouteIPCClient();
    }
    return APIRouteIPCClient.instance;
  }

  private getMainWindow(): BrowserWindow | null {
    const windows = BrowserWindow.getAllWindows();
    return windows.length > 0 ? windows[0] : null;
  }

  async find(collection: string, filter: any = {}, options: any = {}): Promise<any[]> {
    const mainWindow = this.getMainWindow();
    if (!mainWindow) {
      throw new Error('No Electron window available for IPC communication');
    }

    try {
      console.log(`[API_IPC_CLIENT] Sending find request for collection: ${collection}`);
      
      // Use webContents.executeJavaScript to invoke IPC from renderer context
      const result = await mainWindow.webContents.executeJavaScript(`
        window.electronAPI.database.find('${collection}', ${JSON.stringify(filter)}, ${JSON.stringify(options)})
      `);
      
      console.log(`[API_IPC_CLIENT] Received ${result?.length || 0} records from collection: ${collection}`);
      return result || [];
    } catch (error) {
      console.error(`[API_IPC_CLIENT] Error finding in collection ${collection}:`, error);
      throw error;
    }
  }

  async findOne(collection: string, filter: any = {}): Promise<any> {
    const mainWindow = this.getMainWindow();
    if (!mainWindow) {
      throw new Error('No Electron window available for IPC communication');
    }

    try {
      console.log(`[API_IPC_CLIENT] Sending findOne request for collection: ${collection}`);
      
      const result = await mainWindow.webContents.executeJavaScript(`
        window.electronAPI.database.findOne('${collection}', ${JSON.stringify(filter)})
      `);
      
      console.log(`[API_IPC_CLIENT] Received result from collection: ${collection}`);
      return result;
    } catch (error) {
      console.error(`[API_IPC_CLIENT] Error finding one in collection ${collection}:`, error);
      throw error;
    }
  }

  async insertOne(collection: string, document: any): Promise<any> {
    const mainWindow = this.getMainWindow();
    if (!mainWindow) {
      throw new Error('No Electron window available for IPC communication');
    }

    try {
      console.log(`[API_IPC_CLIENT] Sending insertOne request for collection: ${collection}`);
      
      const result = await mainWindow.webContents.executeJavaScript(`
        window.electronAPI.database.insertOne('${collection}', ${JSON.stringify(document)})
      `);
      
      console.log(`[API_IPC_CLIENT] Insert completed for collection: ${collection}`);
      return result;
    } catch (error) {
      console.error(`[API_IPC_CLIENT] Error inserting into collection ${collection}:`, error);
      throw error;
    }
  }

  async updateOne(collection: string, filter: any, update: any, options: any = {}): Promise<any> {
    const mainWindow = this.getMainWindow();
    if (!mainWindow) {
      throw new Error('No Electron window available for IPC communication');
    }

    try {
      console.log(`[API_IPC_CLIENT] Sending updateOne request for collection: ${collection}`);
      
      const result = await mainWindow.webContents.executeJavaScript(`
        window.electronAPI.database.updateOne('${collection}', ${JSON.stringify(filter)}, ${JSON.stringify(update)}, ${JSON.stringify(options)})
      `);
      
      console.log(`[API_IPC_CLIENT] Update completed for collection: ${collection}`);
      return result;
    } catch (error) {
      console.error(`[API_IPC_CLIENT] Error updating collection ${collection}:`, error);
      throw error;
    }
  }

  async deleteOne(collection: string, filter: any): Promise<any> {
    const mainWindow = this.getMainWindow();
    if (!mainWindow) {
      throw new Error('No Electron window available for IPC communication');
    }

    try {
      console.log(`[API_IPC_CLIENT] Sending deleteOne request for collection: ${collection}`);
      
      const result = await mainWindow.webContents.executeJavaScript(`
        window.electronAPI.database.deleteOne('${collection}', ${JSON.stringify(filter)})
      `);
      
      console.log(`[API_IPC_CLIENT] Delete completed for collection: ${collection}`);
      return result;
    } catch (error) {
      console.error(`[API_IPC_CLIENT] Error deleting from collection ${collection}:`, error);
      throw error;
    }
  }

  async countDocuments(collection: string, filter: any = {}): Promise<number> {
    const mainWindow = this.getMainWindow();
    if (!mainWindow) {
      throw new Error('No Electron window available for IPC communication');
    }

    try {
      console.log(`[API_IPC_CLIENT] Sending countDocuments request for collection: ${collection}`);
      
      const result = await mainWindow.webContents.executeJavaScript(`
        window.electronAPI.database.countDocuments('${collection}', ${JSON.stringify(filter)})
      `);
      
      console.log(`[API_IPC_CLIENT] Count completed for collection: ${collection}:`, result);
      return result || 0;
    } catch (error) {
      console.error(`[API_IPC_CLIENT] Error counting collection ${collection}:`, error);
      throw error;
    }
  }
}

export const apiRouteIPCClient = APIRouteIPCClient.getInstance();
