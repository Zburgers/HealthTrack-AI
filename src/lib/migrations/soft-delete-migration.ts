/**
 * Database Migration Script: Add Soft Delete Support
 * 
 * This script adds the necessary indexes for soft delete functionality
 * to the patients collection in MongoDB.
 */

import { connectToDatabase } from '@/lib/mongodb';

export async function createSoftDeleteIndexes() {
  try {
    const client = await connectToDatabase();
    const db = client.db('healthtrack');
    const patientsCollection = db.collection('patients');

    // Create index on isDeleted field for efficient filtering
    const indexResult = await patientsCollection.createIndex(
      { isDeleted: 1 },
      { 
        name: 'isDeleted_index',
        background: true
      }
    );

    console.log('✅ Soft delete index created successfully:', indexResult);

    // Create compound index for active patient queries (common use case)
    const compoundIndexResult = await patientsCollection.createIndex(
      { isDeleted: 1, last_updated: -1 },
      { 
        name: 'active_patients_index',
        background: true
      }
    );

    console.log('✅ Compound index for active patients created successfully:', compoundIndexResult);

    // Verify indexes were created
    const indexes = await patientsCollection.listIndexes().toArray();
    console.log('📋 Current indexes on patients collection:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    return {
      success: true,
      indexes: [indexResult, compoundIndexResult],
      allIndexes: indexes
    };

  } catch (error) {
    console.error('❌ Failed to create soft delete indexes:', error);
    throw error;
  }
}

// Function to run the migration if called directly
export async function runSoftDeleteMigration() {
  console.log('🚀 Starting soft delete migration...');
  
  try {
    const result = await createSoftDeleteIndexes();
    console.log('✅ Migration completed successfully');
    return result;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Allow script to be run directly
if (require.main === module) {
  runSoftDeleteMigration()
    .then(() => {
      console.log('🎉 Database migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}
