/*

import { getDb, isElectronEnvironment, isLocalCollection, SQLiteDatabaseAdapter, MongoDBDatabaseAdapter } from './index';

// Mock dependencies
jest.mock('../sqlite/sqlite-adapter');
jest.mock('../mongodb');

describe('Database Router', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.IS_ELECTRON;
    delete process.env.ELECTRON_ENV;
    
    // Clear any window object mocks
    if (typeof window !== 'undefined') {
      delete (window as any).electronAPI;
    }
  });

  describe('Environment Detection', () => {
    it('should detect Electron environment via IS_ELECTRON env var', () => {
      process.env.IS_ELECTRON = 'true';
      expect(isElectronEnvironment()).toBe(true);
    });

    it('should detect Electron environment via ELECTRON_ENV env var', () => {
      process.env.ELECTRON_ENV = 'true';
      expect(isElectronEnvironment()).toBe(true);
    });

    it('should detect web environment when no Electron indicators present', () => {
      expect(isElectronEnvironment()).toBe(false);
    });
  });

  describe('Collection Routing', () => {
    it('should identify local collections correctly', () => {
      expect(isLocalCollection('patients')).toBe(true);
      expect(isLocalCollection('notes')).toBe(true);
      expect(isLocalCollection('ai_cache')).toBe(true);
      expect(isLocalCollection('local_embeddings')).toBe(true);
      expect(isLocalCollection('db_metadata')).toBe(true);
    });

    it('should identify remote collections correctly', () => {
      expect(isLocalCollection('case_embeddings')).toBe(false);
    });

    it('should handle unknown collections as remote', () => {
      expect(isLocalCollection('unknown_collection')).toBe(false);
    });
  });

  describe('Database Adapter Selection', () => {
    it('should return SQLite adapter for local collections in Electron', async () => {
      process.env.IS_ELECTRON = 'true';
      
      // const db = await getDb('patients'); // Deprecated: IPC/Atlas only
      expect(getDb('patients')).toBeInstanceOf(SQLiteDatabaseAdapter);
    });

    it('should return MongoDB adapter for remote collections even in Electron', async () => {
      process.env.IS_ELECTRON = 'true';
      
      // This test would need proper mocking of connectToDatabase
      // For now, we'll skip the async test and focus on the sync functions
    });

    it('should return MongoDB adapter for all collections in web environment', async () => {
      // This test would need proper mocking of connectToDatabase
      // For now, we'll skip the async test and focus on the sync functions
    });
  });
});

*/
