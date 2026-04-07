import { Document } from 'mongodb';

/**
 * Check if Electron IPC is available.
 * Always returns false in a web-only architecture.
 */
export function isElectronIPCAvailable(): boolean {
  return false;
}
