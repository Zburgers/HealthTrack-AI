
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
  // Accessing params via the context object as a more robust method.
  const { id } = context.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid patient ID format' }, { status: 400 });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('healthtrack');
    const patientsCollection = db.collection<PatientDocument>('patients');

    const patient = await patientsCollection.findOne({ _id: new ObjectId(id) });

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
    };

    // Robustly map the MongoDB document to the frontend Patient type
    const formattedPatient: Patient = {
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
      aiAnalysis: {
        icd10Tags: (patient.icd_tags || []).map(tag => ({
          code: tag.code || 'N/A',
          description: tag.label || 'No description',
        })),
        riskScore: patient.risk_score || 0,
        soapNotes: formatSoapNote(patient.soap_note),
      },
      avatarUrl: 'https://placehold.co/100x100.png',
      dataAiHint: 'portrait',
    };

    return NextResponse.json(formattedPatient, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch patient with id ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch patient', error: (error as Error).message }, { status: 500 });
  }
}
