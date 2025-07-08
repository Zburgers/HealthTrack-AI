import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    // For export, we don't specify a collection since we're exporting multiple
    const db = await getDb();
    
    const exportData: any = {};
    
    // Export available collections (web environment has limited access)
    const collections = ['patients'];
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const documents = await collection.find({});
          // Remove sensitive fields and convert ObjectIds to strings
        exportData[collectionName] = documents.map((doc: any) => ({
          ...doc,
          _id: doc._id.toString(),
          // Remove or anonymize sensitive fields
          owner_uid: 'anonymized'
        }));
      } catch (error) {
        console.error(`Failed to export collection ${collectionName}:`, error);
        exportData[collectionName] = [];
      }
    }
    
    // Add metadata
    exportData._metadata = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      application: 'HealthTrack AI (Web)',
      note: 'This export only includes data accessible in web environment'
    };
    
    // Return as downloadable JSON
    const jsonData = JSON.stringify(exportData, null, 2);
    
    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="healthtrack-web-export-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  } catch (error) {
    console.error('Export failed:', error);
    return NextResponse.json(
      { error: 'Failed to export database' },
      { status: 500 }
    );
  }
}
