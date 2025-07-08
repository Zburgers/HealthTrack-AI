import { NextResponse } from 'next/server';
import { getDb, isElectronEnvironment } from '@/lib/db';

export async function GET() {
  try {
    const isElectron = isElectronEnvironment();
    console.log(`🧪 [DB_TEST] Starting database test in ${isElectron ? 'Electron' : 'Web'} environment`);

    if (!isElectron) {
      return NextResponse.json({
        success: false,
        message: 'Database test is only available in Electron environment',
        environment: 'web'
      });
    }

    // Test basic SQLite operations
    const db = await getDb('patients');
    const patientsCollection = db.collection('patients');

    // Test 1: Count documents
    console.log('🧪 [DB_TEST] Testing countDocuments...');
    const totalCount = await patientsCollection.countDocuments({});
    console.log(`✅ [DB_TEST] Total patients: ${totalCount}`);

    // Test 2: Find all patients
    console.log('🧪 [DB_TEST] Testing find...');
    const allPatients = await patientsCollection.find({});
    console.log(`✅ [DB_TEST] Found ${allPatients.length} patients`);

    // Test 3: Insert a test patient
    console.log('🧪 [DB_TEST] Testing insertOne...');
    const testPatient = {
      name: `Test Patient ${Date.now()}`,
      age: 30,
      sex: 'Other',
      primary_complaint: 'Database connectivity test',
      vitals: { temperature: 98.6 },
      status: 'draft'
    };

    const insertResult = await patientsCollection.insertOne(testPatient);
    console.log(`✅ [DB_TEST] Insert result:`, insertResult);

    // Test 4: Find the inserted patient
    console.log('🧪 [DB_TEST] Testing findOne...');
    const foundPatient = await patientsCollection.findOne({ id: insertResult.insertedId });
    console.log(`✅ [DB_TEST] Found patient:`, foundPatient);

    // Test 5: Update the patient
    console.log('🧪 [DB_TEST] Testing updateOne...');
    const updateResult = await patientsCollection.updateOne(
      { id: insertResult.insertedId },
      { $set: { primary_complaint: 'Updated: Database test completed' } }
    );
    console.log(`✅ [DB_TEST] Update result:`, updateResult);

    // Test 6: Delete the test patient (cleanup)
    console.log('🧪 [DB_TEST] Testing deleteOne (cleanup)...');
    const deleteResult = await patientsCollection.deleteOne({ id: insertResult.insertedId });
    console.log(`✅ [DB_TEST] Delete result:`, deleteResult);

    const finalCount = await patientsCollection.countDocuments({});

    return NextResponse.json({
      success: true,
      message: 'All database tests passed successfully!',
      tests: {
        countDocuments: { success: true, totalCount, finalCount },
        find: { success: true, foundCount: allPatients.length },
        insertOne: { success: true, insertedId: insertResult.insertedId },
        findOne: { success: true, found: !!foundPatient },
        updateOne: { success: true, modifiedCount: updateResult.modifiedCount },
        deleteOne: { success: true, deletedCount: deleteResult.deletedCount }
      },
      environment: 'electron',
      database: 'sqlite'
    });

  } catch (error) {
    console.error('❌ [DB_TEST] Database test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: isElectronEnvironment() ? 'electron' : 'web'
    }, { status: 500 });
  }
}
