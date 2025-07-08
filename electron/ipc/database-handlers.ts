import { ipcMain } from 'electron';
import { getSqliteDatabase } from '../db/sqlite-db'; // Corrected import

/**
 * A centralized IPC handler for all SQLite database operations.
 * This ensures that only the Electron main process interacts with the native sqlite3 module.
 * The Next.js server will call these handlers via IPC.
 */
export function setupDatabaseIpcHandlers() {
  console.log('🔌 Setting up database IPC handlers...');

  ipcMain.handle('sqlite-operation', async (event, { operation, collection, payload }) => {
    console.log(`🔄 [DATABASE_HANDLER] Received ${operation} on ${collection}:`, payload);
    
    try {
      const db = getSqliteDatabase(); 
      if (!db) {
        throw new Error('Database not initialized in main process.');
      }

      const adapter = new SQLiteAdapter(db);

      let result;
      switch (operation) {
        case 'findOne':
          result = await adapter.findOne(collection, payload.filter || {});
          break;
        case 'find':
          result = await adapter.find(collection, payload.filter || {}, payload.options || {});
          break;
        case 'insertOne':
          result = await adapter.insertOne(collection, payload.document);
          break;
        case 'updateOne':
          result = await adapter.updateOne(collection, payload.filter || {}, payload.update);
          break;
        case 'deleteOne':
          result = await adapter.deleteOne(collection, payload.filter || {}, payload.options || {});
          break;
        case 'countDocuments':
          result = await adapter.countDocuments(collection, payload.filter || {});
          break;
        default:
          throw new Error(`Unsupported SQLite operation: ${operation}`);
      }
      
      console.log(`✅ [DATABASE_HANDLER] ${operation} completed successfully:`, result);
      return result;
    } catch (error) {
      console.error(`❌ [DATABASE_HANDLER] Error during '${operation}' on '${collection}':`, error);
      throw error;
    }
  });

  console.log('✅ Database IPC handlers setup complete.');
}

/**
 * We need a simplified, IPC-compatible version of the adapter in the main process.
 * This adapter does not initialize the DB itself but receives the DB instance.
 */
class SQLiteAdapter {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // Re-implementing the core logic from the original SQLiteAdapter
  // Note: These are simplified and assume direct DB access is available.

  private deserializeResult(result: any) {
    if (!result) return null;
    const deserialized = { ...result };
    for (const key in deserialized) {
      if (typeof deserialized[key] === 'string') {
        try {
          // Attempt to parse fields that are commonly JSON strings
          if (['vitals', 'symptoms', 'previous_conditions', 'allergies', 'current_medications', 'icd_tag_summary', 'icd_tags', 'risk_predictions', 'soap_note', 'matched_cases', 'medical_history_analysis', 'ai_metadata', 'embedding', 'meta', 'collections', 'input', 'output'].includes(key)) {
            deserialized[key] = JSON.parse(deserialized[key]);
          }
        } catch (e) {
          // Ignore if it's not a valid JSON string
        }
      }
    }
    return deserialized;
  }

  private serializeDocument(doc: any, id: string) {
    const serialized = { ...doc, id };
    for (const key in serialized) {
      if (typeof serialized[key] === 'object' && serialized[key] !== null) {
        serialized[key] = JSON.stringify(serialized[key]);
      }
    }
    return serialized;
  }
  
  private buildWhereClause(filter: any): { whereClause: string; params: any[] } {
    if (!filter || Object.keys(filter).length === 0) {
      return { whereClause: '', params: [] };
    }

    const conditions: string[] = [];
    const params: any[] = [];

    for (const key in filter) {
      const value = filter[key];
      if (key === '$or') {
        const orConditions = value.map((orFilter: any) => {
          const { whereClause } = this.buildWhereClause(orFilter);
          // remove "WHERE" from sub-clause
          return `(${whereClause.replace(/^WHERE\s*/, '')})`;
        }).join(' OR ');
        conditions.push(`(${orConditions})`);
      } else if (typeof value === 'object' && value !== null) {
        if (value.$ne !== undefined) {
          conditions.push(`${key} != ?`);
          params.push(value.$ne);
        } else if (value.$exists !== undefined) {
          if (value.$exists) {
            conditions.push(`${key} IS NOT NULL`);
          } else {
            conditions.push(`${key} IS NULL`);
          }
        } else if (value.$in) {
          const placeholders = value.$in.map(() => '?').join(',');
          conditions.push(`${key} IN (${placeholders})`);
          params.push(...value.$in);
        }
      } else {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    }
    
    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private buildUpdateClause(update: any): { setClause: string; updateParams: any[] } {
    const setClauses: string[] = [];
    const updateParams: any[] = [];

    if (update.$set) {
      for (const key in update.$set) {
        setClauses.push(`${key} = ?`);
        let value = update.$set[key];
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        updateParams.push(value);
      }
    }
    
    // Add last_updated timestamp automatically
    setClauses.push('last_updated = ?');
    updateParams.push(new Date().toISOString());

    return { setClause: setClauses.join(', '), updateParams };
  }
  
  private buildSortClause(sort: any): string {
    return Object.entries(sort)
      .map(([key, value]) => `${key} ${value === -1 ? 'DESC' : 'ASC'}`)
      .join(', ');
  }

  async findOne(collection: string, filter: any): Promise<any> {
    const { whereClause, params } = this.buildWhereClause(filter);
    const query = `SELECT * FROM ${collection} ${whereClause} LIMIT 1`;
    const result = this.db.prepare(query).get(...params);
    return this.deserializeResult(result);
  }

  async find(collection: string, filter: any = {}, options: any = {}): Promise<any[]> {
    const { whereClause, params } = this.buildWhereClause(filter);
    let query = `SELECT * FROM ${collection} ${whereClause}`;
    if (options.sort) {
      query += ` ORDER BY ${this.buildSortClause(options.sort)}`;
    }
    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
    }
    const results = this.db.prepare(query).all(...params);
    return results.map((r: any) => this.deserializeResult(r));
  }

  async insertOne(collection: string, document: any): Promise<any> {
    const id = document.id || document._id || require('crypto').randomUUID();
    const now = new Date().toISOString();
    const docWithTimestamps = {
      ...document,
      createdAt: document.createdAt || now,
      last_updated: document.last_updated || now,
    };
    const serializedDoc = this.serializeDocument(docWithTimestamps, id);
    const columns = Object.keys(serializedDoc);
    const placeholders = columns.map(() => '?').join(', ');
    const query = `INSERT INTO ${collection} (${columns.join(', ')}) VALUES (${placeholders})`;
    this.db.prepare(query).run(...Object.values(serializedDoc));
    return { insertedId: id, acknowledged: true };
  }

  async updateOne(collection: string, filter: any, update: any): Promise<any> {
    const { whereClause, params } = this.buildWhereClause(filter);
    const { setClause, updateParams } = this.buildUpdateClause(update);
    const query = `UPDATE ${collection} SET ${setClause} ${whereClause}`;
    const result = this.db.prepare(query).run(...updateParams, ...params);
    return { matchedCount: result.changes > 0 ? 1 : 0, modifiedCount: result.changes, acknowledged: true };
  }

  async deleteOne(collection: string, filter: any, options: any = {}): Promise<any> {
      const { whereClause, params } = this.buildWhereClause(filter);
      let query;
      let runParams;

      if (options.hardDelete) {
          query = `DELETE FROM ${collection} ${whereClause}`;
          runParams = params;
      } else {
          const now = new Date().toISOString();
          query = `UPDATE ${collection} SET isDeleted = ?, deletedAt = ?, last_updated = ? ${whereClause}`;
          runParams = [true, now, now, ...params];
      }
      
      const result = this.db.prepare(query).run(...runParams);
      return { deletedCount: result.changes, acknowledged: true };
  }

  async countDocuments(collection: string, filter: any = {}): Promise<number> {
    const { whereClause, params } = this.buildWhereClause(filter);
    const query = `SELECT COUNT(*) as count FROM ${collection} ${whereClause}`;
    const result = this.db.prepare(query).get(...params);
    return result.count;
  }
}
