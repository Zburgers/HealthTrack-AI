import { getDb, isElectronEnvironment, isLocalCollection } from './index';

describe('Database Bridge', () => {
  describe('Environment Detection', () => {
    it('should always return false for Electron environment in web-only mode', () => {
      expect(isElectronEnvironment()).toBe(false);
    });
  });

  describe('Collection Routing', () => {
    it('should identify all collections as remote in web architecture', () => {
      expect(isLocalCollection('patients')).toBe(false);
      expect(isLocalCollection('notes')).toBe(false);
      expect(isLocalCollection('ai_cache')).toBe(false);
      expect(isLocalCollection('case_embeddings')).toBe(false);
    });
  });

  describe('Database Access', () => {
    it('should return a db object with collection method', () => {
      const db = getDb();
      expect(db).toHaveProperty('collection');
      expect(db).toHaveProperty('findSimilarCases');
    });
  });
});
