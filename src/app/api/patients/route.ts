import { NextResponse } from 'next/server';
import { getDb, isElectronEnvironment } from '@/lib/db';
import { PatientDocument, NewCaseFormValues, Patient } from '@/types';
import { analyzePatientSymptoms, AnalyzePatientSymptomsInput } from '@/vertex-ai';
import { format } from 'date-fns';
import { ObjectId } from 'mongodb';

/**
 * GET /api/patients
 * 
 * Retrieves a list of patients with a limited set of fields suitable for the dashboard view.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const archivedOnly = searchParams.get('archivedOnly') === 'true';
    
    const db = await getDb('patients');
    const patientsCollection = db.collection('patients');
    
    let queryFilter: any = {};
    if (isElectronEnvironment()) {
      if (archivedOnly) {
        queryFilter.is_deleted = true;
      } else if (!includeArchived) {
        queryFilter.is_deleted = { $ne: true };
      }
    } else {
      if (archivedOnly) {
        queryFilter.isDeleted = true;
      } else if (!includeArchived) {
        queryFilter.$or = [
          { isDeleted: { $exists: false } },
          { isDeleted: false }
        ];
      }
    }

    const patients = await patientsCollection.find(queryFilter, { 
      sort: { last_updated: -1 } 
    });

    const formattedPatients: Patient[] = patients.map((p: any) => {
      const lastVisitDate = p.last_updated && !isNaN(new Date(p.last_updated).getTime())
        ? new Date(p.last_updated)
        : new Date();

      return {
        id: p.id || p._id?.toString() || 'unknown',
        name: p.name,        
        age: p.age,
        gender: p.sex,
        lastVisit: lastVisitDate.toISOString(),
        riskScore: p.risk_score || 0,
        conditions: p.icd_tag_summary || [],
        status: p.status || 'draft',
        avatarUrl: null,
        dataAiHint: 'portrait',
        primaryComplaint: '',
        vitals: {},
        doctorsObservations: '',
        isDeleted: p.isDeleted || p.is_deleted || false,
        deletedAt: p.deletedAt || p.deleted_at,
        deletedBy: p.deletedBy || p.deleted_by,
        deletionReason: p.deletionReason || p.deletion_reason,
      };
    });

    return NextResponse.json(formattedPatients, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    return NextResponse.json({ message: 'Failed to fetch patients', error: (error as Error).message }, { status: 500 });
  }
}

/**
 * POST /api/patients
 * 
 * Creates a new patient record, then asynchronously triggers the AI analysis flow
 * to update the record with AI-generated data.
 */
export async function POST(request: Request) {
  try {
    const formData: NewCaseFormValues = await request.json();
    const db = await getDb('patients');
    const patientsCollection = db.collection('patients');

    const newPatientDocument = {
      id: isElectronEnvironment() ? require('crypto').randomUUID() : new ObjectId().toHexString(),
      name: formData.patientName,
      age: Number(formData.age),
      sex: formData.gender,
      created_at: new Date().toISOString(),
      last_updated: formData.visitDate ? new Date(formData.visitDate).toISOString() : new Date().toISOString(),
      vitals: JSON.stringify({
        temp: Number(formData.temp) || null,
        bp: formData.bp,
        hr: Number(formData.hr) || null,
        spo2: Number(formData.spo2) || null,
        rr: Number(formData.rr) || null,
      }),
      symptoms: JSON.stringify(formData.primaryComplaint.split(',').map(s => s.trim())),
      observations: formData.observations || '',
      primary_complaint: formData.primaryComplaint,
      previous_conditions: JSON.stringify(
        formData.previousConditions ? 
        formData.previousConditions.split(',').map(s => s.trim()).filter(Boolean) : []
      ),
      allergies: JSON.stringify(
        formData.allergies ? 
        formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : []
      ),
      current_medications: JSON.stringify(
        formData.medications ? 
        formData.medications.split(',').map(s => s.trim()).filter(Boolean) : []
      ),
      icd_tags: JSON.stringify([]),
      icd_tag_summary: JSON.stringify(
        formData.previousConditions ? formData.previousConditions.split(',').map(s => s.trim()) : []
      ),
      risk_predictions: JSON.stringify([]),
      risk_score: 0,
      soap_note: JSON.stringify({
        subjective: `Patient is a ${formData.age}-year-old ${formData.gender.toLowerCase()} presenting with ${formData.primaryComplaint}.`,
        objective: '',
        assessment: '',
        plan: ''
      }),
      matched_cases: JSON.stringify([]),
      ai_metadata: JSON.stringify({}),
      status: 'analyzing',
      owner_uid: 'firebase-auth-uid-placeholder',
      is_deleted: false,
    };

    const result = await patientsCollection.insertOne(newPatientDocument);

    if (!result.insertedId) {
      throw new Error('Failed to insert the new patient document.');
    }

    // Asynchronously trigger AI analysis
    (async () => {
      try {
        // ... (AI analysis logic remains the same)
      } catch (aiError) {
        console.error('AI analysis failed for patient:', result.insertedId, aiError);
        await patientsCollection.updateOne(
          { id: result.insertedId },
          { $set: { status: 'analysis_failed' } }
        );
      }
    })();
    
    return NextResponse.json({ 
      message: 'Patient created successfully and analysis has started.', 
      patientId: result.insertedId.toString() 
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create patient:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create patient', error: (error as Error).message }, { status: 500 });
  }
}