/**
 * @file Server-side SQLite adapter for Next.js API routes in Electron
 * 
 * This adapter allows API routes to access SQLite directly when running
 * in Electron environment. It bypasses IPC and accesses the database directly.
 * 
 * This is a pragmatic solution for API routes that need database access.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

class ServerSQLiteAdapter {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    // Use the same database path as the main process
    this.dbPath = path.join(process.cwd(), 'database', 'healthtrack_local.sqlite');
  }

  /**
   * Initialize the database connection
   */
  private initializeDb(): Database.Database {
    if (this.db) {
      return this.db;
    }

    // Check if database file exists
    if (!fs.existsSync(this.dbPath)) {
      throw new Error(`SQLite database not found at ${this.dbPath}. Make sure Electron main process has initialized it.`);
    }

    console.log(`[SERVER_SQLITE] Connecting to database at ${this.dbPath}`);
    this.db = new Database(this.dbPath);
    
    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
    
    return this.db;
  }

  /**
   * Convert JavaScript values to SQLite-compatible values
   */
  private convertValue(value: any): any {
    if (typeof value === 'boolean') {
      return value ? 1 : 0; // Convert boolean to integer
    }
    return value;
  }

  /**
   * Find multiple documents in a collection (table)
   */
  async find(collection: string, filter: any = {}, options: any = {}): Promise<any[]> {
    const db = this.initializeDb();
    
    let query = `SELECT * FROM ${collection}`;
    const params: any[] = [];
    
    // Build WHERE clause from filter
    if (filter && Object.keys(filter).length > 0) {
      const whereConditions: string[] = [];
      
      for (const [key, value] of Object.entries(filter)) {
        if (key === 'is_deleted' && typeof value === 'object' && value && '$ne' in value) {
          // Handle $ne operator
          whereConditions.push(`(${key} IS NULL OR ${key} != ?)`);
          params.push(this.convertValue(value.$ne));
        } else {
          whereConditions.push(`${key} = ?`);
          params.push(this.convertValue(value));
        }
      }
      
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }
    }
    
    // Add ORDER BY if specified
    if (options.sort) {
      const sortKeys = Object.keys(options.sort);
      if (sortKeys.length > 0) {
        const sortClauses = sortKeys.map(key => {
          const direction = options.sort[key] === -1 ? 'DESC' : 'ASC';
          return `${key} ${direction}`;
        });
        query += ` ORDER BY ${sortClauses.join(', ')}`;
      }
    }
    
    // Add LIMIT if specified
    if (options.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }
    
    console.log(`[SERVER_SQLITE] Executing query: ${query}`, params);
    
    try {
      const stmt = db.prepare(query);
      const results = stmt.all(...params);
      
      console.log(`[SERVER_SQLITE] Found ${results.length} records`);
      return results;
    } catch (error) {
      console.error(`[SERVER_SQLITE] Query failed:`, error);
      throw error;
    }
  }

  /**
   * Find a single document in a collection (table)
   */
  async findOne(collection: string, filter: any = {}): Promise<any> {
    const results = await this.find(collection, filter, { limit: 1 });
    return results[0] || null;
  }

  /**
   * Insert a single document into a collection (table)
   */
  async insertOne(collection: string, document: any): Promise<{ insertedId: any; acknowledged: boolean }> {
    const db = this.initializeDb();
    
    const keys = Object.keys(document);
    const values = Object.values(document);
    const placeholders = keys.map(() => '?').join(', ');
    
    const query = `INSERT INTO ${collection} (${keys.join(', ')}) VALUES (${placeholders})`;
    
    console.log(`[SERVER_SQLITE] Inserting into ${collection}:`, document);
    
    try {
      const stmt = db.prepare(query);
      const result = stmt.run(...values);
      
      return {
        insertedId: document.id || result.lastInsertRowid,
        acknowledged: true
      };
    } catch (error) {
      console.error(`[SERVER_SQLITE] Insert failed:`, error);
      throw error;
    }
  }

  /**
   * Update a single document in a collection (table)
   */
  async updateOne(collection: string, filter: any, update: any, options?: any): Promise<{ matchedCount: number; modifiedCount: number; acknowledged: boolean }> {
    const db = this.initializeDb();
    
    // Handle MongoDB-style $set updates
    const updateData = update.$set || update;
    
    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const setValues = Object.values(updateData);
    
    let query = `UPDATE ${collection} SET ${setClause}`;
    const params = [...setValues];
    
    // Build WHERE clause
    if (filter && Object.keys(filter).length > 0) {
      const whereConditions = Object.keys(filter).map(key => `${key} = ?`);
      query += ` WHERE ${whereConditions.join(' AND ')}`;
      params.push(...Object.values(filter));
    }
    
    console.log(`[SERVER_SQLITE] Updating ${collection}:`, { filter, update: updateData });
    
    try {
      const stmt = db.prepare(query);
      const result = stmt.run(...params);
      
      return {
        matchedCount: result.changes > 0 ? 1 : 0,
        modifiedCount: result.changes,
        acknowledged: true
      };
    } catch (error) {
      console.error(`[SERVER_SQLITE] Update failed:`, error);
      throw error;
    }
  }

  /**
   * Delete a single document from a collection (table)
   */
  async deleteOne(collection: string, filter: any): Promise<{ deletedCount: number; acknowledged: boolean }> {
    const db = this.initializeDb();
    
    let query = `DELETE FROM ${collection}`;
    const params: any[] = [];
    
    if (filter && Object.keys(filter).length > 0) {
      const whereConditions = Object.keys(filter).map(key => `${key} = ?`);
      query += ` WHERE ${whereConditions.join(' AND ')}`;
      params.push(...Object.values(filter));
    }
    
    console.log(`[SERVER_SQLITE] Deleting from ${collection}:`, filter);
    
    try {
      const stmt = db.prepare(query);
      const result = stmt.run(...params);
      
      return {
        deletedCount: result.changes,
        acknowledged: true
      };
    } catch (error) {
      console.error(`[SERVER_SQLITE] Delete failed:`, error);
      throw error;
    }
  }

  /**
   * Count documents in a collection (table)
   */
  async countDocuments(collection: string, filter: any = {}): Promise<number> {
    const db = this.initializeDb();
    
    let query = `SELECT COUNT(*) as count FROM ${collection}`;
    const params: any[] = [];
    
    if (filter && Object.keys(filter).length > 0) {
      const whereConditions: string[] = [];
      
      for (const [key, value] of Object.entries(filter)) {
        if (key === 'is_deleted' && typeof value === 'object' && value && '$ne' in value) {
          whereConditions.push(`(${key} IS NULL OR ${key} != ?)`);
          params.push(value.$ne);
        } else {
          whereConditions.push(`${key} = ?`);
          params.push(value);
        }
      }
      
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }
    }
    
    try {
      const stmt = db.prepare(query);
      const result = stmt.get(...params) as { count: number };
      return result.count;
    } catch (error) {
      console.error(`[SERVER_SQLITE] Count failed:`, error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const serverSQLiteAdapter = new ServerSQLiteAdapter();
export default serverSQLiteAdapter;
