/**
 * Server-side IPC Client for Electron Main Process Database Access
 *
 * This module provides a way for Next.js API routes running in Electron
 * to communicate with the main process SQLite database via IPC.
 *
 * Important: Only works when running in Electron main process context.
 */

import type { ipcMain as ElectronIpcMain } from 'electron';

export interface IPCDatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  insertedId?: string;
  modifiedCount?: number;
  deletedCount?: number;
}

/**
 * ServerIPCClient: invokes Electron IPC handlers from server-side code
 */
class ServerIPCClient {
  private readonly ipcMain: typeof ElectronIpcMain | null;

  constructor() {
    // Only require electron at runtime if in Electron main
    if (process.env.ELECTRON_ENV === 'true' && process.versions?.electron) {
      // dynamically load runtime module
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.ipcMain = require('electron').ipcMain;
    } else {
      this.ipcMain = null;
    }
  }

  /**
   * Execute an IPC handler directly
   */
  private async executeHandler(channel: string, ...args: any[]): Promise<any> {
    if (!this.ipcMain) {
      throw new Error(
        'ServerIPCClient can only be used inside Electron main process'
      );
    }

    // grab the events map
    const events = (this.ipcMain as any)._events;
    const handler = events?.[channel];
    if (!handler) {
      throw new Error(`No IPC handler found for channel: ${channel}`);
    }

    const mockEvent = { sender: { id: 'server-api' } };
    // call directly
    return handler(mockEvent, ...args);
  }

  async findOne(collection: string, query: any): Promise<any> {
    console.log(`[SERVER_IPC] findOne on ${collection}:`, query);
    return this.executeHandler('db-findOne', collection, query);
  }

  async find(
    collection: string,
    query: any = {},
    options: any = {}
  ): Promise<any[]> {
    console.log(`[SERVER_IPC] find on ${collection}:`, query, options);
    return this.executeHandler('db-find', collection, query, options);
  }

  async insertOne(
    collection: string,
    document: any
  ): Promise<IPCDatabaseResult> {
    console.log(
      `[SERVER_IPC] insertOne on ${collection}:`,
      { ...document, _preview: 'truncated' }
    );
    return this.executeHandler('db-insertOne', collection, document);
  }

  async updateOne(
    collection: string,
    filter: any,
    update: any
  ): Promise<IPCDatabaseResult> {
    console.log(`[SERVER_IPC] updateOne on ${collection}:`, filter, update);
    return this.executeHandler('db-updateOne', collection, filter, update);
  }

  async deleteOne(
    collection: string,
    filter: any
  ): Promise<IPCDatabaseResult> {
    console.log(`[SERVER_IPC] deleteOne on ${collection}:`, filter);
    return this.executeHandler('db-deleteOne', collection, filter);
  }

  async countDocuments(
    collection: string,
    filter: any = {}
  ): Promise<number> {
    console.log(`[SERVER_IPC] countDocuments on ${collection}:`, filter);
    return this.executeHandler('db-countDocuments', collection, filter);
  }

  async getPatients(): Promise<any[]> {
    console.log('[SERVER_IPC] getPatients');
    return this.executeHandler('db-getPatients');
  }

  async getPatient(id: string): Promise<any> {
    console.log('[SERVER_IPC] getPatient:', id);
    return this.executeHandler('db-getPatient', id);
  }

  async createPatient(
    patient: any
  ): Promise<IPCDatabaseResult> {
    console.log(
      '[SERVER_IPC] createPatient:',
      { ...patient, _preview: 'truncated' }
    );
    return this.executeHandler('db-createPatient', patient);
  }

  async updatePatient(
    id: string,
    updates: any
  ): Promise<IPCDatabaseResult> {
    console.log('[SERVER_IPC] updatePatient:', id, updates);
    return this.executeHandler('db-updatePatient', id, updates);
  }

  async deletePatient(
    id: string
  ): Promise<IPCDatabaseResult> {
    console.log('[SERVER_IPC] deletePatient:', id);
    return this.executeHandler('db-deletePatient', id);
  }
}

export const serverIPCClient = new ServerIPCClient();
export default serverIPCClient;
