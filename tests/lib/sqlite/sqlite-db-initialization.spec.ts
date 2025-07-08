import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { initializeSqliteDatabase, getSqliteDbPath, closeSqliteDatabase, getSqliteDatabase } from '../../../electron/db/sqlite-db';

describe('SQLite Database Initialization - Task 13', () => {
  let testDbPath: string;

  beforeEach(() => {
    // Use a temporary test database file
    testDbPath = path.join(process.cwd(), 'test-database', 'test_healthtrack.sqlite');
    const testDbDir = path.dirname(testDbPath);
    
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // Ensure test directory exists
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up database connection and file
    try {
      closeSqliteDatabase();
    } catch (error) {
      // Ignore cleanup errors
    }
    
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('Task 13: Should populate db_metadata table with UUID on first initialization', async () => {
    // Mock the getSqliteDbPath to return our test path
    jest.spyOn(require('../../../electron/db/sqlite-db'), 'getSqliteDbPath').mockReturnValue(testDbPath);

    // Initialize the database for the first time
    await initializeSqliteDatabase();
    
    const db = getSqliteDatabase();
    
    // Check that db_metadata table contains exactly one row with key 'main'
    const metadataRows = db.prepare(`
      SELECT id, key, version, collections, initialized_at
      FROM db_metadata 
      WHERE key = 'main'
    `).all();

    expect(metadataRows).toHaveLength(1);
    
    const metadata = metadataRows[0] as any;
    
    // Verify the metadata structure
    expect(metadata.key).toBe('main');
    expect(metadata.version).toBe('1.0.0');
    expect(metadata.id).toBeDefined();
    expect(metadata.id.length).toBe(36); // UUID v4 length
    expect(metadata.initialized_at).toBeDefined();
    
    // Verify UUID format (basic check)
    expect(metadata.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    
    // Verify collections array
    const collections = JSON.parse(metadata.collections);
    expect(collections).toEqual(['patients', 'notes', 'ai_cache', 'local_embeddings', 'db_metadata']);
  });

  test('Task 13: Should not duplicate metadata on subsequent initializations', async () => {
    // Mock the getSqliteDbPath to return our test path
    jest.spyOn(require('../../../electron/db/sqlite-db'), 'getSqliteDbPath').mockReturnValue(testDbPath);

    // Initialize the database twice
    await initializeSqliteDatabase();
    closeSqliteDatabase();
    await initializeSqliteDatabase();
    
    const db = getSqliteDatabase();
    
    // Check that there's still only one metadata row
    const metadataCount = db.prepare(`
      SELECT COUNT(*) as count FROM db_metadata WHERE key = 'main'
    `).get() as { count: number };

    expect(metadataCount.count).toBe(1);
  });

  test('Task 13: Should create all required tables during initialization', async () => {
    // Mock the getSqliteDbPath to return our test path
    jest.spyOn(require('../../../electron/db/sqlite-db'), 'getSqliteDbPath').mockReturnValue(testDbPath);

    await initializeSqliteDatabase();
    
    const db = getSqliteDatabase();
    
    // Check that all required tables exist
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all() as { name: string }[];

    const tableNames = tables.map(t => t.name);
    
    expect(tableNames).toContain('patients');
    expect(tableNames).toContain('notes');
    expect(tableNames).toContain('ai_cache');
    expect(tableNames).toContain('local_embeddings');
    expect(tableNames).toContain('db_metadata');
  });

  test('Task 13: Should verify db_metadata table structure', async () => {
    // Mock the getSqliteDbPath to return our test path
    jest.spyOn(require('../../../electron/db/sqlite-db'), 'getSqliteDbPath').mockReturnValue(testDbPath);

    await initializeSqliteDatabase();
    
    const db = getSqliteDatabase();
    
    // Check db_metadata table structure
    const tableInfo = db.prepare(`PRAGMA table_info(db_metadata)`).all() as any[];
    
    const columns = tableInfo.map(col => col.name);
    expect(columns).toContain('id');
    expect(columns).toContain('key');
    expect(columns).toContain('version');
    expect(columns).toContain('collections');
    expect(columns).toContain('initialized_at');
    expect(columns).toContain('last_updated');
  });
});
