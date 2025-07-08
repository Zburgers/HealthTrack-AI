/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @file Renderer-side IPC proxy for SQLite operations.
 *
 * This class provides a MongoDB-like API surface in the renderer process (Next.js)
 * but proxies all calls to the Electron main process via IPC. This is essential
 * for safe and reliable database access from a separate process.
 * 
 * IMPORTANT ARCHITECTURAL CONSTRAINT:
 * SQLite database should ONLY be accessed in Electron main process.
 * The renderer process (including Next.js server) must use IPC channels.
 * API routes should NOT try to use this adapter directly!
 *
 * All methods in this class are asynchronous and return Promises.
 *
 * @see ../../../electron/ipc/database-handlers.ts for the main process implementation.
 */
export class SQLiteAdapter {
  /**
   * Generic method to invoke a database operation via IPC.
   * This ONLY works in the renderer process where window.ipcRenderer is available.
   */
  private async invoke<T>(operation: string, collection: string, payload: any): Promise<T> {
    // Validate we're in the renderer process
    if (typeof window === 'undefined' || !window.ipcRenderer) {
      const errorMessage = 'IPC Renderer not available. Database operations cannot proceed in non-Electron environment.';
      console.error(`❌ [SQLITE_ADAPTER] ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    console.log(`🔄 [SQLITE_ADAPTER] Invoking ${operation} on ${collection} via IPC:`, payload);
    
    try {
      const result = await window.ipcRenderer.invoke('sqlite-operation', {
        operation,
        collection,
        payload
      });
      
      console.log(`✅ [SQLITE_ADAPTER] ${operation} completed successfully via IPC`);
      return result;
    } catch (error) {
      console.error(`❌ [SQLITE_ADAPTER] ${operation} failed via IPC:`, error);
      throw error;
    }
  }

  /**
   * Finds a single document in a collection.
   * @param collection - The collection name.
   * @param filter - The query filter.
   * @returns A promise that resolves with the document or null.
   */
  async findOne<T>(collection: string, filter: any): Promise<T | null> {
    return this.invoke<T | null>('findOne', collection, { filter });
  }

  /**
   * Inserts a single document into a collection.
   * @param collection - The collection name.
   * @param document - The document to insert.
   * @returns A promise that resolves with the insert result.
   */
  async insertOne(collection: string, document: any): Promise<{ acknowledged: boolean; insertedId: any }> {
    return this.invoke<{ acknowledged: boolean; insertedId: any }>('insertOne', collection, { document });
  }

  /**
   * Updates a single document in a collection.
   * @param collection - The collection name.
   * @param filter - The filter to select the document to update.
   * @param update - The update operations.
   * @returns A promise that resolves with the update result.
   */
  async updateOne(collection: string, filter: any, update: any): Promise<{ acknowledged: boolean; modifiedCount: number; upsertedId: any | null; upsertedCount: number; matchedCount: number; }> {
    return this.invoke<{ acknowledged: boolean; modifiedCount: number; upsertedId: any | null; upsertedCount: number; matchedCount: number; }>('updateOne', collection, { filter, update });
  }

  /**
   * Deletes a single document from a collection.
   * @param collection - The collection name.
   * @param filter - The filter to select the document to delete.
   * @returns A promise that resolves with the deletion result.
   */
  async deleteOne(collection: string, filter: any): Promise<{ acknowledged: boolean; deletedCount: number }> {
    return this.invoke<{ acknowledged: boolean; deletedCount: number }>('deleteOne', collection, { filter });
  }

  /**
   * Finds multiple documents in a collection.
   * @param collection - The collection name.
   * @param filter - The query filter.
   * @param options - Optional query options (e.g., sort, limit).
   * @returns A promise that resolves with an array of documents.
   */
  async find<T>(collection: string, filter: any, options?: any): Promise<T[]> {
    return this.invoke<T[]>('find', collection, { filter, options });
  }

  /**
   * Counts the number of documents matching the filter.
   * @param collection - The collection name.
   * @param filter - The query filter.
   * @returns A promise that resolves with the document count.
   */
  async countDocuments(collection: string, filter: any): Promise<number> {
    return this.invoke<number>('countDocuments', collection, { filter });
  }

  /**
   * Direct database execution methods for main process context
   */
  private async executeDirectFindOne(db: any, collection: string, filter: any): Promise<any> {
    const { whereClause, values } = this.buildWhereClause(filter);
    const query = `SELECT * FROM ${collection} ${whereClause} LIMIT 1`;
    
    const stmt = db.prepare(query);
    const result = stmt.get(...values);
    
    return result ? this.parseJsonFields(result) : null;
  }

  private async executeDirectFind(db: any, collection: string, filter: any, options: any): Promise<any[]> {
    const { whereClause, values } = this.buildWhereClause(filter);
    let query = `SELECT * FROM ${collection} ${whereClause}`;
    
    // Add sorting if provided
    if (options?.sort) {
      const sortClauses = Object.entries(options.sort)
        .map(([field, direction]) => `${field} ${direction === 1 ? 'ASC' : 'DESC'}`)
        .join(', ');
      query += ` ORDER BY ${sortClauses}`;
    }
    
    // Add limit if provided
    if (options?.limit) {
      query += ` LIMIT ${options.limit}`;
    }
    
    // Add offset if provided
    if (options?.skip) {
      query += ` OFFSET ${options.skip}`;
    }
    
    const stmt = db.prepare(query);
    const results = stmt.all(...values);
    
    return results.map((result: Record<string, any>) => this.parseJsonFields(result));
  }

  private async executeDirectInsertOne(db: any, collection: string, document: any): Promise<{ insertedId: any; acknowledged: boolean }> {
    // Generate ID if not provided
    if (!document.id) {
      document.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Add required fields for patients table
    if (collection === 'patients') {
      if (!document.owner_uid) {
        document.owner_uid = 'system';
      }
      if (!document.name) {
        document.name = 'Unknown Patient';
      }
      if (!document.age) {
        document.age = 0;
      }
    }
    
    const { columns, placeholders, values } = this.prepareInsertData(document);
    const query = `INSERT INTO ${collection} (${columns}) VALUES (${placeholders})`;
    
    const stmt = db.prepare(query);
    stmt.run(...values);
    
    return {
      insertedId: document.id,
      acknowledged: true
    };
  }

  private async executeDirectUpdateOne(db: any, collection: string, filter: any, update: any): Promise<{ matchedCount: number; modifiedCount: number; acknowledged: boolean }> {
    const { whereClause, values: whereValues } = this.buildWhereClause(filter);
    
    // Handle MongoDB-style updates
    const updateData = update.$set || update;
    const { setClauses, setValues } = this.prepareUpdateData(updateData);
    
    const query = `UPDATE ${collection} SET ${setClauses} ${whereClause}`;
    const allValues = [...setValues, ...whereValues];
    
    const stmt = db.prepare(query);
    const result = stmt.run(...allValues);
    
    return {
      matchedCount: result.changes > 0 ? 1 : 0,
      modifiedCount: result.changes,
      acknowledged: true
    };
  }

  private async executeDirectDeleteOne(db: any, collection: string, filter: any): Promise<{ deletedCount: number; acknowledged: boolean }> {
    const { whereClause, values } = this.buildWhereClause(filter);
    const query = `DELETE FROM ${collection} ${whereClause}`;
    
    const stmt = db.prepare(query);
    const result = stmt.run(...values);
    
    return {
      deletedCount: result.changes,
      acknowledged: true
    };
  }

  private async executeDirectCountDocuments(db: any, collection: string, filter: any): Promise<number> {
    const { whereClause, values } = this.buildWhereClause(filter);
    const query = `SELECT COUNT(*) as count FROM ${collection} ${whereClause}`;
    
    const stmt = db.prepare(query);
    const result = stmt.get(...values) as { count: number };
    
    return result.count;
  }

  /**
   * Utility methods for direct database operations
   */
  private buildWhereClause(filter: any): { whereClause: string; values: any[] } {
    if (!filter || Object.keys(filter).length === 0) {
      return { whereClause: '', values: [] };
    }

    const conditions: string[] = [];
    const values: any[] = [];

    for (const key in filter) {
      const value = filter[key];
      if (key === '$or') {
        const orConditions = value.map((orFilter: any) => {
          const { whereClause } = this.buildWhereClause(orFilter);
          return `(${whereClause.replace(/^WHERE\s*/, '')})`;
        }).join(' OR ');
        conditions.push(`(${orConditions})`);
      } else if (typeof value === 'object' && value !== null) {
        if (value.$ne !== undefined) {
          conditions.push(`${key} != ?`);
          values.push(value.$ne);
        } else if (value.$exists !== undefined) {
          if (value.$exists) {
            conditions.push(`${key} IS NOT NULL`);
          } else {
            conditions.push(`${key} IS NULL`);
          }
        } else if (value.$in) {
          const placeholders = value.$in.map(() => '?').join(',');
          conditions.push(`${key} IN (${placeholders})`);
          values.push(...value.$in);
        }
      } else {
        conditions.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      values,
    };
  }

  private parseJsonFields(row: any): any {
    const parsed = { ...row };
    
    const jsonFields = [
      'vitals', 'symptoms', 'previous_conditions', 'allergies',
      'current_medications', 'icd_tag_summary', 'icd_tags',
      'risk_predictions', 'soap_note', 'matched_cases',
      'medical_history_analysis', 'ai_metadata', 'input', 'output',
      'embedding', 'meta', 'collections'
    ];
    
    for (const field of jsonFields) {
      if (parsed[field] && typeof parsed[field] === 'string') {
        try {
          parsed[field] = JSON.parse(parsed[field]);
        } catch (error) {
          // Ignore parse errors
        }
      }
    }
    
    return parsed;
  }

  private prepareInsertData(document: any): { columns: string; placeholders: string; values: any[] } {
    const entries = Object.entries(document);
    const columns = entries.map(([key]) => key).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const values = entries.map(([, value]) => {
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value;
    });
    
    return { columns, placeholders, values };
  }

  private prepareUpdateData(updateData: any): { setClauses: string; setValues: any[] } {
    const entries = Object.entries(updateData);
    const setClauses = entries.map(([key]) => `${key} = ?`).join(', ');
    const setValues = entries.map(([, value]) => {
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value;
    });
    
    return { setClauses, setValues };
  }
}