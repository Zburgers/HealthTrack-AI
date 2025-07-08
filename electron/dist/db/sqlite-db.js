"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSqliteDbPath = getSqliteDbPath;
exports.initializeSqliteDatabase = initializeSqliteDatabase;
exports.getSqliteDatabase = getSqliteDatabase;
exports.healthCheck = healthCheck;
exports.closeSqliteDatabase = closeSqliteDatabase;
exports.cleanupExpiredAiCache = cleanupExpiredAiCache;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const uuid_1 = require("uuid");
// Global SQLite instance
let sqliteDb = null;
// Database configuration
const DATABASE_NAME = 'healthtrack_local.sqlite';
/**
 * Get the local database storage path with process-safe resolution
 */
function getSqliteDbPath() {
    // Use process.cwd() for consistent path resolution across processes
    const dbDir = path.join(process.cwd(), 'database');
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    return path.join(dbDir, DATABASE_NAME);
}
/**
 * Initialize SQLite database
 */
async function initializeSqliteDatabase() {
    try {
        if (sqliteDb) {
            console.log('📦 SQLite database already connected');
            return getSqliteDbPath();
        }
        console.log('🚀 [SQLITE_DB] Initializing SQLite database...');
        const dbPath = getSqliteDbPath();
        console.log(`📂 [SQLITE_DB] Database path resolved to: ${dbPath}`);
        // Create SQLite database connection
        sqliteDb = new better_sqlite3_1.default(dbPath, {
            verbose: (message) => console.log(`[SQLITE_QUERY] ${message}`)
        });
        console.log('✅ [SQLITE_DB] Connection established.');
        // Configure SQLite for optimal performance
        console.log('⚙️ [SQLITE_DB] Configuring performance settings...');
        sqliteDb.pragma('journal_mode = WAL');
        sqliteDb.pragma('foreign_keys = ON');
        sqliteDb.pragma('synchronous = NORMAL');
        sqliteDb.pragma('cache_size = 1000');
        sqliteDb.pragma('temp_store = MEMORY');
        console.log('👍 [SQLITE_DB] Performance settings applied.');
        console.log('✅ [SQLITE_DB] SQLite database connected and configured.');
        // Initialize schema and data
        await initializeSchema();
        await initializeIndexes();
        await insertInitializationMetadata();
        return dbPath;
    }
    catch (error) {
        console.error('❌ Failed to initialize SQLite database:', error);
        throw new Error(`SQLite database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Get the SQLite database instance with auto-initialization
 */
function getSqliteDatabase() {
    if (!sqliteDb) {
        console.log('🔄 [SQLITE_DB] Auto-initializing SQLite database...');
        // Detect if we're in Electron environment
        const isElectronEnv = process.env.IS_ELECTRON === 'true' ||
            process.env.ELECTRON_ENV === 'true' ||
            typeof process !== 'undefined' && process.versions?.electron;
        console.log(`🔍 [SQLITE_DB] Environment detection - Electron: ${isElectronEnv}`);
        // Synchronous initialization for immediate use
        try {
            const dbPath = getSqliteDbPath();
            console.log(`📂 [SQLITE_DB] Auto-init database path: ${dbPath}`);
            // Create SQLite database connection with reduced verbosity for Next.js
            sqliteDb = new better_sqlite3_1.default(dbPath, {
                verbose: isElectronEnv ? (message) => console.log(`[SQLITE_QUERY] ${message}`) : undefined
            });
            console.log('✅ [SQLITE_DB] Auto-init connection established.');
            // Configure SQLite for optimal performance
            sqliteDb.pragma('journal_mode = WAL');
            sqliteDb.pragma('foreign_keys = ON');
            sqliteDb.pragma('synchronous = NORMAL');
            sqliteDb.pragma('cache_size = 1000');
            sqliteDb.pragma('temp_store = MEMORY');
            // Initialize schema and data synchronously
            initializeSchemaSync();
            initializeIndexesSync();
            insertInitializationMetadataSync();
            console.log('✅ [SQLITE_DB] Auto-initialization completed.');
        }
        catch (error) {
            console.error('❌ Failed to auto-initialize SQLite database:', error);
            throw new Error(`SQLite database auto-initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    return sqliteDb;
}
/**
 * Initialize database schema (synchronous version)
 */
function initializeSchemaSync() {
    if (!sqliteDb)
        return;
    console.log('📋 Creating database schema...');
    // Create all tables (patients, ai_cache, notes, local_embeddings, db_metadata)
    const schemaSQL = `
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      sex TEXT CHECK(sex IN ('Male', 'Female', 'Other')) DEFAULT 'Other',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      vitals JSON,
      symptoms JSON,
      previous_conditions JSON,
      allergies JSON,
      current_medications JSON,
      icd_tag_summary JSON,
      icd_tags JSON,
      risk_predictions JSON,
      soap_note JSON,
      matched_cases JSON,
      medical_history_analysis JSON,
      observations TEXT,
      primary_complaint TEXT,
      risk_score REAL DEFAULT 0.0,
      ai_metadata JSON,
      status TEXT CHECK(status IN ('draft', 'analyzing', 'complete', 'exported', 'analysis_failed')) DEFAULT 'draft',
      owner_uid TEXT NOT NULL,
      ai_soap_notes TEXT,
      ai_analysis_timestamp DATETIME,
      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_at DATETIME,
      deleted_by TEXT,
      deletion_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS ai_cache (
      id TEXT PRIMARY KEY,
      cache_key TEXT UNIQUE NOT NULL,
      workflow TEXT NOT NULL,
      input JSON NOT NULL,
      output JSON NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      note_text TEXT NOT NULL,
      generated_by_ai BOOLEAN DEFAULT FALSE,
      last_edited DATETIME DEFAULT CURRENT_TIMESTAMP,
      finalized BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS local_embeddings (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      embedding JSON NOT NULL,
      meta JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS db_metadata (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      version TEXT,
      initialized_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      collections JSON,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
    sqliteDb.exec(schemaSQL);
    console.log('✅ Database schema created');
}
/**
 * Initialize database schema (async version)
 */
async function initializeSchema() {
    initializeSchemaSync();
}
/**
 * Create performance indexes (synchronous version)
 */
function initializeIndexesSync() {
    if (!sqliteDb)
        return;
    console.log('📊 Creating database indexes...');
    const indexSQL = `
    -- Patients table indexes
    CREATE INDEX IF NOT EXISTS idx_patients_owner_uid ON patients(owner_uid);
    CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
    CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
    CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(is_deleted, last_updated);
    CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);

    -- AI Cache indexes
    CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache(expires_at);
    CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(cache_key);

    -- Notes indexes
    CREATE INDEX IF NOT EXISTS idx_notes_patient_id ON notes(patient_id);
    CREATE INDEX IF NOT EXISTS idx_notes_last_edited ON notes(last_edited);

    -- Embeddings indexes
    CREATE INDEX IF NOT EXISTS idx_embeddings_patient_id ON local_embeddings(patient_id);
    CREATE INDEX IF NOT EXISTS idx_embeddings_created_at ON local_embeddings(created_at);
  `;
    sqliteDb.exec(indexSQL);
    console.log('✅ Database indexes created');
}
/**
 * Create performance indexes (async version)
 */
async function initializeIndexes() {
    initializeIndexesSync();
}
/**
 * Insert initialization metadata (synchronous version)
 */
function insertInitializationMetadataSync() {
    if (!sqliteDb)
        return;
    try {
        // Check if the db_metadata table is empty
        const existingMetadata = sqliteDb.prepare(`
      SELECT COUNT(*) as count FROM db_metadata WHERE key = 'main'
    `).get();
        // Only insert if the table is empty (first-time initialization)
        if (existingMetadata.count === 0) {
            const stmt = sqliteDb.prepare(`
        INSERT INTO db_metadata (id, key, version, collections, last_updated)
        VALUES (?, ?, ?, ?, ?)
      `);
            const metadataId = (0, uuid_1.v4)();
            const collections = ['patients', 'notes', 'ai_cache', 'local_embeddings', 'db_metadata'];
            stmt.run(metadataId, 'main', '1.0.0', JSON.stringify(collections), new Date().toISOString());
            console.log(`✅ Database metadata initialized with ID: ${metadataId}`);
            console.log(`📋 Collections: ${collections.join(', ')}`);
        }
        else {
            console.log('📋 Database metadata already exists, skipping initialization');
        }
    }
    catch (error) {
        console.error('❌ Failed to insert metadata:', error);
        throw error;
    }
}
/**
 * Insert initialization metadata (async version)
 */
async function insertInitializationMetadata() {
    insertInitializationMetadataSync();
}
/**
 * Health check for SQLite database
 */
function healthCheck() {
    try {
        if (!sqliteDb)
            return false;
        // Simple query to test database responsiveness
        const result = sqliteDb.prepare('SELECT 1 as test').get();
        return result?.test === 1;
    }
    catch (error) {
        console.error('❌ SQLite health check failed:', error);
        return false;
    }
}
/**
 * Close SQLite database connection
 */
function closeSqliteDatabase() {
    if (sqliteDb) {
        sqliteDb.close();
        sqliteDb = null;
        console.log('✅ SQLite database closed');
    }
}
/**
 * Clean up expired AI cache entries
 * This function is called by the scheduled job in the main Electron process
 */
async function cleanupExpiredAiCache() {
    try {
        if (!sqliteDb) {
            console.warn('[SQLITE_DB] Database not initialized for cache cleanup');
            return 0;
        }
        const now = new Date().toISOString();
        const query = `DELETE FROM ai_cache WHERE expires_at < ?`;
        const result = sqliteDb.prepare(query).run(now);
        const deletedCount = result.changes;
        if (deletedCount > 0) {
            console.log(`[SQLITE_DB] Cleaned up ${deletedCount} expired cache entries`);
        }
        return deletedCount;
    }
    catch (error) {
        console.error('[SQLITE_DB] Error cleaning up expired cache:', error);
        return 0;
    }
}
//# sourceMappingURL=sqlite-db.js.map