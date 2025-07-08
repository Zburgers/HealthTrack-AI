"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqliteService = void 0;
exports.getInitializedSQLiteDatabase = getInitializedSQLiteDatabase;
/**
 * Unified SQLite Database Service
 *
 * This service provides a single point of access to the SQLite database
 * and handles initialization across both Electron main process and Next.js server process.
 */
const sqlite_db_1 = require("./sqlite-db");
class SQLiteService {
    constructor() {
        this.initialized = false;
        this.initializationPromise = null;
    }
    /**
     * Ensure the SQLite database is initialized
     * This is thread-safe and can be called multiple times
     */
    async ensureInitialized() {
        if (this.initialized) {
            return;
        }
        if (this.initializationPromise) {
            return this.initializationPromise;
        }
        this.initializationPromise = this.performInitialization();
        return this.initializationPromise;
    }
    async performInitialization() {
        try {
            console.log('[SQLITE_SERVICE] Ensuring SQLite database is initialized...');
            // Check if we're in Electron environment
            const isElectronEnv = process.env.IS_ELECTRON === 'true' ||
                process.env.ELECTRON_ENV === 'true' ||
                typeof process !== 'undefined' && process.versions?.electron;
            console.log(`[SQLITE_SERVICE] Environment: ${isElectronEnv ? 'Electron' : 'Next.js Server'}`);
            // Try to get existing database first
            try {
                const db = (0, sqlite_db_1.getSqliteDatabase)();
                if (db) {
                    console.log('[SQLITE_SERVICE] Database already available');
                    this.initialized = true;
                    return;
                }
            }
            catch (error) {
                // Database not initialized yet, continue with initialization
                console.log('[SQLITE_SERVICE] Database not yet initialized, proceeding...');
            }
            // Initialize the database
            await (0, sqlite_db_1.initializeSqliteDatabase)();
            this.initialized = true;
            console.log('[SQLITE_SERVICE] Database initialization completed');
        }
        catch (error) {
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
        return (0, sqlite_db_1.getSqliteDatabase)();
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
exports.sqliteService = new SQLiteService();
/**
 * Helper function to get initialized database
 */
async function getInitializedSQLiteDatabase() {
    return exports.sqliteService.getDatabase();
}
//# sourceMappingURL=sqlite-service.js.map