/**
 * Debug Database Collections Script
 * Run this to directly test the database and see what collections exist
 */

const { MongoClient } = require('mongodb');
const path = require('path');
const os = require('os');

async function debugDatabase() {
  let client;
  
  try {
    console.log('🔍 Database Debug Script');
    console.log('=========================');
    
    // Try to connect to the local database
    const localUri = 'mongodb://localhost:27018/healthtrack_local';
    console.log('🔌 Connecting to:', localUri);
    
    client = new MongoClient(localUri, {
      serverSelectionTimeoutMS: 3000,
    });
    
    await client.connect();
    console.log('✅ Connected successfully');
    
    const db = client.db('healthtrack_local');
    
    // List all collections
    console.log('\n📋 Listing all collections...');
    const collections = await db.listCollections().toArray();
    console.log('Found collections:', collections.map(c => c.name));
    
    // Count documents in each collection
    console.log('\n🔢 Counting documents...');
    for (const collection of collections) {
      try {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`  ${collection.name}: ${count} documents`);
        
        // Show a sample document if any exist
        if (count > 0) {
          const sample = await db.collection(collection.name).findOne();
          console.log(`    Sample: ${JSON.stringify(sample, null, 2).substring(0, 200)}...`);
        }
      } catch (error) {
        console.log(`  ${collection.name}: Error counting - ${error.message}`);
      }
    }
    
    // Test the expected collections
    console.log('\n🎯 Testing expected collections...');
    const expectedCollections = ['patients', 'ai_cache', 'notes', 'local_embeddings', 'db_metadata'];
    
    for (const collectionName of expectedCollections) {
      try {
        const exists = collections.some(c => c.name === collectionName);
        const count = exists ? await db.collection(collectionName).countDocuments() : 0;
        console.log(`  ${collectionName}: ${exists ? 'EXISTS' : 'MISSING'} (${count} docs)`);
      } catch (error) {
        console.log(`  ${collectionName}: ERROR - ${error.message}`);
      }
    }
    
    // Test database stats
    console.log('\n📊 Database stats...');
    try {
      const stats = await db.stats();
      console.log('  Collections:', stats.collections);
      console.log('  Data size:', (stats.dataSize / 1024 / 1024).toFixed(2), 'MB');
      console.log('  Storage size:', (stats.storageSize / 1024 / 1024).toFixed(2), 'MB');
      console.log('  Objects:', stats.objects);
    } catch (error) {
      console.log('  Error getting stats:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('   - MongoDB server not running (port 27018)');
    console.log('   - Database not initialized');
    console.log('   - Connection string incorrect');
    console.log('   - Firewall blocking connection');
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔒 Connection closed');
    }
  }
}

// Run the debug script
debugDatabase().catch(console.error);
