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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqliteAdapter = exports.SQLiteAdapter = void 0;
const uuid_1 = require("uuid");
// This function creates a proxy object that forwards database calls
// from the renderer or Next.js server process to the Electron main process via IPC.
const createIpcProxy = () => {
    // Dynamically get ipcRenderer to avoid breaking Next.js build
    const ipcRenderer = global.window?.ipcRenderer;
    if (!ipcRenderer) {
        console.warn('[SQLITE_ADAPTER_PROXY] IPC renderer not available. DB operations will fail. This is expected during Next.js server-side builds, but not in a running Electron app.');
        // Return a dummy proxy that will show a clear error if any of its methods are called.
        const handler = {
            get(_target, prop) {
                return () => Promise.reject(new Error(`IPC not available. Cannot call ${prop}.`));
            }
        };
        return new Proxy({}, handler);
    }
    const dbOperations = [
        'findOne', 'find', 'insertOne', 'updateOne', 'deleteOne', 'countDocuments'
    ];
    const handler = {
        get(_target, prop) {
            if (dbOperations.includes(prop)) {
                // For each DB operation, return a function that invokes the corresponding
                // IPC handler in the main process.
                return (...args) => {
                    console.log(`[IPC_PROXY] Calling ${prop} with args:`, args);
                    return ipcRenderer.invoke('db-operation', { operation: prop, args });
                };
            }
            // For any other properties, return undefined.
            return undefined;
        }
    };
    return new Proxy({}, handler);
};
class SQLiteAdapter {
    constructor() {
        this.db = null;
        this.isElectronMain = typeof process !== 'undefined' && !!process.versions?.electron && !process.type;
        console.log(`[SQLITE_ADAPTER] Initialized. Running in Electron Main: ${this.isElectronMain}`);
        if (!this.isElectronMain) {
            // If not in the main process, use the IPC proxy.
            this.db = createIpcProxy();
        }
    }
    /**
     * Lazy initialization of SQLite database, ONLY for the main process.
     */
    async getDb() {
        if (this.isElectronMain && !this.db) {
            try {
                // Dynamically import to avoid loading native module in other processes
                const { getInitializedSQLiteDatabase } = await Promise.resolve().then(() => __importStar(require('../db/sqlite-service')));
                this.db = await getInitializedSQLiteDatabase();
                console.log('[SQLITE_ADAPTER] Direct database connection established in main process');
            }
            catch (error) {
                console.error('[SQLITE_ADAPTER] Failed to get direct SQLite database connection:', error);
                throw error;
            }
        }
        return this.db;
    }
    /**
     * Find one document (MongoDB findOne equivalent)
     */
    async findOne(collection, filter, options) {
        const db = await this.getDb();
        if (this.isElectronMain) {
            // Direct DB access logic remains here...
            if (!options?.includeSoftDeleted && !filter.hasOwnProperty('isDeleted')) {
                filter = { ...filter, isDeleted: { $ne: true } };
            }
            const { whereClause, params } = this.buildWhereClause(filter);
            const query = `SELECT * FROM ${collection} ${whereClause} LIMIT 1`;
            const result = db.prepare(query).get(...params);
            return this.deserializeResult(result);
        }
        else {
            return db.findOne(collection, filter, options);
        }
    }
    /**
     * Find multiple documents (MongoDB find equivalent)
     */
    async find(collection, filter = {}, options = {}) {
        const db = await this.getDb();
        if (this.isElectronMain) {
            // Direct DB access logic...
            if (!options.includeSoftDeleted && !filter.hasOwnProperty('isDeleted')) {
                filter = { ...filter, isDeleted: { $ne: true } };
            }
            const { whereClause, params } = this.buildWhereClause(filter);
            let query = `SELECT * FROM ${collection} ${whereClause}`;
            if (options.sort)
                query += ` ORDER BY ${this.buildSortClause(options.sort)}`;
            if (options.limit)
                query += ` LIMIT ${options.limit}`;
            const results = db.prepare(query).all(...params);
            return results.map((r) => this.deserializeResult(r));
        }
        else {
            return db.find(collection, filter, options);
        }
    }
    /**
     * Insert one document (MongoDB insertOne equivalent)
     */
    async insertOne(collection, document) {
        const db = await this.getDb();
        if (this.isElectronMain) {
            // Direct DB access logic...
            const id = document.id || document._id || (0, uuid_1.v4)();
            const now = new Date().toISOString();
            const docWithTimestamps = { ...document, createdAt: document.createdAt || now, last_updated: document.last_updated || now };
            const serializedDoc = this.serializeDocument(docWithTimestamps, id);
            const columns = Object.keys(serializedDoc);
            const placeholders = columns.map(() => '?').join(', ');
            const query = `INSERT INTO ${collection} (${columns.join(', ')}) VALUES (${placeholders})`;
            db.prepare(query).run(...Object.values(serializedDoc));
            return { insertedId: id, acknowledged: true };
        }
        else {
            return db.insertOne(collection, document);
        }
    }
    /**
     * Update one document (MongoDB updateOne equivalent)
     */
    async updateOne(collection, filter, update, options) {
        const db = await this.getDb();
        if (this.isElectronMain) {
            // Direct DB access logic...
            const { whereClause, params } = this.buildWhereClause(filter);
            const { setClause, updateParams } = this.buildUpdateClause(update);
            const query = `UPDATE ${collection} SET ${setClause} ${whereClause}`;
            const result = db.prepare(query).run(...updateParams, ...params);
            return { matchedCount: result.changes > 0 ? 1 : 0, modifiedCount: result.changes, acknowledged: true };
        }
        else {
            return db.updateOne(collection, filter, update, options);
        }
    }
    /**
     * Delete one document (soft or hard)
     */
    async deleteOne(collection, filter, options = {}) {
        const db = await this.getDb();
        if (this.isElectronMain) {
            // Direct DB access logic...
            const { whereClause, params } = this.buildWhereClause(filter);
            let query, runParams;
            if (options.hardDelete) {
                query = `DELETE FROM ${collection} ${whereClause}`;
                runParams = params;
            }
            else {
                const now = new Date().toISOString();
                query = `UPDATE ${collection} SET isDeleted = ?, deletedAt = ?, last_updated = ? ${whereClause}`;
                runParams = [true, now, now, ...params];
            }
            const result = db.prepare(query).run(...runParams);
            return { deletedCount: result.changes, acknowledged: true };
        }
        else {
            return db.deleteOne(collection, filter, options);
        }
    }
    /**
     * Count documents (MongoDB countDocuments equivalent)
     */
    async countDocuments(collection, filter = {}, options = {}) {
        const db = await this.getDb();
        if (this.isElectronMain) {
            // Direct DB access logic...
            if (!options.includeSoftDeleted && !filter.hasOwnProperty('isDeleted')) {
                filter = { ...filter, isDeleted: { $ne: true } };
            }
            const { whereClause, params } = this.buildWhereClause(filter);
            const query = `SELECT COUNT(*) as count FROM ${collection} ${whereClause}`;
            const result = db.prepare(query).get(...params);
            return result.count;
        }
        else {
            return db.countDocuments(collection, filter, options);
        }
    }
    /**
     * Ensure soft delete columns exist on a table
     * Adds isDeleted, deletedAt, deletedBy, and deletionReason columns if they don't exist
     */
    async ensureSoftDeleteColumns(tableName) {
        try {
            // Check if isDeleted column exists
            const db = await this.getDb();
            const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
            const hasIsDeleted = columns.some(col => col.name === 'isDeleted');
            if (!hasIsDeleted) {
                console.log(`[SQLITE_ADAPTER] Adding soft delete columns to table '${tableName}'`);
                // Add soft delete columns
                db.exec(`
          ALTER TABLE ${tableName} ADD COLUMN isDeleted BOOLEAN DEFAULT FALSE;
          ALTER TABLE ${tableName} ADD COLUMN deletedAt TEXT;
          ALTER TABLE ${tableName} ADD COLUMN deletedBy TEXT;
          ALTER TABLE ${tableName} ADD COLUMN deletionReason TEXT;
        `);
                // Create index for efficient soft delete filtering
                db.exec(`
          CREATE INDEX IF NOT EXISTS idx_${tableName}_isDeleted ON ${tableName}(isDeleted);
          CREATE INDEX IF NOT EXISTS idx_${tableName}_soft_delete_compound ON ${tableName}(isDeleted, last_updated);
        `);
                console.log(`[SQLITE_ADAPTER] Soft delete columns and indexes added to '${tableName}'`);
            }
        }
        catch (error) {
            console.error(`[SQLITE_ADAPTER] Error ensuring soft delete columns for '${tableName}':`, error);
        }
    }
    /**
     * Clean up expired cache entries from ai_cache table
     * Deletes entries where expiresAt is in the past
     */
    async cleanupExpiredCache() {
        try {
            const now = new Date().toISOString();
            const query = `DELETE FROM ai_cache WHERE expiresAt < ?`;
            const db = await this.getDb();
            const result = db.prepare(query).run(now);
            const deletedCount = result.changes;
            if (deletedCount > 0) {
                console.log(`[SQLITE_ADAPTER] Cleaned up ${deletedCount} expired cache entries`);
            }
            return deletedCount;
        }
        catch (error) {
            console.error('[SQLITE_ADAPTER] Error cleaning up expired cache:', error);
            return 0;
        }
    }
    /**
     * Build WHERE clause from MongoDB-style filter
     */
    buildWhereClause(filter) {
        if (!filter || Object.keys(filter).length === 0) {
            return { whereClause: '', params: [] };
        }
        const conditions = [];
        const params = [];
        for (const [key, value] of Object.entries(filter)) {
            if (key === 'id' || key === '_id') {
                conditions.push('id = ?');
                params.push(value);
            }
            else if (key.includes('.')) {
                // Handle dot notation for JSON queries (e.g., 'vitals.hr')
                const [jsonField, ...jsonPath] = key.split('.');
                const jsonPathStr = '$.' + jsonPath.join('.');
                if (typeof value === 'object' && value !== null) {
                    // Handle operators with JSON queries
                    for (const [operator, operandValue] of Object.entries(value)) {
                        switch (operator) {
                            case '$ne':
                                conditions.push(`json_extract(${jsonField}, ?) != ?`);
                                params.push(jsonPathStr, operandValue);
                                break;
                            case '$in':
                                // For $in with JSON, we need to check each value
                                const jsonInConditions = operandValue.map(() => `json_extract(${jsonField}, ?) = ?`);
                                conditions.push(`(${jsonInConditions.join(' OR ')})`);
                                operandValue.forEach(val => {
                                    params.push(jsonPathStr, val);
                                });
                                break;
                            case '$gt':
                                conditions.push(`CAST(json_extract(${jsonField}, ?) AS NUMERIC) > ?`);
                                params.push(jsonPathStr, operandValue);
                                break;
                            case '$gte':
                                conditions.push(`CAST(json_extract(${jsonField}, ?) AS NUMERIC) >= ?`);
                                params.push(jsonPathStr, operandValue);
                                break;
                            case '$lt':
                                conditions.push(`CAST(json_extract(${jsonField}, ?) AS NUMERIC) < ?`);
                                params.push(jsonPathStr, operandValue);
                                break;
                            case '$lte':
                                conditions.push(`CAST(json_extract(${jsonField}, ?) AS NUMERIC) <= ?`);
                                params.push(jsonPathStr, operandValue);
                                break;
                            default:
                                conditions.push(`json_extract(${jsonField}, ?) = ?`);
                                params.push(jsonPathStr, operandValue);
                                break;
                        }
                    }
                }
                else {
                    // Simple JSON field equality
                    conditions.push(`json_extract(${jsonField}, ?) = ?`);
                    params.push(jsonPathStr, value);
                }
            }
            else if (typeof value === 'object' && value !== null) {
                // Handle MongoDB operators like { $ne: null } or { $gte: 18, $lte: 65 }
                for (const [operator, operandValue] of Object.entries(value)) {
                    switch (operator) {
                        case '$ne':
                            conditions.push(`${key} != ?`);
                            params.push(operandValue);
                            break;
                        case '$in':
                            const placeholders = operandValue.map(() => '?').join(', ');
                            conditions.push(`${key} IN (${placeholders})`);
                            params.push(...operandValue);
                            break;
                        case '$nin':
                            const ninPlaceholders = operandValue.map(() => '?').join(', ');
                            conditions.push(`${key} NOT IN (${ninPlaceholders})`);
                            params.push(...operandValue);
                            break;
                        case '$gt':
                            conditions.push(`${key} > ?`);
                            params.push(operandValue);
                            break;
                        case '$gte':
                            conditions.push(`${key} >= ?`);
                            params.push(operandValue);
                            break;
                        case '$lt':
                            conditions.push(`${key} < ?`);
                            params.push(operandValue);
                            break;
                        case '$lte':
                            conditions.push(`${key} <= ?`);
                            params.push(operandValue);
                            break;
                        default:
                            // Unknown operator, treat as field equality
                            conditions.push(`${key} = ?`);
                            params.push(operandValue);
                            break;
                    }
                }
            }
            else {
                conditions.push(`${key} = ?`);
                params.push(value);
            }
        }
        return {
            whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
            params
        };
    }
    /**
     * Build UPDATE SET clause from MongoDB-style update
     */
    buildUpdateClause(update) {
        const setClauses = [];
        const params = [];
        if (update.$set) {
            for (const [key, value] of Object.entries(update.$set)) {
                if (typeof value === 'object' && value !== null) {
                    setClauses.push(`${key} = ?`);
                    params.push(JSON.stringify(value));
                }
                else {
                    setClauses.push(`${key} = ?`);
                    params.push(value);
                }
            }
        }
        // Add last_updated for all updates
        setClauses.push('last_updated = ?');
        params.push(new Date().toISOString());
        return {
            setClause: setClauses.join(', '),
            updateParams: params
        };
    }
    /**
     * Build ORDER BY clause from MongoDB-style sort
     */
    buildSortClause(sort) {
        const sortParts = [];
        for (const [key, direction] of Object.entries(sort)) {
            const dir = direction === 1 || direction === 'asc' ? 'ASC' : 'DESC';
            sortParts.push(`${key} ${dir}`);
        }
        return sortParts.join(', ');
    }
    /**
     * Serialize document for SQLite storage
     */
    serializeDocument(doc, id) {
        const serialized = { id };
        for (const [key, value] of Object.entries(doc)) {
            if (key === '_id' || key === 'id')
                continue;
            if (Array.isArray(value) || (typeof value === 'object' && value !== null && !(value instanceof Date))) {
                serialized[key] = JSON.stringify(value);
            }
            else if (value instanceof Date) {
                serialized[key] = value.toISOString();
            }
            else {
                serialized[key] = value;
            }
        }
        return serialized;
    }
    /**
     * Deserialize SQLite result to match MongoDB format
     */
    deserializeResult(result) {
        if (!result)
            return null;
        const deserialized = {};
        for (const [key, value] of Object.entries(result)) {
            if (key === 'id') {
                deserialized._id = value;
                deserialized.id = value;
                continue;
            }
            // Try to parse JSON fields
            if (typeof value === 'string') {
                try {
                    if (value.startsWith('{') || value.startsWith('[')) {
                        deserialized[key] = JSON.parse(value);
                    }
                    else if (value.includes('T') && value.includes('Z')) {
                        // Likely an ISO date string
                        deserialized[key] = new Date(value);
                    }
                    else {
                        deserialized[key] = value;
                    }
                }
                catch {
                    deserialized[key] = value;
                }
            }
            else {
                deserialized[key] = value;
            }
        }
        return deserialized;
    }
}
exports.SQLiteAdapter = SQLiteAdapter;
// Singleton instance
exports.sqliteAdapter = new SQLiteAdapter();
//# sourceMappingURL=sqlite-adapter-old.js.map