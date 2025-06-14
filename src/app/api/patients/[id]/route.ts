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
export async function GET(request: Request, context: { params: { id: string } }) {
  // Await params if it's a Promise (Next.js 15+ dynamic API route requirement)
  const params = context.params instanceof Promise ? await context.params : context.params;
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
      primaryComplaint: patient.symptoms?.join(', ') || 'No symptoms recorded.',
      vitals: {
        bp: patient.vitals?.bp || 'N/A',
        hr: patient.vitals?.hr?.toString() || 'N/A',
        rr: patient.vitals?.rr?.toString() || 'N/A',
        temp: patient.vitals?.temp?.toString() || 'N/A',
        spo2: patient.vitals?.spo2?.toString() || 'N/A',
      },
      doctorsObservations: patient.observations || 'No observations recorded.',
      aiSoapNotes: patient.ai_soap_notes || undefined, // Include AI SOAP notes if they exist
      notes: patient.observations || 'No observations recorded.', // Original doctor's notes
      status: patient.status || 'draft',
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
 * Updates specific fields of a patient document, particularly for saving AI-generated SOAP notes
 */
export async function PATCH(request: Request, context: { params: { id: string } }) {
  // Await params if it's a Promise (Next.js 15+ dynamic API route requirement)
  const params = context.params instanceof Promise ? await context.params : context.params;
  const id = params.id;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ message: 'Patient ID must be a non-empty string.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { aiSoapNotes } = body;

    if (!aiSoapNotes || typeof aiSoapNotes !== 'string' || aiSoapNotes.trim() === '') {
      return NextResponse.json({ message: 'AI SOAP notes are required and cannot be empty.' }, { status: 400 });
    }

    // Validate that the notes are properly formatted SOAP notes
    if (!aiSoapNotes.includes('S:') || !aiSoapNotes.includes('O:') || 
        !aiSoapNotes.includes('A:') || !aiSoapNotes.includes('P:')) {
      return NextResponse.json({ 
        message: 'SOAP notes must be properly formatted with S:, O:, A:, and P: sections.' 
      }, { status: 400 });
    }

    const client = await connectToDatabase();
    const db = client.db('healthtrack');
    const patientsCollection = db.collection<PatientDocument>('patients');

    let updateResult;

    if (ObjectId.isValid(id)) {
      const objectIdToQuery = new ObjectId(id);
      updateResult = await patientsCollection.updateOne(
        { _id: objectIdToQuery },
        { 
          $set: { 
            ai_soap_notes: aiSoapNotes,
            last_updated: new Date()
          } 
        }
      );
    } else {
      updateResult = await patientsCollection.updateOne(
        { _id: id as any },
        { 
          $set: { 
            ai_soap_notes: aiSoapNotes,
            last_updated: new Date()
          } 
        }
      );
    }

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ message: 'No changes made to patient record' }, { status: 200 });
    }

    return NextResponse.json({ 
      message: 'AI SOAP notes saved successfully',
      aiSoapNotes 
    }, { status: 200 });

  } catch (error) {
    console.error(`Failed to update patient with id ${id}:`, error);
    return NextResponse.json({ 
      message: 'Failed to save AI SOAP notes', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
