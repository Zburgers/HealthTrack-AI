import { initializeSqliteDatabase, getSqliteDatabase, closeSqliteDatabase } from '../../electron/db/sqlite-db';

async function testTask13() {
  try {
    console.log('🧪 Testing Task 13: Database Metadata Initialization');
    
    // Initialize the database
    const dbPath = await initializeSqliteDatabase();
    console.log(`✅ Database initialized at: ${dbPath}`);
    
    const db = getSqliteDatabase();
    
    // Check db_metadata table contents
    const metadata = db.prepare(`
      SELECT id, key, version, collections, initialized_at
      FROM db_metadata 
      WHERE key = 'main'
    `).all();
    
    console.log('📋 Metadata records found:', metadata.length);
    
    if (metadata.length > 0) {
      const record = metadata[0];
      console.log('🔍 Metadata record:');
      console.log(`  - ID: ${record.id} (Length: ${record.id.length})`);
      console.log(`  - Key: ${record.key}`);
      console.log(`  - Version: ${record.version}`);
      console.log(`  - Collections: ${record.collections}`);
      console.log(`  - Initialized at: ${record.initialized_at}`);
      
      // Parse collections
      const collections = JSON.parse(record.collections);
      console.log(`  - Collections array: ${collections.join(', ')}`);
      
      // UUID format check
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const isValidUUID = uuidRegex.test(record.id);
      console.log(`  - Valid UUID format: ${isValidUUID ? '✅' : '❌'}`);
    }
    
    // Test that initializing again doesn't create duplicates
    console.log('\n🔄 Testing duplicate prevention...');
    closeSqliteDatabase();
    await initializeSqliteDatabase();
    
    const metadataAfterSecondInit = db.prepare(`
      SELECT COUNT(*) as count FROM db_metadata WHERE key = 'main'
    `).get();
    
    console.log(`📊 Metadata records after second init: ${metadataAfterSecondInit.count}`);
    console.log(`✅ Duplicate prevention: ${metadataAfterSecondInit.count === 1 ? 'PASSED' : 'FAILED'}`);
    
    closeSqliteDatabase();
    console.log('\n🎉 Task 13 test completed successfully!');
    
  } catch (error) {
    console.error('❌ Task 13 test failed:', error);
  }
}

testTask13();
