/**
 * Electron Main Process - Shared Constants
 * 
 * This file contains constants shared within the Electron main process,
 * duplicating values from the web-facing config to avoid pathing issues
 * with TypeScript's rootDir constraint.
 */

export const DATABASE_NAMES = {
  LOCAL: 'healthtrack_local',
  REMOTE: 'healthtrack_remote',
};

export const MONGODB_CONFIG = {
  LOCAL_PORT: 27017,
  LOCAL_OPTIONS: {},
};
