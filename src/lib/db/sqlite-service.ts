/**
 * Unified SQLite Database Service
 * 
 * This service provides a single point of access to the SQLite database
 * and handles initialization across both Electron main process and Next.js server process.
 */
// import { initializeSqliteDatabase, getSqliteDatabase } from '../../../electron/db/sqlite-db';
// SQLite is deprecated and replaced by MongoDB Atlas. This file is now a stub.
export const initializeSqliteDatabase = async () => {
  console.warn('SQLite database is deprecated. Using MongoDB Atlas instead.');
  return true;
};

export const getSqliteDatabase = () => {
  throw new Error('SQLite database is deprecated. Use MongoDB Atlas instead.');
};

class SQLiteService {
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Ensure the SQLite database is initialized
   * This is thread-safe and can be called multiple times
   */
  async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('[SQLITE_SERVICE] Ensuring SQLite database is initialized...');
      
      // Check if we're in Electron environment
      const isElectronEnv = 
        process.env.IS_ELECTRON === 'true' ||
        process.env.ELECTRON_ENV === 'true' ||
        typeof process !== 'undefined' && process.versions?.electron;

      console.log(`[SQLITE_SERVICE] Environment: ${isElectronEnv ? 'Electron' : 'Next.js Server'}`);

      // Try to get existing database first
      try {
        const db = getSqliteDatabase();
        if (db) {
          console.log('[SQLITE_SERVICE] Database already available');
          this.initialized = true;
          return;
        }
      } catch (error) {
        // Database not initialized yet, continue with initialization
        console.log('[SQLITE_SERVICE] Database not yet initialized, proceeding...');
      }

      // Initialize the database
      await initializeSqliteDatabase();
      this.initialized = true;
      console.log('[SQLITE_SERVICE] Database initialization completed');
    } catch (error) {
      console.error('[SQLITE_SERVICE] Failed to initialize database:', error);
      this.initializationPromise = null; // Reset so it can be retried
      throw error;
    }
  }

  /**
   * Get the SQLite database instance, ensuring it's initialized
   */
  async getDatabase() {
    await this.ensureInitialized();
    return getSqliteDatabase();
  }

  /**
   * Reset the service state (primarily for testing)
   */
  reset() {
    this.initialized = false;
    this.initializationPromise = null;
  }
}

// Export singleton instance
export const sqliteService = new SQLiteService();

/**
 * Helper function to get initialized database
 */
export async function getInitializedSQLiteDatabase() {
  return sqliteService.getDatabase();
}
