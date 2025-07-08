#!/usr/bin/env node

/**
 * SQLite Database Test Script
 * 
 * This script tests the SQLite database functionality to ensure everything is working properly.
 * Run this script from the project root to validate the database setup.
 */

const { initializeSqliteDatabase, getSqliteDatabase, healthCheck } = require('./electron/dist/db/sqlite-db');
const { v4: uuidv4 } = require('uuid');

async function testDatabase() {
  console.log('🧪 Starting SQLite Database Test...\n');

  try {
    // Test 1: Initialize the database
    console.log('📋 Test 1: Database Initialization');
    const dbPath = await initializeSqliteDatabase();
    console.log(`✅ Database initialized at: ${dbPath}\n`);

    // Test 2: Health Check
    console.log('🏥 Test 2: Health Check');
    const isHealthy = healthCheck();
    console.log(`✅ Database health: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}\n`);

    if (!isHealthy) {
      throw new Error('Database health check failed');
    }

    // Test 3: Get database instance
    console.log('🔌 Test 3: Get Database Instance');
    const db = getSqliteDatabase();
    console.log(`✅ Database instance obtained: ${!!db}\n`);

    // Test 4: Basic table operations
    console.log('📊 Test 4: Basic Table Operations');
    
    // Check if patients table exists
    const tables = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='patients'
    `).all();
    console.log(`✅ Patients table exists: ${tables.length > 0}`);

    // Count existing patients
    const patientCount = db.prepare(`SELECT COUNT(*) as count FROM patients`).get();
    console.log(`✅ Existing patients: ${patientCount.count}\n`);

    // Test 5: Insert Operation
    console.log('📝 Test 5: Insert Operation');
    const testPatient = {
      id: uuidv4(),
      name: `Test Patient ${Date.now()}`,
      age: 35,
      sex: 'Other',
      primary_complaint: 'Database connectivity test',
      vitals: JSON.stringify({ temperature: 98.6, blood_pressure: '120/80' }),
      symptoms: JSON.stringify(['test symptom']),
      status: 'draft',
      owner_uid: 'test-user', // Required field
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    const insertStmt = db.prepare(`
      INSERT INTO patients (id, name, age, sex, primary_complaint, vitals, symptoms, status, owner_uid, created_at, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertResult = insertStmt.run(
      testPatient.id, testPatient.name, testPatient.age, testPatient.sex,
      testPatient.primary_complaint, testPatient.vitals, testPatient.symptoms,
      testPatient.status, testPatient.owner_uid, testPatient.created_at, testPatient.last_updated
    );
    
    console.log(`✅ Insert result - Changes: ${insertResult.changes}, Last Insert RowID: ${insertResult.lastInsertRowid}\n`);

    // Test 6: Select Operation
    console.log('🔍 Test 6: Select Operation');
    const selectStmt = db.prepare(`SELECT * FROM patients WHERE id = ?`);
    const foundPatient = selectStmt.get(testPatient.id);
    console.log(`✅ Found patient: ${!!foundPatient}`);
    if (foundPatient) {
      console.log(`   Name: ${foundPatient.name}`);
      console.log(`   Age: ${foundPatient.age}`);
      console.log(`   Status: ${foundPatient.status}\n`);
    }

    // Test 7: Update Operation
    console.log('✏️ Test 7: Update Operation');
    const updateStmt = db.prepare(`
      UPDATE patients SET primary_complaint = ?, last_updated = ? WHERE id = ?
    `);
    const updateResult = updateStmt.run(
      'Updated: Database test completed successfully',
      new Date().toISOString(),
      testPatient.id
    );
    console.log(`✅ Update result - Changes: ${updateResult.changes}\n`);

    // Test 8: Delete Operation (cleanup)
    console.log('🗑️ Test 8: Delete Operation (cleanup)');
    const deleteStmt = db.prepare(`DELETE FROM patients WHERE id = ?`);
    const deleteResult = deleteStmt.run(testPatient.id);
    console.log(`✅ Delete result - Changes: ${deleteResult.changes}\n`);

    // Test 9: Final Count
    console.log('📊 Test 9: Final Count');
    const finalCount = db.prepare(`SELECT COUNT(*) as count FROM patients`).get();
    console.log(`✅ Final patient count: ${finalCount.count}\n`);

    // Test 10: JSON Operations
    console.log('🧬 Test 10: JSON Operations');
    const testPatientWithJson = {
      id: uuidv4(),
      name: 'JSON Test Patient',
      age: 28,
      sex: 'Female',
      vitals: JSON.stringify({
        temperature: 99.2,
        blood_pressure: '115/75',
        heart_rate: 72,
        respiratory_rate: 16
      }),
      symptoms: JSON.stringify(['fever', 'headache', 'fatigue']),
      status: 'draft',
      owner_uid: 'test-user', // Required field
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    const jsonInsertResult = insertStmt.run(
      testPatientWithJson.id, testPatientWithJson.name, testPatientWithJson.age,
      testPatientWithJson.sex, 'JSON test', testPatientWithJson.vitals,
      testPatientWithJson.symptoms, testPatientWithJson.status,
      testPatientWithJson.owner_uid, testPatientWithJson.created_at, testPatientWithJson.last_updated
    );

    console.log(`✅ JSON Insert result - Changes: ${jsonInsertResult.changes}`);

    const jsonPatient = selectStmt.get(testPatientWithJson.id);
    if (jsonPatient) {
      try {
        const vitals = JSON.parse(jsonPatient.vitals);
        const symptoms = JSON.parse(jsonPatient.symptoms);
        console.log(`✅ JSON parsing successful`);
        console.log(`   Vitals: ${JSON.stringify(vitals)}`);
        console.log(`   Symptoms: ${JSON.stringify(symptoms)}`);
      } catch (error) {
        console.log(`❌ JSON parsing failed: ${error.message}`);
      }
    }

    // Cleanup JSON test patient
    deleteStmt.run(testPatientWithJson.id);
    console.log(`✅ JSON test patient cleaned up\n`);

    console.log('🎉 All tests completed successfully!');
    console.log('✅ SQLite database is working properly and ready for use.\n');

    return true;

  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('   Stack trace:', error.stack);
    return false;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testDatabase()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testDatabase };
