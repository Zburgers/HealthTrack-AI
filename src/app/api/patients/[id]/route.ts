import { NextResponse } from 'next/server';
import { getDb, isElectronEnvironment } from '@/lib/db';
import { Patient, PatientDocument } from '@/types';
import { formatToTraditionalFormat, createStructuredSoapNotes, getSoapValidationSummary } from '@/lib/soap-parser';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const DeleteRequestSchema = z.object({
  deletionReason: z.string().min(10, "Deletion reason must be at least 10 characters")
});

async function validatePatientRequest(params: Promise<{ id: string }>) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  if (!id || typeof id !== 'string') {
    return { error: NextResponse.json({ message: 'Patient ID must be a non-empty string.' }, { status: 400 }) };
  }
  return { id, error: null };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const validation = await validatePatientRequest(context.params);
  if (validation.error) return validation.error;
  const { id } = validation;

  try {
    const db = await getDb('patients');
    const patientsCollection = db.collection('patients');
    const patient = await patientsCollection.findOne({ id: id });

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    if (patient.is_deleted || patient.isDeleted) {
      return NextResponse.json({ message: 'Patient has been archived' }, { status: 410 });
    }

    const lastVisitDate = patient.last_updated && !isNaN(new Date(patient.last_updated).getTime())
        ? new Date(patient.last_updated)
        : new Date();

    const formatSoapNote = (soap: PatientDocument['soap_note']) => {
      if (!soap) return '';
      const structuredSoap = createStructuredSoapNotes({
        subjective: soap.subjective || '',
        objective: soap.objective || '',
        assessment: soap.assessment || '',
        plan: soap.plan || ''
      });
      return formatToTraditionalFormat(structuredSoap);
    };

    const formattedPatient: Patient = {
      id: patient.id,
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
      previousConditions: patient.previous_conditions || [],
      allergies: patient.allergies || [],
      medications: patient.current_medications || [],
      status: patient.status || 'draft',
      aiSoapNotes: patient.ai_soap_notes,
      notes: patient.observations || 'No observations recorded.',
      medicalHistoryAnalysis: patient.medical_history_analysis ? {
        allergyWarnings: patient.medical_history_analysis.allergy_warnings || [],
        medicationInteractions: patient.medical_history_analysis.medication_interactions || [],
        previousConditionsImpact: patient.medical_history_analysis.previous_conditions_impact || [],
      } : undefined,
      aiAnalysis: patient.status === 'complete' ? {
        summary: formatSoapNote(patient.soap_note) || patient.ai_metadata?.summary || 'AI analysis completed but no summary available.',
        icd10Tags: (patient.icd_tags || []).map((tag: any) => ({
          code: tag.code || 'N/A',
          description: tag.label || 'No description',
        })),
        differentialDiagnosis: (patient.risk_predictions || []).map((pred: any) => ({
          condition: pred.condition,
          likelihood: `${pred.confidence}%`
        })),
        recommendedTests: patient.ai_metadata?.recommended_tests || [],
        treatmentSuggestions: patient.ai_metadata?.treatment_suggestions || [],
        riskScore: patient.risk_score || 0,
        soapNotes: patient.ai_soap_notes || formatSoapNote(patient.soap_note) || '',
        similarCases: (patient.matched_cases || []).map((matchedCase: any) => ({
          id: matchedCase.case_id || '',
          matchConfidence: matchedCase.similarity_score || 0,
          age: 0,
          sex: '',
          hadm_id: 0,
          subject_id: 0,
          icd: [],
          icd_label: matchedCase.diagnosis ? [matchedCase.diagnosis] : [],
          note: matchedCase.summary || '',
        }))
      } : undefined,
      avatarUrl: null,
      dataAiHint: 'portrait',
    };

    return NextResponse.json(formattedPatient, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch patient with id ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch patient', error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const validation = await validatePatientRequest(context.params);
  if (validation.error) return validation.error;
  const { id } = validation;

  try {
    const updateData = await request.json();
    const db = await getDb('patients');
    const patientsCollection = db.collection('patients');

    const updateFields: any = {
      last_updated: new Date().toISOString()
    };

    if (updateData.aiSoapNotes) {
      if (typeof updateData.aiSoapNotes !== 'string') {
        return NextResponse.json({ message: 'aiSoapNotes must be a non-empty string' }, { status: 400 });
      }
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

    const meaningfulUpdates = Object.keys(updateFields).filter(key => key !== 'last_updated');
    if (meaningfulUpdates.length === 0) {
      return NextResponse.json({ message: 'No valid fields provided for update' }, { status: 400 });
    }

    const result = await patientsCollection.updateOne({ id: id }, { $set: updateFields });

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Patient not found or already archived' }, { status: 404 });
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'No changes made to patient record' }, { status: 200 });
    }

    return NextResponse.json({ 
      message: 'Patient updated successfully',
      updatedFields: meaningfulUpdates,
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

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const validation = await validatePatientRequest(context.params);
  if (validation.error) return validation.error;
  const { id } = validation;

  try {
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
    const deletedBy = 'system-user';

    const db = await getDb('patients');
    const patientsCollection = db.collection('patients');

    const patient = await patientsCollection.findOne({ id: id });

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    const isDeleted = patient.is_deleted || patient.isDeleted;
    if (isDeleted) {
      return NextResponse.json({ 
        message: 'Patient is already archived',
        archivedAt: patient.deleted_at || patient.deletedAt,
        archivedBy: patient.deleted_by || patient.deletedBy,
        reason: patient.deletion_reason || patient.deletionReason
      }, { status: 409 });
    }

    const updateResult = await patientsCollection.updateOne(
      { id: id },
      {
        $set: {
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy,
          deletion_reason: deletionReason,
          last_updated: new Date().toISOString()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ message: 'Failed to archive patient' }, { status: 500 });
    }

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
