import { NextRequest } from 'next/server';
import { POST, GET } from '../../src/app/api/local-embeddings/route';
import { getDb } from '../../src/lib/db';
import { getEmbeddings } from '../../src/lib/embedding';

// Mock dependencies
jest.mock('../../src/lib/db');
jest.mock('../../src/lib/embedding');

// Mock collection methods that align with the IPC-based SQLite adapter
const mockCollectionMethods = {
  findOne: jest.fn(),
  insertOne: jest.fn(),
  find: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
  countDocuments: jest.fn(),
};

// Mock database adapter that returns collection methods
const mockDbAdapter = {
  collection: jest.fn().mockReturnValue(mockCollectionMethods),
};

const mockGetDb = getDb as jest.Mock;
mockGetDb.mockResolvedValue(mockDbAdapter);

const mockGetEmbeddings = getEmbeddings as jest.Mock;

describe('Local Embeddings API', () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockDbAdapter.collection.mockClear();
  });

  describe('POST /api/local-embeddings', () => {
    it('should create and store a new embedding', async () => {
      mockCollectionMethods.findOne.mockResolvedValue({ id: 'test-patient-id', name: 'Test Patient' });
      mockGetEmbeddings.mockResolvedValue([[0.1, 0.2, 0.3]]);
      mockCollectionMethods.insertOne.mockResolvedValue({ acknowledged: true, insertedId: 'new-embedding-id' });

      const req = new NextRequest('http://localhost/api/local-embeddings', {
        method: 'POST',
        body: JSON.stringify({ patient_id: 'test-patient-id', text: 'Test note' }),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body).toHaveProperty('id');
      expect(body.patient_id).toBe('test-patient-id');
      expect(mockGetDb).toHaveBeenCalledWith('local_embeddings');
      expect(mockDbAdapter.collection).toHaveBeenCalledWith('patients');
      expect(mockCollectionMethods.findOne).toHaveBeenCalledWith({ id: 'test-patient-id' });
      expect(mockGetEmbeddings).toHaveBeenCalledWith(['Test note']);
      expect(mockDbAdapter.collection).toHaveBeenCalledWith('local_embeddings');
      expect(mockCollectionMethods.insertOne).toHaveBeenCalled();
    });

    it('should return 404 if patient not found', async () => {
        mockCollectionMethods.findOne.mockResolvedValue(null);
  
        const req = new NextRequest('http://localhost/api/local-embeddings', {
          method: 'POST',
          body: JSON.stringify({ patient_id: 'non-existent-id', text: 'Test note' }),
        });
  
        const res = await POST(req);
        const body = await res.json();
  
        expect(res.status).toBe(404);
        expect(body.message).toBe('Patient not found');
      });
  });

  describe('GET /api/local-embeddings', () => {
    it('should retrieve embeddings for a patient', async () => {
        const mockEmbeddings = [
          { id: 'emb1', patient_id: 'test-patient-id', meta: {}, created_at: new Date().toISOString() },
          { id: 'emb2', patient_id: 'test-patient-id', meta: {}, created_at: new Date().toISOString() },
        ];
        mockCollectionMethods.find.mockResolvedValue(mockEmbeddings);
  
        const req = new NextRequest('http://localhost/api/local-embeddings?patient_id=test-patient-id');
  
        const res = await GET(req);
        const body = await res.json();
  
        expect(res.status).toBe(200);
        expect(body.embeddings.length).toBe(2);
        expect(body.count).toBe(2);
        expect(mockDbAdapter.collection).toHaveBeenCalledWith('local_embeddings');
        expect(mockCollectionMethods.find).toHaveBeenCalledWith({ patient_id: 'test-patient-id' });
      });

      it('should handle invalid query parameters', async () => {
        const req = new NextRequest('http://localhost/api/local-embeddings?limit=invalid');
  
        const res = await GET(req);
        const body = await res.json();
  
        expect(res.status).toBe(400);
        expect(body.message).toBe('Invalid query parameters');
      });
  });
});
