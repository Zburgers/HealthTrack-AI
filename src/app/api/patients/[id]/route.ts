import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Patient, PatientDocument } from '@/types';
import { ObjectId } from 'mongodb';

// Explicitly mark this route as dynamic to prevent static analysis errors.
export const dynamic = 'force-dynamic';

/**
 * GET /api/patients/[id]
 * 
 * Retrieves the full document for a single patient by their MongoDB ObjectId.
 * This version uses a different context signature to avoid Next.js build errors.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  // params is now expected to be a Promise for dynamic routes.
  const params = await context.params;
  const id = params.id;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ message: 'Patient ID must be a non-empty string.' }, { status: 400 });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('healthtrack');
    const patientsCollection = db.collection<PatientDocument>('patients');

    let patient: PatientDocument | null = null;

    if (ObjectId.isValid(id)) {
      const objectIdToQuery = new ObjectId(id);
      patient = await patientsCollection.findOne({ _id: objectIdToQuery });
    } else {
      // If not a valid ObjectId string, try to find by the string ID directly.
      // This assumes the _id field in the database might store plain strings for some documents.
      // Note: PatientDocument defines _id as ObjectId, so this query uses 'as any'
      // to bypass strict type checking for the query filter if id is a plain string.
      patient = await patientsCollection.findOne({ _id: id as any });
    }

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    // Safely handle the lastVisit date with a fallback
    const lastVisitDate = patient.last_updated && !isNaN(new Date(patient.last_updated).getTime())
        ? new Date(patient.last_updated)
        : new Date();

    // Safely format the SOAP note with fallbacks
    const formatSoapNote = (soap: PatientDocument['soap_note']) => {
      if (!soap) return '';
      const parts = [
        soap.subjective,
        soap.objective,
        soap.assessment,
        soap.plan,
      ];
      return parts.filter(Boolean).join(' ');
    };    // Robustly map the MongoDB document to the frontend Patient type
    const formattedPatient: Patient = {
      // Ensure patient._id is converted to string regardless of its original type (ObjectId or string)
      id: patient._id.toString(),
      name: patient.name || 'Unknown Patient',
      age: patient.age || 0,
      gender: patient.sex || 'N/A',
      lastVisit: lastVisitDate.toISOString(),
      riskScore: patient.risk_score || 0,
      conditions: patient.icd_tag_summary || [],
      primaryComplaint: patient.primary_complaint || patient.symptoms?.join(', ') || 'No symptoms recorded.',
      vitals: {
        bp: patient.vitals?.bp || 'N/A',
        hr: patient.vitals?.hr?.toString() || 'N/A',
        rr: patient.vitals?.rr?.toString() || 'N/A',
        temp: patient.vitals?.temp?.toString() || 'N/A',
        spo2: patient.vitals?.spo2?.toString() || 'N/A',
      },
      doctorsObservations: patient.observations || 'No observations recorded.',
      // Medical History Fields
      previousConditions: patient.previous_conditions || [],
      allergies: patient.allergies || [],
      medications: patient.current_medications || [],
      status: patient.status || 'draft',
      aiSoapNotes: patient.ai_soap_notes, // Include AI SOAP notes
      notes: patient.observations || 'No observations recorded.', // Use observations as notes
      // Enhanced Medical History Analysis
      medicalHistoryAnalysis: patient.medical_history_analysis ? {
        allergyWarnings: patient.medical_history_analysis.allergy_warnings || [],
        medicationInteractions: patient.medical_history_analysis.medication_interactions || [],
        previousConditionsImpact: patient.medical_history_analysis.previous_conditions_impact || [],
      } : undefined,
      aiAnalysis: patient.status === 'complete' ? {
        icd10Tags: (patient.icd_tags || []).map(tag => ({
          code: tag.code || 'N/A',
          description: tag.label || 'No description',
        })),
        riskScore: patient.risk_score || 0,
        soapNotes: formatSoapNote(patient.soap_note),
      } : undefined,
      avatarUrl: 'https://placehold.co/100x100.png',
      dataAiHint: 'portrait',
    };

    return NextResponse.json(formattedPatient, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch patient with id ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch patient', error: (error as Error).message }, { status: 500 });
  }
}

/**
 * PATCH /api/patients/[id]
 * 
 * Updates specific fields of a patient record, particularly for saving AI SOAP notes.
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  // Await params for dynamic routes
  const params = await context.params;
  const id = params.id;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ message: 'Patient ID must be a non-empty string.' }, { status: 400 });
  }  try {
    const updateData = await request.json();
    console.log('PATCH request received for patient:', id, 'Data:', updateData);

    const client = await connectToDatabase();
    const db = client.db('healthtrack');
    const patientsCollection = db.collection<PatientDocument>('patients');    // Handle both ObjectId and string-based patient IDs
    let queryFilter: any;
    
    if (ObjectId.isValid(id)) {
      queryFilter = { _id: new ObjectId(id) };
    } else {
      // For string-based IDs like "patient-003"
      queryFilter = { _id: id };
    }

    // Prepare update operations
    const updateFields: any = {
      last_updated: new Date()
    };

    // Handle AI SOAP Notes update
    if (updateData.aiSoapNotes) {
      if (typeof updateData.aiSoapNotes !== 'string') {
        return NextResponse.json({ message: 'aiSoapNotes must be a non-empty string' }, { status: 400 });
      }

      // Validate SOAP format - support both traditional (S:, O:, A:, P:) and structured (<s>, <o>, <a>, <p>) formats
      const soapNotes = updateData.aiSoapNotes.trim();
      const hasTraditionalFormat = soapNotes.includes('S:') && soapNotes.includes('O:') && 
                                  soapNotes.includes('A:') && soapNotes.includes('P:');
      const hasStructuredFormat = soapNotes.includes('<s>') && soapNotes.includes('<o>') && 
                                 soapNotes.includes('<a>') && soapNotes.includes('<p>');
      
      if (!hasTraditionalFormat && !hasStructuredFormat) {
        return NextResponse.json({ 
          message: 'Invalid SOAP format. Notes must contain either S:, O:, A:, P: sections or <s>, <o>, <a>, <p> structured format.' 
        }, { status: 400 });
      }

      updateFields.ai_soap_notes = soapNotes;
    }

    // Handle Medical History updates
    if (updateData.previousConditions !== undefined) {
      updateFields.previous_conditions = Array.isArray(updateData.previousConditions) 
        ? updateData.previousConditions 
        : updateData.previousConditions.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    if (updateData.allergies !== undefined) {
      updateFields.allergies = Array.isArray(updateData.allergies) 
        ? updateData.allergies 
        : updateData.allergies.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    if (updateData.medications !== undefined) {
      updateFields.current_medications = Array.isArray(updateData.medications) 
        ? updateData.medications 
        : updateData.medications.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    // Handle Primary Complaint update
    if (updateData.primaryComplaint !== undefined) {
      updateFields.primary_complaint = updateData.primaryComplaint;
    }    // Validate that no update fields provided
    if (Object.keys(updateFields).length === 1) { // Only last_updated
      return NextResponse.json({ message: 'No valid fields provided for update' }, { status: 400 });
    }

    // Update the patient record
    const result = await patientsCollection.updateOne(
      queryFilter,
      { 
        $set: updateFields
      }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'No changes made to patient record' }, { status: 200 });
    }    console.log('Successfully updated patient with fields:', Object.keys(updateFields).filter(key => key !== 'last_updated'));
    return NextResponse.json({ 
      message: 'Patient updated successfully',
      updatedFields: Object.keys(updateFields).filter(key => key !== 'last_updated'),
      patientId: id 
    }, { status: 200 });

  } catch (error) {
    console.error(`Failed to update patient with id ${id}:`, error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update patient', error: (error as Error).message }, { status: 500 });
  }
}
