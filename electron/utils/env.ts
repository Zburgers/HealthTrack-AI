/**
 * Environment utilities for Electron app
 */

/**
 * Check if running in development mode
 */
export const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

/**
 * Check if running in Electron environment
 */
export const isElectron = process.versions?.electron !== undefined;

/**
 * Get the app data directory
 */
export function getAppDataPath(): string {
  const { app } = require('electron');
  return app.getPath('userData');
}

/**
 * Get the platform
 */
export function getPlatform(): string {
  return process.platform;
}

/**
 * Check if online (for Electron main process, always assume online)
 */
export function isOnline(): boolean {
  // In Electron main process, navigator is not available
  // For now, we'll assume we're online and let network requests handle connectivity
  return true;
}
