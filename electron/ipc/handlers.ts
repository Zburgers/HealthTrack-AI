import {
  ipcMain,
  app,
  shell,
  dialog,
  IpcMainInvokeEvent,
  OpenDialogReturnValue,
  SaveDialogReturnValue,
} from 'electron';
import { getSqliteDatabase, getSqliteDbPath, healthCheck } from '../db/sqlite-db';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Setup IPC handlers for secure communication between main and renderer processes
 */
export function setupIpcHandlers(): void {
  console.log('🔌 Setting up IPC handlers...');
  // Database operations
  setupDatabaseHandlers();
  // App information handlers
  setupAppHandlers();
  // System operation handlers
  setupSystemHandlers();
  console.log('✅ IPC handlers setup complete');
}

/**
 * Database operation handlers
 */
function setupDatabaseHandlers(): void {
  // Define the health check function
  const handleDbHealth = async (): Promise<any> => {
    try {
      console.log('🏥 [DB_HEALTH] Checking SQLite database health...');
      const isHealthy = healthCheck();
      const dbPath = getSqliteDbPath();
      const result = {
        status: isHealthy ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        path: dbPath,
        details:
          isHealthy
            ? 'Database is responding to queries'
            : 'Database failed health check',
      };
      console.log(`🏥 [DB_HEALTH] SQLite health: ${result.status}`);
      return result;
    } catch (error) {
      console.error('❌ [DB_HEALTH] Health check failed:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  // Database health check handler
  ipcMain.handle('db-health', handleDbHealth);

  // Database information handler
  ipcMain.handle('db-getInfo', async (): Promise<any> => {
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
        const tableInfo = table as { name: string };
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableInfo.name}`).get() as { count: number };
        collectionsInfo.push({
          name: tableInfo.name,
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
  
  // Generic findOne
  ipcMain.handle('db-findOne', async (event, collection, query) => {
    console.log(`🔍 [DB_HANDLER] Finding one in ${collection} with query:`, query);
    try {
      const db = getSqliteDatabase();
      if (!db) {
        throw new Error('Database not initialized in main process.');
      }
      
      let whereClause = '1 = 1';
      const values = [];
      if (query && Object.keys(query).length > 0) {
        const conditions = [];
        for (const key in query) {
          if (Object.prototype.hasOwnProperty.call(query, key)) {
            const value = query[key];
            if (typeof value === 'object' && value !== null && '$ne' in value) {
              conditions.push(`${key} != ?`);
              values.push(value['$ne']);
            } else {
              conditions.push(`${key} = ?`);
              values.push(value);
            }
          }
        }
        if (conditions.length > 0) {
          whereClause = conditions.join(' AND ');
        }
      }

      const stmt = db.prepare(`SELECT * FROM ${collection} WHERE ${whereClause} LIMIT 1`);
      const result = stmt.get(...values);
      console.log(`✅ [DB_HANDLER] Found one: ${result ? 'yes' : 'no'}`);
      return result || null;
    } catch (error) {
      console.error(`❌ [DB_HANDLER] Failed to find one in ${collection}:`, error);
      throw error;
    }
  });

  // Generic find
  ipcMain.handle('db-find', async (event, collection, query, options = {}) => {
    console.log(`🔍 [DB_HANDLER] Finding in ${collection} with query:`, query);
    try {
      const db = getSqliteDatabase();
      if (!db) {
        throw new Error('Database not initialized in main process.');
      }
      
      let whereClause = '1 = 1';
      const values = [];
      if (query && Object.keys(query).length > 0) {
        const conditions = [];
        for (const key in query) {
          if (Object.prototype.hasOwnProperty.call(query, key)) {
            const value = query[key];
            if (typeof value === 'object' && value !== null && '$ne' in value) {
              conditions.push(`${key} != ?`);
              values.push(value['$ne']);
            } else {
              conditions.push(`${key} = ?`);
              values.push(value);
            }
          }
        }
        if (conditions.length > 0) {
          whereClause = conditions.join(' AND ');
        }
      }

      let sql = `SELECT * FROM ${collection} WHERE ${whereClause}`;
      if (options.orderBy) {
        sql += ` ORDER BY ${options.orderBy}`;
      }
      if (options.limit) {
        sql += ` LIMIT ${options.limit}`;
      }
      const stmt = db.prepare(sql);
      const result = stmt.all(...values);
      console.log(`✅ [DB_HANDLER] Found ${result.length} records in ${collection}`);
      return result;
    } catch (error) {
      console.error(`❌ [DB_HANDLER] Failed to find in ${collection}:`, error);
      throw error;
    }
  });
  
  // Patient operations
  ipcMain.handle('db-getPatients', async () => {
    console.log('🔍 [DB_HANDLER] Getting all patients');
    try {
      const db = getSqliteDatabase();
      if (!db) {
        throw new Error('Database not initialized in main process.');
      }
      
      const stmt = db.prepare('SELECT * FROM patients ORDER BY last_updated DESC');
      const result = stmt.all();
      
      console.log(`✅ [DB_HANDLER] Found ${result.length} patients`);
      return result;
    } catch (error) {
      console.error('❌ [DB_HANDLER] Failed to get patients:', error);
      throw error;
    }
  });
  
  ipcMain.handle('db-getPatient', async (event, id: string) => {
    console.log(`🔍 [DB_HANDLER] Getting patient with ID: ${id}`);
    try {
      const db = getSqliteDatabase();
      if (!db) {
        throw new Error('Database not initialized in main process.');
      }
      
      const stmt = db.prepare('SELECT * FROM patients WHERE id = ? LIMIT 1');
      const result = stmt.get(id);
      
      console.log(`✅ [DB_HANDLER] Patient found: ${result ? 'yes' : 'no'}`);
      return result || null;
    } catch (error) {
      console.error('❌ [DB_HANDLER] Failed to get patient:', error);
      throw error;
    }
  });
  
  ipcMain.handle('db-createPatient', async (event, patient: any) => {
    console.log('➕ [DB_HANDLER] Creating new patient');
    try {
      const db = getSqliteDatabase();
      if (!db) {
        throw new Error('Database not initialized in main process.');
      }
      
      // Generate ID if not present
      const patientWithId = { ...patient, id: patient.id || Date.now().toString() };
      
      const columns = Object.keys(patientWithId);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO patients (${columns.join(', ')}) VALUES (${placeholders})`;
      const values = columns.map(col => patientWithId[col]);
      
      const stmt = db.prepare(sql);
      const result = stmt.run(...values);
      
      console.log(`✅ [DB_HANDLER] Patient created with ID: ${patientWithId.id}`);
      return { insertedId: patientWithId.id, ...result };
    } catch (error) {
      console.error('❌ [DB_HANDLER] Failed to create patient:', error);
      throw error;
    }
  });
  
  ipcMain.handle('db-updatePatient', async (event, id: string, updates: any) => {
    console.log(`✏️ [DB_HANDLER] Updating patient with ID: ${id}`);
    try {
      const db = getSqliteDatabase();
      if (!db) {
        throw new Error('Database not initialized in main process.');
      }
      
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const sql = `UPDATE patients SET ${setClause} WHERE id = ?`;
      const values = [...Object.values(updates), id];
      
      const stmt = db.prepare(sql);
      const result = stmt.run(...values);
      
      console.log(`✅ [DB_HANDLER] Patient updated: ${result.changes} changes`);
      return { modifiedCount: result.changes, ...result };
    } catch (error) {
      console.error('❌ [DB_HANDLER] Failed to update patient:', error);
      throw error;
    }
  });
  
  ipcMain.handle('db-deletePatient', async (event, id: string) => {
    console.log(`❌ [DB_HANDLER] Deleting patient with ID: ${id}`);
    try {
      const db = getSqliteDatabase();
      if (!db) {
        throw new Error('Database not initialized in main process.');
      }
      
      const stmt = db.prepare('DELETE FROM patients WHERE id = ?');
      const result = stmt.run(id);
      
      console.log(`✅ [DB_HANDLER] Patient deleted: ${result.changes} changes`);
      return { deletedCount: result.changes, ...result };
    } catch (error) {
      console.error('❌ [DB_HANDLER] Failed to delete patient:', error);
      throw error;
    }
  });
  
  // AI Cache operations
  ipcMain.handle('db-getAICache', async (event, key: string) => {
    console.log(`🧠 [DB_HANDLER] Getting AI cache for key: ${key}`);
    try {
      const db = getSqliteDatabase();
      if (!db) {
        throw new Error('Database not initialized in main process.');
      }
      
      const stmt = db.prepare('SELECT * FROM ai_cache WHERE key = ? LIMIT 1');
      const result = stmt.get(key);
      
      console.log(`✅ [DB_HANDLER] AI cache found: ${result ? 'yes' : 'no'}`);
      return result || null;
    } catch (error) {
      console.error('❌ [DB_HANDLER] Failed to get AI cache:', error);
      throw error;
    }
  });
  
  ipcMain.handle('db-setAICache', async (event, key: string, workflow: string, input: any, output: any, expiryMs?: number) => {
    const expiryTime = expiryMs ? new Date(Date.now() + expiryMs).toISOString() : null;
    console.log(`🧠 [DB_HANDLER] Setting AI cache for key: ${key}, workflow: ${workflow}`);
    
    try {
      const db = getSqliteDatabase();
      if (!db) {
        throw new Error('Database not initialized in main process.');
      }
      
      const cacheDocument = {
        key,
        workflow,
        input: JSON.stringify(input),
        output: JSON.stringify(output),
        created_at: new Date().toISOString(),
        expires_at: expiryTime
      };
      
      const columns = Object.keys(cacheDocument);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT OR REPLACE INTO ai_cache (${columns.join(', ')}) VALUES (${placeholders})`;
      const values = columns.map(col => (cacheDocument as any)[col]);
      
      const stmt = db.prepare(sql);
      const result = stmt.run(...values);
      
      console.log(`✅ [DB_HANDLER] AI cache set for key: ${key}`);
      return { insertedId: key, ...result };
    } catch (error) {
      console.error('❌ [DB_HANDLER] Failed to set AI cache:', error);
      throw error;
    }
  });

  // Export handler (modified for SQLite)
  ipcMain.handle('db-exportData', async (): Promise<any> => {
    try {
      const db = getSqliteDatabase();
      
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
        const tableInfo = table as { name: string };
        const rows = db.prepare(`SELECT * FROM ${tableInfo.name}`).all();
        (exportData.tables as Record<string, any>)[tableInfo.name] = rows;
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

/**
 * App information handlers
 */
function setupAppHandlers(): void {
  // App version
  ipcMain.handle('app:getVersion', async (): Promise<string> => {
    return app.getVersion();
  });

  // App paths
  ipcMain.handle('app:getPaths', async (): Promise<any> => {
    return {
      userData: app.getPath('userData'),
      documents: app.getPath('documents'),
      downloads: app.getPath('downloads'),
      temp: app.getPath('temp'),
    };
  });

  console.log('✅ App handlers setup complete');
}

/**
 * System operation handlers
 */
function setupSystemHandlers(): void {
  // Open external URL
  ipcMain.handle('system:openExternal', async (event: IpcMainInvokeEvent, url: string): Promise<void> => {
    await shell.openExternal(url);
  });

  // Show item in folder
  ipcMain.handle('system:showItemInFolder', async (event: IpcMainInvokeEvent, fullPath: string): Promise<void> => {
    shell.showItemInFolder(fullPath);
  });

  console.log('✅ System handlers setup complete');
}
