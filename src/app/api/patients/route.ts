import { NextResponse } from 'next/server';
import { PatientOperations } from '@/lib/mongodb';
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
    const patients = await PatientOperations.getPatients(); 

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
    const newPatient = await PatientOperations.createPatient(formData);
    const result = { insertedId: newPatient._id };

    // Asynchronously trigger the AI analysis
    if (process.env.VERTEX_AI_ENABLED === 'true') {
      (async () => {
        try {
          console.log(`🧠 Triggering AI analysis for patient: ${newPatient._id}`);

          const analysisInput: AnalyzePatientSymptomsInput = {
            // Map the patient data to the analysis input format
            age: newPatient.age,
            gender: newPatient.sex,
            symptoms: newPatient.symptoms, // Assuming symptoms are part of the patient data
            // Add other necessary fields...
          };

          const analysisResult = await analyzePatientSymptoms(analysisInput);
          
          // Update the patient record with the analysis
          const updates = { 
            icd_codes: analysisResult.icd_codes,
            icd_tag_summary: analysisResult.icd_tag_summary,
            summary: analysisResult.summary,
            risk_score: analysisResult.risk_score,
            status: 'processed'
          };
          await PatientOperations.updatePatient(newPatient._id.toString(), updates);
          console.log(`✅ AI analysis complete for patient: ${newPatient._id}`);
        } catch (aiError) {
          console.error('AI analysis failed for patient:', result.insertedId, aiError);
          await PatientOperations.updatePatient(result.insertedId.toString(), { status: 'analysis_failed' });
        }
      })();
    }
    
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