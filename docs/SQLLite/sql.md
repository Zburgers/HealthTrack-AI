# 🗄️ MongoDB to SQLite Migration PRD - HealthTrack-AI

**Version:** 1.0  
**Date:** June 30, 2025  
**Author:** AI Assistant  
**Project:** HealthTrack-AI Local Database Migration  

---

## 📋 **EXECUTIVE SUMMARY**

This PRD outlines the complete migration from `mongodb-memory-server` to SQLite for HealthTrack-AI's local database storage. The migration aims to reduce application size, improve startup performance, and eliminate MongoDB dependencies while maintaining full feature compatibility.

### **Current State Analysis**
- **Technology**: `mongodb-memory-server v10.1.4` with embedded MongoDB 7.0.0
- **Storage Location**: `userData/database/` directory  
- **Database Size**: ~10-25MB per clinic (100-1000 patients)
- **Collections**: 5 local collections + 1 remote collection
- **Architecture**: Dual-database (local-primary + remote Atlas)

### **Migration Goals**
- ✅ **Reduce Bundle Size**: Eliminate 150-200MB MongoDB binaries
- ✅ **Improve Startup Speed**: Remove MongoDB initialization overhead
- ✅ **Maintain Feature Parity**: 100% compatibility with existing functionality
- ✅ **Preserve Data Integrity**: Zero data loss during migration
- ✅ **Keep Remote Integration**: Vector search remains on Atlas

---

## 🎯 **SCOPE & REQUIREMENTS**

### **In Scope**
1. **Local Collections Migration** (5 collections)
   - `patients` - Patient records and AI analysis
   - `ai_cache` - Cached AI results with TTL
   - `notes` - SOAP notes and documentation
   - `local_embeddings` - Vector embeddings cache
   - `db_metadata` - Database initialization data

2. **Complete Code Refactoring**
   - Database connection layer
   - IPC handlers for Electron
   - API routes and data access
   - Schema validation and migration utilities

3. **Data Migration Tools**
   - MongoDB→SQLite conversion utilities
   - Schema compatibility validation
   - Rollback mechanisms

### **Out of Scope**
- **Remote Collections**: `case_embeddings` remains on MongoDB Atlas
- **Web Application**: Continues using MongoDB Atlas directly
- **Vector Search Changes**: Atlas vector search functionality unchanged

---

## 🏗️ **DETAILED MIGRATION PLAN**

## **PHASE 1: Schema Design & Translation**

### **1.1 SQLite Schema Mapping**

#### **1.1.1 Patients Table**
```sql
CREATE TABLE patients (
    id TEXT PRIMARY KEY,                    -- String UUID instead of ObjectId
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    sex TEXT CHECK(sex IN ('Male', 'Female', 'Other')) DEFAULT 'Other',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Vitals stored as JSON
    vitals JSON,                           -- {"temp": 98.6, "bp": "120/80", "hr": 72, "spo2": 98, "rr": 16}
    
    -- Arrays stored as JSON
    symptoms JSON,                         -- ["fatigue", "headache"]
    previous_conditions JSON,              -- ["diabetes", "hypertension"]
    allergies JSON,                        -- ["penicillin", "latex"]
    current_medications JSON,              -- ["metformin", "lisinopril"]
    icd_tag_summary JSON,                  -- ["E11.9", "I10"]
    
    -- Complex nested objects as JSON
    icd_tags JSON,                         -- [{"code": "E11.9", "label": "Type 2 diabetes", "confidence": 0.9, "source_phrase": "diabetes"}]
    risk_predictions JSON,                 -- [{"condition": "CVD", "confidence": 0.7, "explanation": ["High BP", "Age factor"]}]
    soap_note JSON,                        -- {"subjective": "...", "objective": "...", "assessment": "...", "plan": "..."}
    matched_cases JSON,                    -- [{"case_id": "abc123", "similarity_score": 0.85, "diagnosis": "...", "summary": "..."}]
    medical_history_analysis JSON,         -- {"allergy_warnings": [...], "medication_interactions": [...]}
    
    -- Simple fields
    observations TEXT,
    primary_complaint TEXT,
    risk_score REAL DEFAULT 0.0,
    ai_metadata JSON,
    status TEXT CHECK(status IN ('draft', 'analyzing', 'complete', 'exported', 'analysis_failed')) DEFAULT 'draft',
    owner_uid TEXT NOT NULL,
    ai_soap_notes TEXT,
    ai_analysis_timestamp DATETIME,
    
    -- Soft delete fields
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME,
    deleted_by TEXT,
    deletion_reason TEXT
);

-- Indexes for performance
CREATE INDEX idx_patients_owner_uid ON patients(owner_uid);
CREATE INDEX idx_patients_created_at ON patients(created_at);
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_active ON patients(is_deleted, last_updated);
CREATE INDEX idx_patients_name ON patients(name);
```

#### **1.1.2 AI Cache Table**
```sql
CREATE TABLE ai_cache (
    id TEXT PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    workflow TEXT NOT NULL,
    input JSON NOT NULL,
    output JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
);

-- TTL-like cleanup via scheduled job
CREATE INDEX idx_ai_cache_expires ON ai_cache(expires_at);
CREATE INDEX idx_ai_cache_key ON ai_cache(cache_key);
```

#### **1.1.3 Notes Table**
```sql
CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    note_text TEXT NOT NULL,
    generated_by_ai BOOLEAN DEFAULT FALSE,
    last_edited DATETIME DEFAULT CURRENT_TIMESTAMP,
    finalized BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_notes_patient_id ON notes(patient_id);
CREATE INDEX idx_notes_last_edited ON notes(last_edited);
```

#### **1.1.4 Local Embeddings Table**
```sql
CREATE TABLE local_embeddings (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    embedding JSON NOT NULL,               -- Vector as JSON array: [0.123, 0.456, ...]
    meta JSON,                            -- {"age": 45, "conditions": [...], "symptoms": [...]}
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_embeddings_patient_id ON local_embeddings(patient_id);
CREATE INDEX idx_embeddings_created_at ON local_embeddings(created_at);
```

#### **1.1.5 Database Metadata Table**
```sql
CREATE TABLE db_metadata (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    version TEXT,
    initialized_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    collections JSON,                      -- ["patients", "notes", "ai_cache", ...]
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **1.2 Data Type Mapping Strategy**

| MongoDB Type | SQLite Type | Notes |
|--------------|-------------|-------|
| `ObjectId` | `TEXT` | UUID v4 strings |
| `String` | `TEXT` | Direct mapping |
| `Number` | `INTEGER/REAL` | Based on precision needs |
| `Boolean` | `BOOLEAN` | SQLite boolean support |
| `Date` | `DATETIME` | ISO 8601 format |
| `Array[]` | `JSON` | JSON column with validation |
| `Object{}` | `JSON` | Nested objects as JSON |
| `Mixed/Any` | `JSON` | Flexible schema storage |

### **1.3 JSON Validation & Constraints**

```sql
-- Example JSON validation for vitals
ALTER TABLE patients ADD CONSTRAINT valid_vitals 
CHECK (
    vitals IS NULL OR 
    (
        json_valid(vitals) AND
        json_extract(vitals, '$.temp') IS NULL OR typeof(json_extract(vitals, '$.temp')) = 'real'
    )
);

-- Status enum constraint
ALTER TABLE patients ADD CONSTRAINT valid_status
CHECK (status IN ('draft', 'analyzing', 'complete', 'exported', 'analysis_failed'));
```

---

## **PHASE 2: Database Connection Layer**

### **2.1 SQLite Database Service**

#### **2.1.1 Create `electron/db/sqlite-db.ts`**
```typescript
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { getAppDataPath } from '../utils/env';

// Global SQLite instance
let sqliteDb: Database.Database | null = null;

// Database configuration
const DATABASE_NAME = 'healthtrack_local.sqlite';

/**
 * Get the local database storage path
 */
export function getSqliteDbPath(): string {
  const dbDir = path.join(getAppDataPath(), 'database');
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  return path.join(dbDir, DATABASE_NAME);
}

/**
 * Initialize SQLite database
 */
export async function initializeSqliteDatabase(): Promise<string> {
  try {
    if (sqliteDb) {
      console.log('📦 SQLite database already connected');
      return getSqliteDbPath();
    }

    console.log('🚀 Initializing SQLite database...');
    
    const dbPath = getSqliteDbPath();
    console.log(`📂 Database path: ${dbPath}`);

    // Create SQLite database connection
    sqliteDb = new Database(dbPath, {
      verbose: console.log // Enable query logging in development
    });

    // Configure SQLite for optimal performance
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');
    sqliteDb.pragma('synchronous = NORMAL');
    sqliteDb.pragma('cache_size = 1000');
    sqliteDb.pragma('temp_store = MEMORY');

    console.log('✅ SQLite database connected');

    // Initialize schema and data
    await initializeSchema();
    await initializeIndexes();
    await insertInitializationMetadata();

    return dbPath;
  } catch (error) {
    console.error('❌ Failed to initialize SQLite database:', error);
    throw new Error(`SQLite database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the SQLite database instance
 */
export function getSqliteDatabase(): Database.Database {
  if (!sqliteDb) {
    throw new Error('SQLite database not initialized. Call initializeSqliteDatabase() first.');
  }
  return sqliteDb;
}

/**
 * Initialize database schema
 */
async function initializeSchema(): Promise<void> {
  if (!sqliteDb) return;

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
 * Create performance indexes
 */
async function initializeIndexes(): Promise<void> {
  if (!sqliteDb) return;

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
 * Insert initialization metadata
 */
async function insertInitializationMetadata(): Promise<void> {
  if (!sqliteDb) return;

  try {
    const stmt = sqliteDb.prepare(`
      INSERT OR REPLACE INTO db_metadata (id, key, version, collections, last_updated)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      'init_metadata',
      'initialization',
      '1.0.0',
      JSON.stringify(['patients', 'ai_cache', 'notes', 'local_embeddings', 'db_metadata']),
      new Date().toISOString()
    );

    console.log('✅ Database metadata initialized');
  } catch (error) {
    console.error('❌ Failed to insert metadata:', error);
  }
}

/**
 * Health check for SQLite database
 */
export function healthCheck(): boolean {
  try {
    if (!sqliteDb) return false;
    
    // Simple query to test database responsiveness
    const result = sqliteDb.prepare('SELECT 1 as test').get();
    return result?.test === 1;
  } catch (error) {
    console.error('❌ SQLite health check failed:', error);
    return false;
  }
}

/**
 * Close SQLite database connection
 */
export function closeSqliteDatabase(): void {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
    console.log('✅ SQLite database closed');
  }
}
```

#### **2.1.2 Create MongoDB-Compatible Query Interface**

Create `src/lib/sqlite/sqlite-adapter.ts`:
```typescript
import { getSqliteDatabase } from '../../../electron/db/sqlite-db';
import { v4 as uuidv4 } from 'uuid';

/**
 * SQLite adapter that provides MongoDB-like interface
 */
export class SQLiteAdapter {
  private db = getSqliteDatabase();

  /**
   * Find one document (MongoDB findOne equivalent)
   */
  async findOne(collection: string, filter: any): Promise<any> {
    const { whereClause, params } = this.buildWhereClause(filter);
    const query = `SELECT * FROM ${collection} ${whereClause} LIMIT 1`;
    
    const result = this.db.prepare(query).get(...params);
    return this.deserializeResult(result);
  }

  /**
   * Find multiple documents (MongoDB find equivalent)
   */
  async find(collection: string, filter: any = {}, options: any = {}): Promise<any[]> {
    const { whereClause, params } = this.buildWhereClause(filter);
    let query = `SELECT * FROM ${collection} ${whereClause}`;
    
    // Add sorting
    if (options.sort) {
      const sortClause = this.buildSortClause(options.sort);
      query += ` ORDER BY ${sortClause}`;
    }
    
    // Add limit
    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
    }
    
    const results = this.db.prepare(query).all(...params);
    return results.map(result => this.deserializeResult(result));
  }

  /**
   * Insert one document (MongoDB insertOne equivalent)
   */
  async insertOne(collection: string, document: any): Promise<any> {
    const id = document.id || document._id || uuidv4();
    const serializedDoc = this.serializeDocument(document, id);
    
    const columns = Object.keys(serializedDoc);
    const placeholders = columns.map(() => '?').join(', ');
    const query = `INSERT INTO ${collection} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    const result = this.db.prepare(query).run(...Object.values(serializedDoc));
    
    return {
      insertedId: id,
      acknowledged: true
    };
  }

  /**
   * Update one document (MongoDB updateOne equivalent)
   */
  async updateOne(collection: string, filter: any, update: any, options: any = {}): Promise<any> {
    const { whereClause, params } = this.buildWhereClause(filter);
    const { setClause, updateParams } = this.buildUpdateClause(update);
    
    const query = `UPDATE ${collection} SET ${setClause} ${whereClause}`;
    const allParams = [...updateParams, ...params];
    
    const result = this.db.prepare(query).run(...allParams);
    
    return {
      matchedCount: result.changes > 0 ? 1 : 0,
      modifiedCount: result.changes,
      acknowledged: true
    };
  }

  /**
   * Delete one document (MongoDB deleteOne equivalent)
   */
  async deleteOne(collection: string, filter: any): Promise<any> {
    const { whereClause, params } = this.buildWhereClause(filter);
    const query = `DELETE FROM ${collection} ${whereClause}`;
    
    const result = this.db.prepare(query).run(...params);
    
    return {
      deletedCount: result.changes,
      acknowledged: true
    };
  }

  /**
   * Count documents (MongoDB countDocuments equivalent)
   */
  async countDocuments(collection: string, filter: any = {}): Promise<number> {
    const { whereClause, params } = this.buildWhereClause(filter);
    const query = `SELECT COUNT(*) as count FROM ${collection} ${whereClause}`;
    
    const result = this.db.prepare(query).get(...params) as { count: number };
    return result.count;
  }

  /**
   * Build WHERE clause from MongoDB-style filter
   */
  private buildWhereClause(filter: any): { whereClause: string; params: any[] } {
    if (!filter || Object.keys(filter).length === 0) {
      return { whereClause: '', params: [] };
    }

    const conditions: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(filter)) {
      if (key === 'id' || key === '_id') {
        conditions.push('id = ?');
        params.push(value);
      } else if (typeof value === 'object' && value !== null) {
        // Handle MongoDB operators like { $ne: null }
        for (const [operator, operandValue] of Object.entries(value)) {
          switch (operator) {
            case '$ne':
              conditions.push(`${key} != ?`);
              params.push(operandValue);
              break;
            case '$in':
              const placeholders = (operandValue as any[]).map(() => '?').join(', ');
              conditions.push(`${key} IN (${placeholders})`);
              params.push(...(operandValue as any[]));
              break;
            case '$gt':
              conditions.push(`${key} > ?`);
              params.push(operandValue);
              break;
            case '$lt':
              conditions.push(`${key} < ?`);
              params.push(operandValue);
              break;
            // Add more operators as needed
          }
        }
      } else {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    }

    return {
      whereClause: `WHERE ${conditions.join(' AND ')}`,
      params
    };
  }

  /**
   * Build UPDATE SET clause from MongoDB-style update
   */
  private buildUpdateClause(update: any): { setClause: string; updateParams: any[] } {
    const setClauses: string[] = [];
    const params: any[] = [];

    if (update.$set) {
      for (const [key, value] of Object.entries(update.$set)) {
        if (typeof value === 'object' && value !== null) {
          setClauses.push(`${key} = ?`);
          params.push(JSON.stringify(value));
        } else {
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
  private buildSortClause(sort: any): string {
    const sortParts: string[] = [];
    
    for (const [key, direction] of Object.entries(sort)) {
      const dir = direction === 1 || direction === 'asc' ? 'ASC' : 'DESC';
      sortParts.push(`${key} ${dir}`);
    }
    
    return sortParts.join(', ');
  }

  /**
   * Serialize document for SQLite storage
   */
  private serializeDocument(doc: any, id: string): any {
    const serialized: any = { id };

    for (const [key, value] of Object.entries(doc)) {
      if (key === '_id' || key === 'id') continue;

      if (Array.isArray(value) || (typeof value === 'object' && value !== null && !(value instanceof Date))) {
        serialized[key] = JSON.stringify(value);
      } else if (value instanceof Date) {
        serialized[key] = value.toISOString();
      } else {
        serialized[key] = value;
      }
    }

    return serialized;
  }

  /**
   * Deserialize SQLite result to match MongoDB format
   */
  private deserializeResult(result: any): any {
    if (!result) return null;

    const deserialized: any = {};

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
          } else if (value.includes('T') && value.includes('Z')) {
            // Likely an ISO date string
            deserialized[key] = new Date(value);
          } else {
            deserialized[key] = value;
          }
        } catch {
          deserialized[key] = value;
        }
      } else {
        deserialized[key] = value;
      }
    }

    return deserialized;
  }
}

// Singleton instance
export const sqliteAdapter = new SQLiteAdapter();
```

---

## **PHASE 3: IPC Handler Migration**

### **3.1 Update `electron/ipc/handlers.ts`**

Replace MongoDB-specific handlers with SQLite equivalents:

```typescript
import { ipcMain } from 'electron';
import { getSqliteDatabase, getSqliteDbPath, healthCheck } from '../db/sqlite-db';
import { sqliteAdapter } from '../../src/lib/sqlite/sqlite-adapter';

/**
 * Setup SQLite-based IPC handlers
 */
function setupDatabaseHandlers(): void {
  // Database information handler
  ipcMain.handle('db:getInfo', async (): Promise<any> => {
    try {
      console.log('🔍 Getting SQLite database info...');
      
      const db = getSqliteDatabase();
      const dbPath = getSqliteDbPath();
      
      // Get table information
      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();
      
      const collectionsInfo = [];
      
      for (const table of tables) {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
        collectionsInfo.push({
          name: table.name,
          count: count.count,
          location: 'local'
        });
      }
      
      // Add remote collections (unchanged)
      collectionsInfo.push({
        name: 'case_embeddings',
        count: 0,
        location: 'remote'
      });

      // Get database size
      const fs = require('fs');
      let totalSize = '0 MB';
      try {
        const stats = fs.statSync(dbPath);
        totalSize = `${(stats.size / (1024 * 1024)).toFixed(2)} MB`;
      } catch (error) {
        console.warn('Failed to get database size:', error);
      }

      return {
        type: 'hybrid',
        localPath: dbPath,
        remoteHost: 'MongoDB Atlas',
        collections: collectionsInfo,
        totalSize,
        connectionInfo: {
          isConnected: healthCheck(),
          uri: `sqlite://${dbPath}`,
          host: 'local',
          database: 'healthtrack_local.sqlite'
        },
        lastBackup: null
      };
    } catch (error) {
      console.error('❌ Failed to get database info:', error);
      throw error;
    }
  });

  // Database operations handlers
  ipcMain.handle('db:findOne', async (event, collection: string, query: any) => {
    return sqliteAdapter.findOne(collection, query);
  });

  ipcMain.handle('db:find', async (event, collection: string, query: any, options: any) => {
    return sqliteAdapter.find(collection, query, options);
  });

  ipcMain.handle('db:insertOne', async (event, collection: string, document: any) => {
    return sqliteAdapter.insertOne(collection, document);
  });

  ipcMain.handle('db:updateOne', async (event, collection: string, filter: any, update: any) => {
    return sqliteAdapter.updateOne(collection, filter, update);
  });

  ipcMain.handle('db:deleteOne', async (event, collection: string, filter: any) => {
    return sqliteAdapter.deleteOne(collection, filter);
  });

  ipcMain.handle('db:countDocuments', async (event, collection: string, filter: any) => {
    return sqliteAdapter.countDocuments(collection, filter);
  });

  // Export handler (modified for SQLite)
  ipcMain.handle('db:exportData', async (): Promise<any> => {
    try {
      const db = getSqliteDatabase();
      const { dialog } = require('electron');
      
      const exportData = {
        metadata: {
          exportType: 'SQLite',
          dbType: 'healthtrack_local',
          appVersion: process.env.npm_package_version || 'unknown',
          exportDate: new Date().toLocaleDateString(),
        },
        tables: {}
      };

      // Get all tables
      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();

      for (const table of tables) {
        const rows = db.prepare(`SELECT * FROM ${table.name}`).all();
        exportData.tables[table.name] = rows;
      }

      // Save to file
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `healthtrack-sqlite-export-${timestamp}.json`;
      
      const outPath = dialog.showSaveDialogSync({
        title: 'Export SQLite Database',
        defaultPath: filename,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (!outPath) return null;
      
      const fs = require('fs');
      await fs.promises.writeFile(outPath, JSON.stringify(exportData, null, 2), 'utf8');
      
      return {
        success: true,
        filePath: outPath,
        tablesExported: Object.keys(exportData.tables).length,
        totalRecords: Object.values(exportData.tables).reduce((sum, records: any) => sum + records.length, 0)
      };
    } catch (error) {
      console.error('❌ Failed to export SQLite database:', error);
      throw error;
    }
  });
}
```

---

## **PHASE 4: API Routes Migration**

### **4.1 Database Connection Replacement**

Update `src/lib/mongodb/index.ts` to route to SQLite in Electron:

```typescript
import { isElectronEnvironment, getDatabaseTarget } from './config';
import { sqliteAdapter } from '../sqlite/sqlite-adapter';

/**
 * Universal database operations that work across environments
 */
export class DatabaseOperations {
  /**
   * Find one document - now supports SQLite in Electron
   */
  static async findOne(collection: string, query: any): Promise<any> {
    // In Electron, use SQLite for local collections
    if (isElectronEnvironment() && getDatabaseTarget(collection) === 'local') {
      return sqliteAdapter.findOne(collection, query);
    }
    
    // Web environment or remote collections - use existing MongoDB logic
    const col = await getCollection(collection);
    return col.findOne(query);
  }

  /**
   * Insert one document - now supports SQLite in Electron
   */
  static async insertOne(collection: string, document: any): Promise<any> {
    if (isElectronEnvironment() && getDatabaseTarget(collection) === 'local') {
      return sqliteAdapter.insertOne(collection, document);
    }
    
    const col = await getCollection(collection);
    return col.insertOne(document);
  }

  /**
   * Update one document - now supports SQLite in Electron
   */
  static async updateOne(collection: string, filter: any, update: any, options?: any): Promise<any> {
    if (isElectronEnvironment() && getDatabaseTarget(collection) === 'local') {
      return sqliteAdapter.updateOne(collection, filter, update, options);
    }
    
    const col = await getCollection(collection);
    return col.updateOne(filter, update, options);
  }

  // Add similar methods for find, deleteOne, countDocuments, etc.
}
```

### **4.2 Patient API Route Updates**

Update `src/app/api/patients/route.ts`:

```typescript
import { DatabaseOperations } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    // This will now automatically use SQLite in Electron, MongoDB in web
    const patients = await DatabaseOperations.find('patients', 
      { 
        owner_uid: user.uid,
        isDeleted: { $ne: true }  // SQLite adapter will handle this
      },
      { 
        sort: { last_updated: -1 },
        limit: 100 
      }
    );

    return NextResponse.json({
      patients: patients.map(patient => ({
        id: patient.id || patient._id,
        name: patient.name,
        age: patient.age,
        // ... rest of mapping logic unchanged
      }))
    });
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}
```

---

## **PHASE 5: Data Migration Tools**

### **5.1 MongoDB to SQLite Migration Script**

Create `scripts/migrate-mongodb-to-sqlite.ts`:

```typescript
import { MongoClient } from 'mongodb';
import { initializeSqliteDatabase, getSqliteDatabase } from '../electron/db/sqlite-db';
import { sqliteAdapter } from '../src/lib/sqlite/sqlite-adapter';
import { v4 as uuidv4 } from 'uuid';

interface MigrationStats {
  collections: Record<string, { total: number; migrated: number; errors: number }>;
  startTime: Date;
  endTime?: Date;
  totalDocuments: number;
  migratedDocuments: number;
  errors: string[];
}

/**
 * Migrate data from MongoDB to SQLite
 */
export async function migrateMongoDBToSQLite(mongoUri: string): Promise<MigrationStats> {
  const stats: MigrationStats = {
    collections: {},
    startTime: new Date(),
    totalDocuments: 0,
    migratedDocuments: 0,
    errors: []
  };

  let mongoClient: MongoClient | null = null;

  try {
    console.log('🚀 Starting MongoDB to SQLite migration...');
    
    // Connect to MongoDB
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    const mongoDb = mongoClient.db('healthtrack_local');
    
    // Initialize SQLite
    await initializeSqliteDatabase();
    
    // Get collections to migrate
    const collections = ['patients', 'ai_cache', 'notes', 'local_embeddings', 'db_metadata'];
    
    for (const collectionName of collections) {
      console.log(`📦 Migrating collection: ${collectionName}`);
      
      const collection = mongoDb.collection(collectionName);
      const documents = await collection.find({}).toArray();
      
      stats.collections[collectionName] = {
        total: documents.length,
        migrated: 0,
        errors: 0
      };
      
      stats.totalDocuments += documents.length;
      
      for (const doc of documents) {
        try {
          // Transform MongoDB document to SQLite format
          const transformedDoc = transformDocument(doc);
          
          // Insert into SQLite
          await sqliteAdapter.insertOne(collectionName, transformedDoc);
          
          stats.collections[collectionName].migrated++;
          stats.migratedDocuments++;
          
          if (stats.migratedDocuments % 100 === 0) {
            console.log(`📊 Migrated ${stats.migratedDocuments}/${stats.totalDocuments} documents`);
          }
        } catch (error) {
          console.error(`❌ Error migrating document from ${collectionName}:`, error);
          stats.collections[collectionName].errors++;
          stats.errors.push(`${collectionName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      console.log(`✅ Completed ${collectionName}: ${stats.collections[collectionName].migrated}/${stats.collections[collectionName].total} documents`);
    }
    
    stats.endTime = new Date();
    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Final stats: ${stats.migratedDocuments}/${stats.totalDocuments} documents migrated`);
    
    return stats;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    stats.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

/**
 * Transform MongoDB document to SQLite-compatible format
 */
function transformDocument(doc: any): any {
  const transformed: any = {};
  
  // Handle ObjectId to string conversion
  if (doc._id) {
    if (typeof doc._id === 'object' && doc._id.toString) {
      transformed.id = doc._id.toString();
    } else {
      transformed.id = doc._id;
    }
  } else {
    transformed.id = uuidv4();
  }
  
  // Transform all other fields
  for (const [key, value] of Object.entries(doc)) {
    if (key === '_id') continue;
    
    // Handle dates
    if (value instanceof Date) {
      transformed[key] = value.toISOString();
    }
    // Handle ObjectIds in nested fields
    else if (typeof value === 'object' && value !== null) {
      transformed[key] = transformNestedObject(value);
    }
    // Handle primitives
    else {
      transformed[key] = value;
    }
  }
  
  return transformed;
}

/**
 * Transform nested objects, handling ObjectIds
 */
function transformNestedObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => transformNestedObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && value.toString && value.constructor?.name === 'ObjectId') {
        transformed[key] = value.toString();
      } else if (value instanceof Date) {
        transformed[key] = value.toISOString();
      } else if (typeof value === 'object' && value !== null) {
        transformed[key] = transformNestedObject(value);
      } else {
        transformed[key] = value;
      }
    }
    
    return transformed;
  }
  
  return obj;
}

/**
 * Rollback migration (restore from MongoDB backup)
 */
export async function rollbackMigration(backupPath: string): Promise<void> {
  console.log('🔄 Rolling back migration...');
  
  // Implementation would restore MongoDB data and restart mongodb-memory-server
  // This is a safety mechanism in case migration fails
}

// CLI interface
if (require.main === module) {
  const mongoUri = process.argv[2] || 'mongodb://localhost:27018/healthtrack_local';
  
  migrateMongoDBToSQLite(mongoUri)
    .then(stats => {
      console.log('✅ Migration completed:', stats);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}
```

### **5.2 Migration Validation Script**

Create `scripts/validate-sqlite-migration.ts`:

```typescript
import { getSqliteDatabase } from '../electron/db/sqlite-db';
import { sqliteAdapter } from '../src/lib/sqlite/sqlite-adapter';

/**
 * Validate SQLite migration data integrity
 */
export async function validateMigration(): Promise<boolean> {
  console.log('🔍 Validating SQLite migration...');
  
  try {
    const db = getSqliteDatabase();
    
    // Test 1: Check all tables exist
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
    
    const expectedTables = ['patients', 'ai_cache', 'notes', 'local_embeddings', 'db_metadata'];
    const tableNames = tables.map(t => t.name);
    
    for (const expectedTable of expectedTables) {
      if (!tableNames.includes(expectedTable)) {
        console.error(`❌ Missing table: ${expectedTable}`);
        return false;
      }
    }
    console.log('✅ All tables exist');
    
    // Test 2: Check data integrity
    const patientCount = await sqliteAdapter.countDocuments('patients', {});
    const notesCount = await sqliteAdapter.countDocuments('notes', {});
    const cacheCount = await sqliteAdapter.countDocuments('ai_cache', {});
    
    console.log(`📊 Record counts: patients=${patientCount}, notes=${notesCount}, cache=${cacheCount}`);
    
    // Test 3: Test JSON field parsing
    if (patientCount > 0) {
      const samplePatient = await sqliteAdapter.findOne('patients', {});
      
      if (samplePatient.vitals && typeof samplePatient.vitals === 'object') {
        console.log('✅ JSON fields properly deserialized');
      } else {
        console.error('❌ JSON field deserialization failed');
        return false;
      }
    }
    
    // Test 4: Test foreign key relationships
    if (notesCount > 0) {
      const sampleNote = await sqliteAdapter.findOne('notes', {});
      const relatedPatient = await sqliteAdapter.findOne('patients', { id: sampleNote.patient_id });
      
      if (relatedPatient) {
        console.log('✅ Foreign key relationships working');
      } else {
        console.error('❌ Foreign key relationship broken');
        return false;
      }
    }
    
    console.log('🎉 Migration validation passed!');
    return true;
  } catch (error) {
    console.error('❌ Migration validation failed:', error);
    return false;
  }
}

// CLI interface
if (require.main === module) {
  validateMigration()
    .then(valid => {
      process.exit(valid ? 0 : 1);
    });
}
```

---

## **PHASE 6: Package Dependencies**

### **6.1 Add SQLite Dependencies**

Update `package.json`:

```json
{
  "dependencies": {
    "better-sqlite3": "^9.2.2",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/uuid": "^9.0.7"
  }
}
```

### **6.2 Remove MongoDB Dependencies** (Post-Migration)

After successful migration and testing:

```json
{
  "dependencies": {
    // Remove these after migration is complete and tested
    // "mongodb-memory-server": "^10.1.4",
    // "mongodb": "^6.3.0"
  }
}
```

### **6.3 Electron Builder Configuration**

Update `dist/builder-effective-config.yaml`:

```yaml
# Remove MongoDB binaries from packaging
directories:
  # Remove: node_modules/mongodb-memory-server/**/*
  
files:
  - "!node_modules/mongodb-memory-server"  # Exclude MongoDB binaries
  
# Add SQLite native module handling
extraMetadata:
  productName: "HealthTrack-AI"
  
buildDependenciesFromSource: true  # Required for better-sqlite3

# Platform-specific SQLite handling
win:
  extraFiles:
    - from: "node_modules/better-sqlite3/build/Release"
      to: "resources/sqlite3"
      
mac:
  extraFiles:
    - from: "node_modules/better-sqlite3/build/Release"
      to: "Resources/sqlite3"
      
linux:
  extraFiles:
    - from: "node_modules/better-sqlite3/build/Release"
      to: "resources/sqlite3"
```

---

## **PHASE 7: Testing & Validation**

### **7.1 Unit Tests Migration**

Update test files to work with SQLite:

```typescript
// tests/database/sqlite-adapter.test.ts
import { sqliteAdapter } from '../../src/lib/sqlite/sqlite-adapter';
import { initializeSqliteDatabase } from '../../electron/db/sqlite-db';

describe('SQLite Adapter', () => {
  beforeAll(async () => {
    await initializeSqliteDatabase();
  });

  test('should insert and find patient', async () => {
    const patient = {
      name: 'Test Patient',
      age: 30,
      sex: 'Male',
      owner_uid: 'test-user',
      vitals: { bp: '120/80', hr: 70 },
      symptoms: ['headache', 'fatigue']
    };

    const result = await sqliteAdapter.insertOne('patients', patient);
    expect(result.insertedId).toBeDefined();

    const found = await sqliteAdapter.findOne('patients', { id: result.insertedId });
    expect(found.name).toBe('Test Patient');
    expect(found.vitals.bp).toBe('120/80');
    expect(found.symptoms).toEqual(['headache', 'fatigue']);
  });

  test('should handle complex JSON fields', async () => {
    const patient = {
      name: 'Complex Patient',
      age: 45,
      sex: 'Female',
      owner_uid: 'test-user',
      icd_tags: [
        { code: 'E11.9', label: 'Type 2 diabetes', confidence: 0.9 }
      ],
      matched_cases: [
        { case_id: 'abc123', similarity_score: 0.85, diagnosis: 'Diabetes' }
      ]
    };

    const result = await sqliteAdapter.insertOne('patients', patient);
    const found = await sqliteAdapter.findOne('patients', { id: result.insertedId });

    expect(found.icd_tags[0].code).toBe('E11.9');
    expect(found.matched_cases[0].similarity_score).toBe(0.85);
  });
});
```

### **7.2 Integration Tests**

Test full application flow with SQLite:

```typescript
// tests/integration/patient-workflow.test.ts
import { app } from 'electron';
import { DatabaseOperations } from '../../src/lib/mongodb';

describe('Patient Workflow Integration', () => {
  test('should create, update, and retrieve patient', async () => {
    // Test patient creation via API
    const newPatient = {
      name: 'Integration Test Patient',
      age: 35,
      sex: 'Male',
      owner_uid: 'test-user',
      symptoms: ['cough', 'fever']
    };

    const created = await DatabaseOperations.insertOne('patients', newPatient);
    expect(created.insertedId).toBeDefined();

    // Test patient update with AI analysis
    const aiAnalysis = {
      soap_note: {
        subjective: 'Patient reports cough and fever',
        objective: 'Vitals stable',
        assessment: 'Possible viral infection',
        plan: 'Rest and follow-up'
      },
      risk_score: 0.3,
      status: 'complete'
    };

    await DatabaseOperations.updateOne(
      'patients',
      { id: created.insertedId },
      { $set: aiAnalysis }
    );

    // Verify update
    const updated = await DatabaseOperations.findOne('patients', { id: created.insertedId });
    expect(updated.status).toBe('complete');
    expect(updated.soap_note.subjective).toBe('Patient reports cough and fever');
  });
});
```

---

## **PHASE 8: Performance Optimization**

```typescript
// src/lib/sqlite/performance-config.ts
export function optimizeSQLitePerformance(db: Database.Database): void {
  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  
  // Optimize for SSD storage
  db.pragma('synchronous = NORMAL');
  
  // Increase cache size (in pages, each page is usually 4KB)
  db.pragma('cache_size = 2000');  // 8MB cache
  
  // Store temporary data in memory
  db.pragma('temp_store = MEMORY');
  
  // Optimize for read-heavy workloads
  db.pragma('mmap_size = 268435456');  // 256MB memory mapping
  
  // Enable foreign key constraints
  db.pragma('foreign_keys = ON');
  
  // Optimize query planner
  db.pragma('optimize');
}
```

---

## **PHASE 9: Rollout Strategy**

### **9.1 Deployment Phases**

#### **Phase 9.1: Development Testing**
- ✅ Complete SQLite implementation
- ✅ Run comprehensive tests
- ✅ Performance benchmarking
- ✅ Data migration validation

#### **Phase 9.2: Internal Beta**
- 🔄 Deploy to staging environment
- 🔄 Test with real MongoDB data
- 🔄 Performance monitoring
- 🔄 Bug fixes and optimization

#### **Phase 9.3: Gradual Rollout**
- 🔄 Feature flag for SQLite vs MongoDB
- 🔄 A/B testing with subset of users
- 🔄 Monitor application performance
- 🔄 Collect user feedback

#### **Phase 9.4: Full Migration**
- 🔄 Enable SQLite for all users
- 🔄 Remove MongoDB dependencies
- 🔄 Clean up legacy code
- 🔄 Final performance validation

### **9.2 Risk Mitigation**

#### **Data Loss Prevention**
- Automated backup before migration
- Rollback procedures tested
- Data validation at each step
- Multiple backup copies maintained

#### **Performance Monitoring**
- Application startup time tracking
- Database query performance metrics
- Memory usage monitoring
- User experience feedback collection

#### **Compatibility Testing**
- Cross-platform testing (Windows, macOS, Linux)
- Different data volumes (small clinic vs large hospital)
- Edge cases and error scenarios
- Integration with existing workflows

---

## **PHASE 10: Success Metrics**

### **10.1 Performance Metrics**

| Metric | Current (MongoDB) | Target (SQLite) | Success Criteria |
|--------|------------------|-----------------|------------------|
| **Application Startup** | ~15-30 seconds | ~3-5 seconds | >75% improvement |
| **Bundle Size** | ~350MB | ~150MB | >50% reduction |
| **Memory Usage** | ~200MB | ~100MB | >50% reduction |
| **Database Queries** | Variable | <100ms avg | Consistent performance |
| **Local Search** | 500ms+ | <50ms | >90% improvement |

### **10.2 Functional Metrics**

- ✅ **Zero Data Loss**: 100% data integrity maintained
- ✅ **Feature Parity**: All existing features work identically
- ✅ **User Experience**: No noticeable workflow changes
- ✅ **Reliability**: <0.1% error rate in database operations
- ✅ **Compatibility**: Works on all supported platforms

### **10.3 Business Metrics**

- 📈 **User Satisfaction**: Faster application perceived performance
- 📈 **Deployment Efficiency**: Smaller downloads, faster installs
- 📈 **Support Costs**: Reduced MongoDB-related issues
- 📈 **Development Velocity**: Simpler local development setup

---

## 🎯 **CLAUDE TASKMASTER TASK BREAKDOWN**

This section provides a structured task breakdown suitable for Claude Taskmaster's AI-driven task management system. Each high-level task includes clear subtasks with specific code references and deliverables.

### **TASK 1: SQLite Database Infrastructure Setup**
**Priority:** High | **Estimated Effort:** 5 days | **Dependencies:** None

#### **Subtasks:**
1. **1.1 Create SQLite Database Service**
   - File: `electron/db/sqlite-db.ts`
   - Implement database initialization, connection management, and health checks
   - Add comprehensive error handling and logging
   - Include performance optimization settings (WAL mode, cache size, etc.)

2. **1.2 Create MongoDB-Compatible SQLite Adapter**
   - File: `src/lib/sqlite/sqlite-adapter.ts`
   - Implement findOne, find, insertOne, updateOne, deleteOne, countDocuments methods
   - Add JSON serialization/deserialization for complex fields
   - Handle MongoDB query operators ($ne, $in, $gt, $lt) in SQLite WHERE clauses

3. **1.3 Add Package Dependencies**
   - Update `package.json` with better-sqlite3, uuid, and their type definitions
   - Configure Electron Builder for SQLite native module packaging
   - Update `dist/builder-effective-config.yaml` to exclude MongoDB binaries

4. **1.4 Schema Migration Implementation**
   - Create all five SQLite tables (patients, ai_cache, notes, local_embeddings, db_metadata)
   - Add performance indexes and foreign key constraints
   - Implement JSON validation rules for complex fields

**Deliverables:** Fully functional SQLite database layer with MongoDB-compatible interface

---

### **TASK 2: IPC Handlers Migration**
**Priority:** High | **Estimated Effort:** 3 days | **Dependencies:** Task 1

#### **Subtasks:**
1. **2.1 Update Database IPC Handlers**
   - File: `electron/ipc/handlers.ts`
   - Replace all MongoDB operations with SQLite adapter calls
   - Update `db:getInfo` handler to return SQLite database information
   - Modify `db:exportData` handler for SQLite export format

2. **2.2 Replace Main Process Database Initialization**
   - File: `electron/main.ts`
   - Remove `initializeDatabase()` call to MongoDB memory server
   - Add `initializeSqliteDatabase()` call in main process startup
   - Update error handling for SQLite initialization failures

3. **2.3 Update Database Connection Configuration**
   - File: `src/lib/mongodb/config.ts`
   - Add logic to determine database target (local SQLite vs remote MongoDB)
   - Implement environment detection for Electron vs web environments
   - Create collection-to-database routing logic

**Deliverables:** All Electron IPC database operations working with SQLite

---

### **TASK 3: API Routes and Data Access Layer Migration**
**Priority:** High | **Estimated Effort:** 4 days | **Dependencies:** Task 1, Task 2

#### **Subtasks:**
1. **3.1 Universal Database Operations Class**
   - File: `src/lib/mongodb/index.ts`
   - Create `DatabaseOperations` class with environment-aware routing
   - Route local collections to SQLite in Electron, MongoDB in web
   - Maintain backward compatibility for all existing database operations

2. **3.2 Patient API Routes Migration**
   - Files: `src/app/api/patients/route.ts`, `src/app/api/patients/[id]/route.ts`
   - Update all patient CRUD operations to use `DatabaseOperations`
   - Ensure proper handling of JSON fields (vitals, symptoms, icd_tags)
   - Maintain existing API response formats

3. **3.3 Cache and Notes API Migration**
   - Files: `src/app/api/enhance-notes/route.ts`, `src/lib/aiCache.ts`, `src/lib/smartCache.ts`
   - Update AI cache operations to use SQLite for storage
   - Modify notes enhancement API to work with SQLite notes table
   - Ensure TTL functionality works with SQLite (cleanup job needed)

4. **3.4 Additional API Routes Updates**
   - Update all remaining API routes that interact with local collections
   - Ensure vector search continues to use MongoDB Atlas (no changes needed)
   - Test all API endpoints with SQLite backend

**Deliverables:** All API routes working seamlessly with SQLite in Electron environment

---

### **TASK 4: Data Migration Tools Development**
**Priority:** High | **Estimated Effort:** 4 days | **Dependencies:** Task 1

#### **Subtasks:**
1. **4.1 MongoDB to SQLite Migration Script**
   - File: `scripts/migrate-mongodb-to-sqlite.ts`
   - Implement full data migration from MongoDB memory server to SQLite
   - Handle ObjectId to UUID conversion
   - Transform nested objects and arrays to JSON format
   - Add comprehensive error handling and progress reporting

2. **4.2 Migration Validation Script**
   - File: `scripts/validate-sqlite-migration.ts`
   - Validate data integrity after migration
   - Test JSON field deserialization
   - Verify foreign key relationships
   - Generate migration success/failure reports

3. **4.3 Rollback and Recovery Tools**
   - Implement rollback capability to restore MongoDB if migration fails
   - Create backup procedures for existing MongoDB data
   - Add data export/import utilities for manual migration scenarios

4. **4.4 Migration CLI and User Interface**
   - Create user-friendly migration interface
   - Add progress indicators and status updates
   - Implement migration scheduling and retry logic

**Deliverables:** Complete data migration toolkit with validation and rollback capabilities

---

### **TASK 5: Testing and Quality Assurance**
**Priority:** High | **Estimated Effort:** 5 days | **Dependencies:** Task 1, Task 2, Task 3

#### **Subtasks:**
1. **5.1 Unit Tests for SQLite Adapter**
   - File: `tests/database/sqlite-adapter.test.ts`
   - Test all CRUD operations with various data types
   - Test JSON field handling and complex nested objects
   - Test MongoDB query operator compatibility
   - Test error scenarios and edge cases

2. **5.2 Integration Tests for Patient Workflow**
   - File: `tests/integration/patient-workflow.test.ts`
   - Test complete patient creation, AI analysis, and retrieval workflow
   - Test patient search and filtering functionality
   - Test notes creation and enhancement features
   - Test data export functionality

3. **5.3 Performance Testing and Benchmarking**
   - Create performance test suite comparing MongoDB vs SQLite
   - Test application startup times, memory usage, and query performance
   - Load testing with various data volumes (100, 1000, 10000+ patients)
   - Generate performance comparison reports

4. **5.4 Cross-Platform Testing**
   - Test SQLite implementation on Windows, macOS, and Linux
   - Verify Electron application packaging with SQLite native modules
   - Test database file permissions and access in different environments

**Deliverables:** Comprehensive test suite with performance benchmarks and cross-platform validation

---

### **TASK 6: Legacy Code Cleanup and Documentation**
**Priority:** Medium | **Estimated Effort:** 3 days | **Dependencies:** Task 5 completion

#### **Subtasks:**
1. **6.1 Remove MongoDB Dependencies**
   - Remove `mongodb-memory-server` and related dependencies from `package.json`
   - Delete legacy files: `electron/local-database.js`, `src/lib/mongodb/local-service.ts`
   - Clean up MongoDB-specific imports and type definitions
   - Update build configurations to exclude MongoDB binaries

2. **6.2 Code Refactoring and Optimization**
   - Simplify database connection logic after MongoDB removal
   - Remove unused MongoDB utility functions and configurations
   - Optimize imports and eliminate dead code paths
   - Update error messages and logging to reflect SQLite usage

3. **6.3 Documentation Updates**
   - Create user migration guide: `docs/SQLLite/migration-guide.md`
   - Update README.md with new SQLite requirements and setup instructions
   - Create developer documentation for SQLite adapter usage
   - Update troubleshooting guides for SQLite-specific issues

4. **6.4 Configuration and Environment Updates**
   - Update TypeScript configurations for SQLite types
   - Clean up environment variables and configuration files
   - Update development setup instructions
   - Create production deployment guidelines

**Deliverables:** Clean, optimized codebase with comprehensive documentation

---

### **TASK 7: Performance Optimization and Production Readiness**
**Priority:** Medium | **Estimated Effort:** 3 days | **Dependencies:** Task 6

#### **Subtasks:**
1. **7.1 SQLite Performance Tuning**
   - File: `src/lib/sqlite/performance-config.ts`
   - Implement optimal SQLite pragma settings for HealthTrack-AI usage patterns
   - Configure memory mapping, cache sizes, and journal modes
   - Add connection pooling if needed for high-volume scenarios

2. **7.2 Advanced Indexing Strategy**
   - Create full-text search indexes for patient names and complaints
   - Optimize indexes for common query patterns (owner_uid, status, dates)
   - Implement automatic index maintenance and optimization
   - Add query performance monitoring

3. **7.3 Data Cleanup and Maintenance**
   - Implement TTL cleanup for ai_cache table (scheduled job)
   - Add database maintenance routines (VACUUM, ANALYZE)
   - Create data archival strategies for old patient records
   - Implement automatic backup scheduling

4. **7.4 Security and Encryption Enhancements**
   - Add database file encryption options (SQLCipher integration)
   - Implement data sanitization for user inputs
   - Add audit logging for database operations
   - Configure proper file permissions for database files

**Deliverables:** Production-ready SQLite implementation with optimal performance and security

---

### **TASK 8: Deployment and Rollout Strategy**
**Priority:** High | **Estimated Effort:** 4 days | **Dependencies:** Task 7

#### **Subtasks:**
1. **8.1 Feature Flag Implementation**
   - Add configuration flag to switch between MongoDB and SQLite
   - Implement A/B testing capability for gradual rollout
   - Create monitoring dashboard for migration success metrics
   - Add fallback mechanisms for migration failures

2. **8.2 Staging Environment Testing**
   - Deploy SQLite version to staging environment
   - Test migration with production-like data volumes
   - Validate all user workflows in staging
   - Performance testing under realistic load conditions

3. **8.3 Production Deployment Plan**
   - Create detailed deployment checklist and procedures
   - Plan maintenance windows for migration execution
   - Prepare rollback procedures and communication plans
   - Set up monitoring and alerting for post-migration issues

4. **8.4 User Communication and Support**
   - Create user-facing migration announcements
   - Prepare support documentation for common migration issues
   - Train support team on SQLite-specific troubleshooting
   - Plan user feedback collection and issue resolution processes

**Deliverables:** Complete deployment strategy with monitoring, rollback capabilities, and user support

---

## 📊 **TASK DEPENDENCIES MATRIX**

```
Task 1 (SQLite Infrastructure) 
├── Task 2 (IPC Handlers) 
├── Task 3 (API Routes) 
├── Task 4 (Migration Tools)
└── Task 5 (Testing)
    └── Task 6 (Cleanup)
        └── Task 7 (Optimization)
            └── Task 8 (Deployment)
```

## 🔍 **REVIEW AND REFACTORING RECOMMENDATIONS**

### **Post-Migration Code Review Focus Areas:**
