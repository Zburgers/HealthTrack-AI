import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Patient, PatientDocument } from '@/types';
import { SimilarCaseOutput } from '@/types/similar-cases';
import { 
  formatToTraditionalFormat, 
  isValidSOAPFormat, 
  parseSOAPNotes,
  createStructuredSoapNotes,
  getSoapValidationSummary 
} from '@/lib/soap-parser';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

// Explicitly mark this route as dynamic to prevent static analysis errors.
export const dynamic = 'force-dynamic';

// Validation schema for delete request body
const DeleteRequestSchema = z.object({
  deletionReason: z.string().min(10, "Deletion reason must be at least 10 characters")
});

/**
 * Helper function to validate request and get patient ID
 */
async function validatePatientRequest(params: Promise<{ id: string }>) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  if (!id || typeof id !== 'string') {
    return { error: NextResponse.json({ message: 'Patient ID must be a non-empty string.' }, { status: 400 }) };
  }

  return { id, error: null };
}

/**
 * Helper function to find patient by ID
 */
async function findPatientById(patientsCollection: any, id: string) {
  let patient: PatientDocument | null = null;

  if (ObjectId.isValid(id)) {
    const objectIdToQuery = new ObjectId(id);
    patient = await patientsCollection.findOne({ _id: objectIdToQuery });
  } else {
    patient = await patientsCollection.findOne({ _id: id as any });
  }

  return patient;
}

/**
 * GET /api/patients/[id]
 * 
 * Retrieves the full document for a single patient by their MongoDB ObjectId.
 * This version uses a different context signature to avoid Next.js build errors.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const validation = await validatePatientRequest(context.params);
  if (validation.error) return validation.error;
  const { id } = validation;

  try {
    const client = await connectToDatabase();
    const db = client.db('healthtrack');
    const patientsCollection = db.collection<PatientDocument>('patients');

    const patient = await findPatientById(patientsCollection, id);

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    // Check if patient is soft deleted
    if (patient.isDeleted) {
      return NextResponse.json({ message: 'Patient has been archived' }, { status: 410 });
    }    // Safely handle the lastVisit date with a fallback
    const lastVisitDate = patient.last_updated && !isNaN(new Date(patient.last_updated).getTime())
        ? new Date(patient.last_updated)
        : new Date();    // Helper function using the SOAP parser utility
    const formatSoapNote = (soap: PatientDocument['soap_note']) => {
      if (!soap) return '';
      
      // Use the utility's createStructuredSoapNotes for consistent formatting
      const structuredSoap = createStructuredSoapNotes({
        subjective: soap.subjective || '',
        objective: soap.objective || '',
        assessment: soap.assessment || '',
        plan: soap.plan || ''
      });
      
      return formatToTraditionalFormat(structuredSoap);
    };// Robustly map the MongoDB document to the frontend Patient type
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
      } : undefined,      aiAnalysis: patient.status === 'complete' ? {
        // Use the formatted soap note as summary since ai_metadata.summary is empty
        summary: formatSoapNote(patient.soap_note) || patient.ai_metadata?.summary || 'AI analysis completed but no summary available.',
        icd10Tags: (patient.icd_tags || []).map(tag => ({
          code: tag.code || 'N/A',
          description: tag.label || 'No description',
        })),
        differentialDiagnosis: (patient.risk_predictions || []).map(pred => ({
          condition: pred.condition,
          likelihood: `${pred.confidence}%`
        })),
        recommendedTests: patient.ai_metadata?.recommended_tests || [],
        treatmentSuggestions: patient.ai_metadata?.treatment_suggestions || [],
        riskScore: patient.risk_score || 0,        // Use ai_soap_notes if available, otherwise try to get structured SOAP from soap_note
        soapNotes: patient.ai_soap_notes || formatSoapNote(patient.soap_note) || '',
        similarCases: (patient.matched_cases || []).map(matchedCase => ({
          id: matchedCase.case_id || '',
          matchConfidence: matchedCase.similarity_score || 0,
          age: 0, // Not available in matched_cases, would need to be fetched separately
          sex: '', // Not available in matched_cases, would need to be fetched separately
          hadm_id: 0, // Not available in matched_cases, would need to be fetched separately
          subject_id: 0, // Not available in matched_cases, would need to be fetched separately
          icd: [], // Not available in matched_cases, would need to be fetched separately
          icd_label: matchedCase.diagnosis ? [matchedCase.diagnosis] : [],
          note: matchedCase.summary || '',
          vitals: undefined,
          outcomes: undefined,
          treatments: undefined,
          diagnostics: undefined,
          metadata: undefined
        }))
      } : undefined,
      avatarUrl: null, // Let the frontend handle the fallback
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
  const validation = await validatePatientRequest(context.params);
  if (validation.error) return validation.error;
  const { id } = validation;

  try {
    const updateData = await request.json();
    console.log('PATCH request received for patient:', id, 'Data:', updateData);

    const client = await connectToDatabase();
    const db = client.db('healthtrack');
    const patientsCollection = db.collection<PatientDocument>('patients');

    // Handle both ObjectId and string-based patient IDs
    let queryFilter: any;
    
    if (ObjectId.isValid(id)) {
      queryFilter = { _id: new ObjectId(id) };
    } else {
      // For string-based IDs like "patient-003"
      queryFilter = { _id: id };
    }

    // Add soft delete check to query filter
    queryFilter.isDeleted = { $ne: true };

    // Prepare update operations
    const updateFields: any = {
      last_updated: new Date()
    };

    // Handle AI SOAP Notes update
    if (updateData.aiSoapNotes) {
      if (typeof updateData.aiSoapNotes !== 'string') {
        return NextResponse.json({ message: 'aiSoapNotes must be a non-empty string' }, { status: 400 });
      }      // Validate SOAP format using the utility parser with enhanced validation
      const soapNotes = updateData.aiSoapNotes.trim();
      const soapValidation = getSoapValidationSummary(soapNotes);
      
      if (!soapValidation.isValid) {
        return NextResponse.json({ 
          message: `Invalid SOAP format. ${soapValidation.missingSections.length > 0 ? 
            `Missing sections: ${soapValidation.missingSections.join(', ')}. ` : ''}Notes must contain properly formatted SOAP sections (S:, O:, A:, P: or XML format).`,
          details: {
            format: soapValidation.format,
            sectionCount: soapValidation.sectionCount,
            missingSections: soapValidation.missingSections
          }
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

    console.log('Update result:', result);    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Patient not found or already archived' }, { status: 404 });
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

/**
 * DELETE /api/patients/[id]
 * 
 * Soft deletes a patient record by marking it as deleted rather than permanently removing it.
 * This maintains data integrity while allowing case management.
 */
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const validation = await validatePatientRequest(context.params);
  if (validation.error) return validation.error;
  const { id } = validation;

  try {
    // Parse and validate request body
    const requestBody = await request.json();
    const parseResult = DeleteRequestSchema.safeParse(requestBody);
    
    if (!parseResult.success) {
      return NextResponse.json({ 
        message: 'Invalid request body',
        errors: parseResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 });
    }

    const { deletionReason } = parseResult.data;

    // TODO: Add Firebase Admin SDK authentication here
    // For now, using a placeholder user ID
    // const user = await verifyFirebaseToken(request);
    // if (!user) {
    //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    const deletedBy = 'system-user'; // Replace with actual user ID from Firebase token

    const client = await connectToDatabase();
    const db = client.db('healthtrack');
    const patientsCollection = db.collection<PatientDocument>('patients');

    // Find the patient first to check existence and current status
    const patient = await findPatientById(patientsCollection, id);

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    // Check if patient is already soft deleted
    if (patient.isDeleted) {
      return NextResponse.json({ 
        message: 'Patient is already archived',
        archivedAt: patient.deletedAt,
        archivedBy: patient.deletedBy,
        reason: patient.deletionReason
      }, { status: 409 });
    }

    // Perform soft delete
    const updateResult = await patientsCollection.updateOne(
      { _id: patient._id },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: deletedBy,
          deletionReason: deletionReason,
          last_updated: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ message: 'Failed to archive patient' }, { status: 500 });
    }

    console.log(`Patient ${id} soft deleted successfully by ${deletedBy}. Reason: ${deletionReason}`);

    return NextResponse.json({
      message: 'Patient archived successfully',
      patientId: id,
      archivedAt: new Date().toISOString(),
      archivedBy: deletedBy
    }, { status: 200 });

  } catch (error) {
    console.error(`Failed to delete patient with id ${id}:`, error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    
    return NextResponse.json({ 
      message: 'Failed to archive patient', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
