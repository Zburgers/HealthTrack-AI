import { SQLiteAdapter } from './sqlite-adapter';
import { v4 as uuidv4, validate as validateUUID } from 'uuid';
import Database from 'better-sqlite3';

// Mock the SQLite database
jest.mock('../../../electron/db/sqlite-db');

describe('SQLiteAdapter CRUD Operations', () => {
  let adapter: SQLiteAdapter;
  let mockDb: any;

  beforeEach(() => {
    // Create a more realistic database mock
    mockDb = {
      prepare: jest.fn(),
      exec: jest.fn(),
      transaction: jest.fn(),
      pragma: jest.fn()
    };

    // Mock database statements
    const mockStatement = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn()
    };

    mockDb.prepare.mockReturnValue(mockStatement);
    
    adapter = new SQLiteAdapter();
    (adapter as any).db = mockDb;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('insertOne', () => {
    it('should insert a document and return insertedId', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.run.mockReturnValue({ changes: 1, lastInsertRowid: 1 });

      const document = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com'
      };

      const result = await adapter.insertOne('patients', document);

      expect(result.acknowledged).toBe(true);
      expect(result.insertedId).toBeDefined();
      expect(validateUUID(result.insertedId)).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalled();
      expect(mockStatement.run).toHaveBeenCalled();
    });

    it('should generate UUID when no id is provided', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.run.mockReturnValue({ changes: 1, lastInsertRowid: 1 });

      const document = { name: 'John Doe', age: 30 };
      const result = await adapter.insertOne('patients', document);
      
      expect(validateUUID(result.insertedId)).toBe(true);
    });

    it('should use existing id when provided', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.run.mockReturnValue({ changes: 1, lastInsertRowid: 1 });

      const existingId = uuidv4();
      const document = { id: existingId, name: 'Jane Doe', age: 25 };
      const result = await adapter.insertOne('patients', document);
      
      expect(result.insertedId).toBe(existingId);
    });

    it('should add timestamps to document', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.run.mockReturnValue({ changes: 1, lastInsertRowid: 1 });

      const document = { name: 'John Doe', age: 30 };
      await adapter.insertOne('patients', document);

      // Check that the prepared statement includes timestamp columns
      const insertCall = mockDb.prepare.mock.calls[0][0];
      expect(insertCall).toContain('createdAt');
      expect(insertCall).toContain('last_updated');
    });

    it('should serialize JSON objects correctly', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.run.mockReturnValue({ changes: 1, lastInsertRowid: 1 });

      const document = {
        name: 'John Doe',
        vitals: { temp: 98.6, bp: '120/80', hr: 72 },
        medications: ['aspirin', 'lisinopril']
      };

      await adapter.insertOne('patients', document);
      
      expect(mockStatement.run).toHaveBeenCalled();
      // Should handle complex objects by serializing them
    });
  });

  describe('findOne', () => {
    it('should find and return a document by id', async () => {
      const mockStatement = mockDb.prepare();
      const testId = uuidv4();
      const mockRow = {
        id: testId,
        name: 'John Doe',
        age: 30,
        createdAt: '2025-07-02T15:30:00.000Z'
      };
      mockStatement.get.mockReturnValue(mockRow);

      const result = await adapter.findOne('patients', { id: testId });

      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM patients WHERE id = ? LIMIT 1');
      expect(mockStatement.get).toHaveBeenCalledWith(testId);
      expect(result).toEqual(mockRow);
    });

    it('should return null when document not found', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.get.mockReturnValue(undefined);

      const result = await adapter.findOne('patients', { id: 'nonexistent' });

      expect(result).toBeNull();
    });

    it('should handle complex filter conditions', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.get.mockReturnValue(null);

      await adapter.findOne('patients', { name: 'John Doe', age: 30 });

      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM patients WHERE name = ? AND age = ? LIMIT 1');
      expect(mockStatement.get).toHaveBeenCalledWith('John Doe', 30);
    });

    it('should deserialize JSON fields in results', async () => {
      const mockStatement = mockDb.prepare();
      const mockRow = {
        id: uuidv4(),
        name: 'John Doe',
        vitals: '{"temp": 98.6, "bp": "120/80"}',
        medications: '["aspirin", "lisinopril"]'
      };
      mockStatement.get.mockReturnValue(mockRow);

      const result = await adapter.findOne('patients', { id: mockRow.id });

      // Should parse JSON strings back to objects
      expect(typeof result.vitals).toBe('object');
      expect(Array.isArray(result.medications)).toBe(true);
    });
  });

  describe('find', () => {
    it('should find and return multiple documents', async () => {
      const mockStatement = mockDb.prepare();
      const mockRows = [
        { id: uuidv4(), name: 'John Doe', age: 30 },
        { id: uuidv4(), name: 'Jane Smith', age: 25 }
      ];
      mockStatement.all.mockReturnValue(mockRows);

      const result = await adapter.find('patients', {});

      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM patients ');
      expect(mockStatement.all).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockRows);
    });

    it('should apply filter conditions', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.all.mockReturnValue([]);

      await adapter.find('patients', { age: 30 });

      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM patients WHERE age = ?');
      expect(mockStatement.all).toHaveBeenCalledWith(30);
    });

    it('should handle sort options', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.all.mockReturnValue([]);

      await adapter.find('patients', {}, { sort: { name: 1, age: -1 } });

      const query = mockDb.prepare.mock.calls[0][0];
      expect(query).toContain('ORDER BY');
      expect(query).toContain('name ASC');
      expect(query).toContain('age DESC');
    });

    it('should handle limit options', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.all.mockReturnValue([]);

      await adapter.find('patients', {}, { limit: 5 });

      const query = mockDb.prepare.mock.calls[0][0];
      expect(query).toContain('LIMIT 5');
    });

    it('should handle combined sort and limit options', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.all.mockReturnValue([]);

      await adapter.find('patients', { age: { $gt: 25 } }, { 
        sort: { createdAt: -1 }, 
        limit: 10 
      });

      const query = mockDb.prepare.mock.calls[0][0];
      expect(query).toContain('WHERE age > ?');
      expect(query).toContain('ORDER BY createdAt DESC');
      expect(query).toContain('LIMIT 10');
    });
  });

  describe('updateOne', () => {
    it('should update a document and return modification count', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.run.mockReturnValue({ changes: 1 });

      const result = await adapter.updateOne(
        'patients',
        { id: 'test-id' },
        { $set: { name: 'Updated Name', age: 31 } }
      );

      expect(result.acknowledged).toBe(true);
      expect(result.matchedCount).toBe(1);
      expect(result.modifiedCount).toBe(1);
      expect(mockStatement.run).toHaveBeenCalled();
    });

    it('should return zero counts when no document matches', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.run.mockReturnValue({ changes: 0 });

      const result = await adapter.updateOne(
        'patients',
        { id: 'nonexistent' },
        { $set: { name: 'Updated Name' } }
      );

      expect(result.matchedCount).toBe(0);
      expect(result.modifiedCount).toBe(0);
    });

    it('should handle complex update operations', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.run.mockReturnValue({ changes: 1 });

      await adapter.updateOne(
        'patients',
        { name: 'John Doe' },
        { 
          $set: { 
            age: 31,
            vitals: { temp: 99.1, bp: '125/82' },
            lastVisit: new Date().toISOString()
          }
        }
      );

      expect(mockStatement.run).toHaveBeenCalled();
      // Should handle JSON serialization in updates
    });

    it('should add last_updated timestamp to updates', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.run.mockReturnValue({ changes: 1 });

      await adapter.updateOne(
        'patients',
        { id: 'test-id' },
        { $set: { name: 'Updated Name' } }
      );

      const query = mockDb.prepare.mock.calls[0][0];
      expect(query).toContain('last_updated');
    });
  });

  describe('deleteOne', () => {
    it('should delete a document and return deletion count', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.run.mockReturnValue({ changes: 1 });

      const result = await adapter.deleteOne('patients', { id: 'test-id' });

      expect(result.acknowledged).toBe(true);
      expect(result.deletedCount).toBe(1);
      expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM patients WHERE id = ?');
      expect(mockStatement.run).toHaveBeenCalledWith('test-id');
    });

    it('should return zero count when no document matches', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.run.mockReturnValue({ changes: 0 });

      const result = await adapter.deleteOne('patients', { id: 'nonexistent' });

      expect(result.deletedCount).toBe(0);
    });

    it('should handle complex filter conditions', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.run.mockReturnValue({ changes: 1 });

      await adapter.deleteOne('patients', { name: 'John Doe', age: 30 });

      expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM patients WHERE name = ? AND age = ?');
      expect(mockStatement.run).toHaveBeenCalledWith('John Doe', 30);
    });
  });

  describe('countDocuments', () => {
    it('should count all documents when no filter provided', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.get.mockReturnValue({ count: 5 });

      const result = await adapter.countDocuments('patients');

      expect(result).toBe(5);
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM patients ');
    });

    it('should count documents matching filter', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.get.mockReturnValue({ count: 2 });

      const result = await adapter.countDocuments('patients', { age: { $gt: 25 } });

      expect(result).toBe(2);
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM patients WHERE age > ?');
      expect(mockStatement.get).toHaveBeenCalledWith(25);
    });

    it('should return 0 for empty collections', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.get.mockReturnValue({ count: 0 });

      const result = await adapter.countDocuments('patients', { status: 'archived' });

      expect(result).toBe(0);
    });
  });

  describe('MongoDB Query Operators', () => {
    it('should handle $ne (not equal) operator', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.all.mockReturnValue([]);

      await adapter.find('patients', { status: { $ne: 'archived' } });

      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM patients WHERE status != ?');
      expect(mockStatement.all).toHaveBeenCalledWith('archived');
    });

    it('should handle $in operator', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.all.mockReturnValue([]);

      await adapter.find('patients', { status: { $in: ['active', 'pending', 'review'] } });

      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM patients WHERE status IN (?, ?, ?)');
      expect(mockStatement.all).toHaveBeenCalledWith('active', 'pending', 'review');
    });

    it('should handle $gt (greater than) operator', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.all.mockReturnValue([]);

      await adapter.find('patients', { age: { $gt: 30 } });

      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM patients WHERE age > ?');
      expect(mockStatement.all).toHaveBeenCalledWith(30);
    });

    it('should handle $lt (less than) operator', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.all.mockReturnValue([]);

      await adapter.find('patients', { age: { $lt: 65 } });

      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM patients WHERE age < ?');
      expect(mockStatement.all).toHaveBeenCalledWith(65);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.run.mockImplementation(() => {
        throw new Error('Database constraint violation');
      });

      await expect(adapter.insertOne('patients', { name: 'Test' }))
        .rejects
        .toThrow('Database constraint violation');
    });

    it('should handle malformed queries', async () => {
      const mockStatement = mockDb.prepare();
      mockStatement.get.mockImplementation(() => {
        throw new Error('Malformed SQL');
      });

      await expect(adapter.findOne('patients', { invalidField: { $unknownOperator: 'value' } }))
        .rejects
        .toThrow();
    });
  });
});
