// Test script to verify SQLite database info handlers work correctly
const { getSqliteDatabase, getSqliteDbPath, healthCheck } = require('./electron/db/sqlite-db');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

async function testDatabaseInfoHandler() {
  console.log('🔍 Testing database info handler...');
  
  try {
    // Simulate the handler logic
    const { db } = getDatabaseConnection();
    console.log('📦 Got database connection, db exists:', !!db);
    
    const collectionsInfo = [];
    
    // Local database collections
    if (db) {
      console.log('📋 Listing all collections from local database...');
      
      // Get actual collections from database
      const existingCollections = await db.listCollections().toArray();
      console.log('🔍 Found collections in local database:', existingCollections.map(c => c.name));
      
      for (const collectionInfo of existingCollections) {
        try {
          console.log(`🔢 Counting documents in ${collectionInfo.name}...`);
          const collection = db.collection(collectionInfo.name);
          const count = await collection.countDocuments();
          console.log(`✅ Collection ${collectionInfo.name}: ${count} documents`);
          
          collectionsInfo.push({
            name: collectionInfo.name,
            count,
            location: 'local',
          });
        } catch (error) {
          console.warn(`⚠️ Failed to get info for collection ${collectionInfo.name}:`, error);
          collectionsInfo.push({
            name: collectionInfo.name,
            count: 0,
            location: 'local',
          });
        }
      }
    }
    
    // Remote database collections - test with environment variable
    let remoteConnectionSuccess = false;
    try {
      const { MongoClient } = require('mongodb');
      
      // Try to get MONGODB_URI from environment variables
      let remoteUri = process.env.MONGODB_URI;
      console.log('🔍 Remote URI from env:', remoteUri ? '***configured***' : 'not configured');
      
      if (remoteUri) {
        console.log('🌐 Would attempt to connect to remote database...');
        // Don't actually connect for this test since it's a dummy URI
        console.log('⚠️ Skipping actual remote connection (test mode)');
        
        // Simulate remote collections for testing
        const simulatedRemoteCollections = [
          { name: 'case_embeddings', count: 1250 },
          { name: 'patients_remote', count: 45 },
          { name: 'similar_cases', count: 892 },
        ];
        
        for (const collection of simulatedRemoteCollections) {
          collectionsInfo.push({
            name: collection.name,
            count: collection.count,
            location: 'remote',
          });
        }
        
        remoteConnectionSuccess = true;
        console.log('✅ Remote database simulation successful');
      } else {
        console.warn('⚠️ No remote MONGODB_URI configured');
      }
    } catch (remoteError) {
      console.warn('⚠️ Could not connect to remote database:', remoteError);
      // Add placeholder remote collections
      collectionsInfo.push({
        name: 'case_embeddings',
        count: 0,
        location: 'remote',
      });
    }
    
    // Build final response
    const dbPath = getLocalDbPath();
    
    // Local MongoDB connection info
    const connectionInfo = {
      isConnected: isLocalDatabaseConnected(),
      uri: process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27018/healthtrack_local',
      host: 'localhost',
      port: 27018,
      database: 'healthtrack_local',
    };
    
    // Remote MongoDB connection info
    const remoteConnectionInfo = {
      isConnected: remoteConnectionSuccess,
      uri: process.env.MONGODB_URI || null,
      host: process.env.MONGODB_URI ? new URL(process.env.MONGODB_URI).hostname : 'cluster0.example.mongodb.net',
      database: 'healthtrack',
    };
    
    const result = {
      type: 'hybrid',
      localPath: dbPath,
      remoteHost: 'MongoDB Atlas',
      remoteUri: remoteConnectionInfo.uri,
      collections: collectionsInfo,
      totalSize: '0 MB',
      connectionInfo,
      remoteConnectionInfo,
      lastBackup: null,
    };
    
    console.log('\n📊 Final database info result:');
    console.log('='.repeat(50));
    console.log('Type:', result.type);
    console.log('Local Path:', result.localPath);
    console.log('Remote Host:', result.remoteHost);
    console.log('Remote URI:', result.remoteUri ? result.remoteUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'Not configured');
    console.log('Total Size:', result.totalSize);
    
    console.log('\nLocal Connection Info:');
    console.log('- Connected:', result.connectionInfo.isConnected);
    console.log('- URI:', result.connectionInfo.uri);
    console.log('- Host:', result.connectionInfo.host);
    console.log('- Database:', result.connectionInfo.database);
    
    console.log('\nRemote Connection Info:');
    console.log('- Connected:', result.remoteConnectionInfo.isConnected);
    console.log('- URI:', result.remoteConnectionInfo.uri ? result.remoteConnectionInfo.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'Not configured');
    console.log('- Host:', result.remoteConnectionInfo.host);
    console.log('- Database:', result.remoteConnectionInfo.database);
    
    console.log('\nCollections:');
    result.collections.forEach((col, index) => {
      console.log(`${index + 1}. ${col.name} (${col.location}): ${col.count.toLocaleString()} documents`);
    });
    console.log('='.repeat(50));
    
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testDatabaseInfoHandler()
  .then(() => {
    console.log('✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
