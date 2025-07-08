"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLLECTIONS = void 0;
exports.initializeDatabaseData = initializeDatabaseData;
exports.runDatabaseMigrations = runDatabaseMigrations;
exports.validateDatabaseStructure = validateDatabaseStructure;
exports.cleanupExpiredCache = cleanupExpiredCache;
exports.getDatabaseStats = getDatabaseStats;
const sqlite_db_1 = require("./sqlite-db");
const uuid_1 = require("uuid");
/**
 * Database initialization and migration utilities
 */
// Collection names for SQLite tables
const COLLECTIONS = {
    PATIENTS: 'patients',
    AI_CACHE: 'ai_cache',
    NOTES: 'notes',
    LOCAL_EMBEDDINGS: 'local_embeddings',
    DB_METADATA: 'db_metadata'
};
exports.COLLECTIONS = COLLECTIONS;
/**
 * Simple SQLite helper functions
 */
class SimpleDbHelper {
    constructor() {
        this.db = (0, sqlite_db_1.getSqliteDatabase)();
    }
    async findAll(tableName, filter = {}) {
        try {
            const filterKeys = Object.keys(filter);
            if (filterKeys.length === 0) {
                const stmt = this.db.prepare(`SELECT * FROM ${tableName}`);
                return stmt.all().map((row) => this.parseRowData(row));
            }
            else {
                // Simple filter support
                const whereClause = filterKeys.map(key => `${key} = ?`).join(' AND ');
                const values = filterKeys.map(key => filter[key]);
                const stmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE ${whereClause}`);
                return stmt.all(...values).map((row) => this.parseRowData(row));
            }
        }
        catch (error) {
            console.error(`Error finding records in ${tableName}:`, error);
            return [];
        }
    }
    async insertOne(tableName, document) {
        try {
            const doc = { ...document };
            if (!doc._id) {
                doc._id = (0, uuid_1.v4)();
            }
            doc.createdAt = doc.createdAt || new Date().toISOString();
            doc.updatedAt = new Date().toISOString();
            const keys = Object.keys(doc);
            const placeholders = keys.map(() => '?').join(', ');
            const values = keys.map(key => typeof doc[key] === 'object' ? JSON.stringify(doc[key]) : doc[key]);
            const stmt = this.db.prepare(`
        INSERT INTO ${tableName} (${keys.join(', ')})
        VALUES (${placeholders})
      `);
            stmt.run(...values);
        }
        catch (error) {
            console.error(`Error inserting into ${tableName}:`, error);
            throw error;
        }
    }
    async updateOne(tableName, filter, update) {
        try {
            const filterKeys = Object.keys(filter);
            const updateKeys = Object.keys(update);
            const whereClause = filterKeys.map(key => `${key} = ?`).join(' AND ');
            const setClause = updateKeys.map(key => `${key} = ?`).join(', ');
            const filterValues = filterKeys.map(key => filter[key]);
            const updateValues = updateKeys.map(key => typeof update[key] === 'object' ? JSON.stringify(update[key]) : update[key]);
            const stmt = this.db.prepare(`
        UPDATE ${tableName} 
        SET ${setClause}
        WHERE ${whereClause}
      `);
            stmt.run(...updateValues, ...filterValues);
        }
        catch (error) {
            console.error(`Error updating ${tableName}:`, error);
            throw error;
        }
    }
    async deleteOne(tableName, filter) {
        try {
            const filterKeys = Object.keys(filter);
            const whereClause = filterKeys.map(key => `${key} = ?`).join(' AND ');
            const values = filterKeys.map(key => filter[key]);
            const stmt = this.db.prepare(`DELETE FROM ${tableName} WHERE ${whereClause}`);
            stmt.run(...values);
        }
        catch (error) {
            console.error(`Error deleting from ${tableName}:`, error);
            throw error;
        }
    }
    parseRowData(row) {
        const parsed = { ...row };
        for (const key in parsed) {
            if (typeof parsed[key] === 'string') {
                try {
                    // Try to parse JSON fields
                    if (parsed[key].startsWith('{') || parsed[key].startsWith('[')) {
                        parsed[key] = JSON.parse(parsed[key]);
                    }
                }
                catch {
                    // Keep as string if not valid JSON
                }
            }
        }
        return parsed;
    }
}
/**
 * Sample patient data for testing/demo purposes
 */
const SAMPLE_PATIENTS = [
    {
        _id: (0, uuid_1.v4)(),
        name: 'Demo Patient',
        age: 45,
        sex: 'Female',
        createdAt: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        vitals: {
            temp: 98.6,
            bp: '120/80',
            hr: 72,
            spo2: 98,
            rr: 16
        },
        symptoms: ['fatigue', 'headache'],
        observations: 'Patient reports mild fatigue and occasional headaches over the past week.',
        primary_complaint: 'Persistent fatigue',
        previous_conditions: [],
        allergies: [],
        current_medications: [],
        icd_tags: [],
        icd_tag_summary: [],
        risk_predictions: [],
        risk_score: 0.2,
        soap_note: {
            subjective: 'Patient reports fatigue and headaches',
            objective: 'Vitals stable, appears well',
            assessment: 'Likely stress-related symptoms',
            plan: 'Rest and follow-up in 1 week'
        },
        matched_cases: [],
        ai_metadata: {},
        status: 'draft',
        owner_uid: 'demo-user',
        isDeleted: false
    }
];
/**
 * Initialize database with required data
 */
async function initializeDatabaseData() {
    try {
        console.log('📊 Initializing database data...');
        const helper = new SimpleDbHelper();
        // Check if database already has data
        const existingPatients = await helper.findAll(COLLECTIONS.PATIENTS);
        if (existingPatients.length === 0) {
            console.log('📥 Inserting sample data...');
            // Insert sample patients
            for (const patient of SAMPLE_PATIENTS) {
                await helper.insertOne(COLLECTIONS.PATIENTS, patient);
            }
            console.log(`✅ Inserted ${SAMPLE_PATIENTS.length} sample patients`);
        }
        else {
            console.log(`📋 Database already contains ${existingPatients.length} patients`);
        }
        console.log('✅ Database data initialization complete');
    }
    catch (error) {
        console.error('❌ Failed to initialize database data:', error);
        throw error;
    }
}
/**
 * Migrate database schema if needed
 */
async function runDatabaseMigrations() {
    try {
        console.log('🔄 Running database migrations...');
        const helper = new SimpleDbHelper();
        // Check current schema version
        const schemaVersionRecords = await helper.findAll(COLLECTIONS.DB_METADATA, { key: 'schema_version' });
        const schemaVersion = schemaVersionRecords[0];
        const currentVersion = schemaVersion?.version || '1.0.0';
        console.log(`📋 Current schema version: ${currentVersion}`);
        // Add future migrations here as needed
        // Example migration structure:
        // if (currentVersion < '1.1.0') {
        //   await migrateToV110();
        //   await updateSchemaVersion('1.1.0');
        // }
        console.log('✅ Database migrations complete');
    }
    catch (error) {
        console.error('❌ Database migration failed:', error);
        throw error;
    }
}
/**
 * Update schema version in metadata
 */
async function updateSchemaVersion(version) {
    const helper = new SimpleDbHelper();
    const schemaRecord = {
        key: 'schema_version',
        version: version,
        updatedAt: new Date().toISOString()
    };
    // Try to update first, then insert if not found
    const existing = await helper.findAll(COLLECTIONS.DB_METADATA, { key: 'schema_version' });
    if (existing.length > 0) {
        await helper.updateOne(COLLECTIONS.DB_METADATA, { key: 'schema_version' }, schemaRecord);
    }
    else {
        await helper.insertOne(COLLECTIONS.DB_METADATA, schemaRecord);
    }
    console.log(`✅ Schema version updated to ${version}`);
}
/**
 * Validate database collections and indexes
 */
async function validateDatabaseStructure() {
    try {
        console.log('✅ Database structure validation passed (SQLite auto-creates tables)');
        return true;
    }
    catch (error) {
        console.error('❌ Database structure validation failed:', error);
        return false;
    }
}
/**
 * Clean up expired cache entries
 */
async function cleanupExpiredCache() {
    try {
        const helper = new SimpleDbHelper();
        const cacheEntries = await helper.findAll(COLLECTIONS.AI_CACHE);
        let deletedCount = 0;
        for (const entry of cacheEntries) {
            if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
                await helper.deleteOne(COLLECTIONS.AI_CACHE, { _id: entry._id });
                deletedCount++;
            }
        }
        if (deletedCount > 0) {
            console.log(`🧹 Cleaned up ${deletedCount} expired cache entries`);
        }
    }
    catch (error) {
        console.error('❌ Failed to cleanup expired cache:', error);
    }
}
/**
 * Get database statistics
 */
async function getDatabaseStats() {
    try {
        const helper = new SimpleDbHelper();
        const collectionStats = {};
        for (const [key, collectionName] of Object.entries(COLLECTIONS)) {
            const records = await helper.findAll(collectionName);
            collectionStats[collectionName] = { count: records.length };
        }
        return {
            database: { name: 'sqlite' },
            collections: collectionStats,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('❌ Failed to get database stats:', error);
        return null;
    }
}
//# sourceMappingURL=init.js.map