
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PatientDocument, NewCaseFormValues, Patient } from '@/types';
import { ObjectId } from 'mongodb';
import { analyzePatientSymptoms, AnalyzePatientSymptomsInput } from '@/vertex-ai';
import { format } from 'date-fns';

/**
 * GET /api/patients
 * 
 * Retrieves a list of all patients with a limited set of fields suitable for the dashboard view.
 */
export async function GET() {
  try {
    const client = await connectToDatabase();
    const db = client.db('healthtrack');
    const patientsCollection = db.collection<PatientDocument>('patients');    const projection = {
      name: 1,
      age: 1,
      sex: 1,
      last_updated: 1,
      risk_score: 1,
      icd_tag_summary: 1,
      status: 1,
    };

    const patients = await patientsCollection
      .find({}, { projection })
      .sort({ last_updated: -1 })
      .toArray();    const formattedPatients: Patient[] = patients.map(p => {
      // Safely handle the lastVisit date
      const lastVisitDate = p.last_updated && !isNaN(new Date(p.last_updated).getTime())
        ? new Date(p.last_updated)
        : new Date(); // Fallback to current date if invalid

      return {
        id: p._id.toString(),
        name: p.name,
        age: p.age,
        gender: p.sex,
        lastVisit: lastVisitDate.toISOString(),
        riskScore: p.risk_score,
        conditions: p.icd_tag_summary || [],
        status: p.status || 'draft',
        avatarUrl: 'https://placehold.co/100x100.png',
        dataAiHint: 'portrait',
        primaryComplaint: '', // Not needed for dashboard view
        vitals: {},
        doctorsObservations: '',
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
    const formData: NewCaseFormValues = await request.json();    const newPatientDocument: Omit<PatientDocument, '_id'> = {
      name: formData.patientName,
      age: Number(formData.age),
      sex: formData.gender,
      createdAt: new Date(),
      last_updated: formData.visitDate ? new Date(formData.visitDate) : new Date(),
      vitals: {
        temp: Number(formData.temp) || null,
        bp: formData.bp,
        hr: Number(formData.hr) || null,
        spo2: Number(formData.spo2) || null,
        rr: Number(formData.rr) || null,      },
      symptoms: formData.primaryComplaint.split(',').map(s => s.trim()),
      observations: formData.observations || '',
      // Medical History Fields
      primary_complaint: formData.primaryComplaint,
      previous_conditions: formData.previousConditions ? 
        formData.previousConditions.split(',').map(s => s.trim()).filter(Boolean) : [],
      allergies: formData.allergies ? 
        formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
      current_medications: formData.medications ? 
        formData.medications.split(',').map(s => s.trim()).filter(Boolean) : [],
      icd_tags: [],
      icd_tag_summary: formData.previousConditions ? formData.previousConditions.split(',').map(s => s.trim()) : [],
      risk_predictions: [],
      risk_score: 0,
      soap_note: {
        subjective: `Patient is a ${formData.age}-year-old ${formData.gender.toLowerCase()} presenting with ${formData.primaryComplaint}.`,
        objective: '',
        assessment: '',
        plan: ''
      },
      matched_cases: [],
      ai_metadata: {},
      status: 'analyzing', // Set status to 'analyzing'
      owner_uid: 'firebase-auth-uid-placeholder',
    };

    const client = await connectToDatabase();
    const db = client.db('healthtrack');
    const patientsCollection = db.collection<PatientDocument>('patients');

    const result = await patientsCollection.insertOne({
      ...newPatientDocument,
      _id: new ObjectId(),
    });

    if (!result.insertedId) {
      throw new Error('Failed to insert the new patient document.');
    }

    // Asynchronously trigger AI analysis without waiting for it to complete
    (async () => {
      try {        let patientInfoString = `Patient: ${formData.patientName}, ${formData.age} y/o ${formData.gender}. Visit Date: ${format(new Date(formData.visitDate), 'PPP')}.`;
        patientInfoString += `
Primary Complaint: ${formData.primaryComplaint}.`;
        
        if (formData.previousConditions) {
          patientInfoString += `
Previous Known Conditions: ${formData.previousConditions}.`;
        }
        
        if (formData.allergies) {
          patientInfoString += `
Known Allergies: ${formData.allergies}.`;
        }
        
        if (formData.medications) {
          patientInfoString += `
Current Medications: ${formData.medications}.`;
        }

        const vitalParts: string[] = [];
        if (formData.bp) vitalParts.push(`BP ${formData.bp} mmHg`);
        if (formData.hr) vitalParts.push(`HR ${formData.hr} bpm`);
        if (formData.rr) vitalParts.push(`RR ${formData.rr} breaths/min`);
        if (formData.temp) vitalParts.push(`Temp ${formData.temp}°C`);
        if (formData.spo2) vitalParts.push(`SpO2 ${formData.spo2}%`);        const vitalsString = vitalParts.length > 0 ? vitalParts.join(', ') : 'Not specified';
        
        // Create structured medical history for enhanced AI analysis
        const medicalHistory = {
          primaryComplaint: formData.primaryComplaint,
          allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
          currentMedications: formData.medications ? formData.medications.split(',').map(m => m.trim()).filter(m => m) : [],
          previousConditions: formData.previousConditions ? formData.previousConditions.split(',').map(c => c.trim()).filter(c => c) : [],
        };        // Use Vertex AI analysis with structured medical history
        const analysisInput: AnalyzePatientSymptomsInput = {
          patientName: formData.patientName,
          age: formData.age,
          gender: formData.gender,
          visitDate: format(new Date(), 'yyyy-MM-dd'),
          primaryComplaint: formData.primaryComplaint,
          vitals: vitalsString,
          observations: formData.observations || '',
          medicalHistory,
        };

        const analysisResult = await analyzePatientSymptoms(analysisInput);// Update the patient document with the enhanced analysis results
        await patientsCollection.updateOne(
          { _id: result.insertedId },
          {            $set: {
              risk_score: analysisResult.riskScore,
              icd_tags: analysisResult.icd10Tags.map((tag: { code: string; description: string }) => ({
                ...tag, 
                label: tag.description, 
                confidence: 0.8, // Default confidence for AI-generated tags
                source_phrase: ''
              })),
              icd_tag_summary: analysisResult.icd10Tags.map((tag: { code: string; description: string }) => tag.code),
              soap_note: {
                subjective: analysisResult.soapNotes.match(/S:([\s\S]*?)(O:|$)/)?.[1]?.trim() || '',
                objective: analysisResult.soapNotes.match(/O:([\s\S]*?)(A:|$)/)?.[1]?.trim() || '',
                assessment: analysisResult.soapNotes.match(/A:([\s\S]*?)(P:|$)/)?.[1]?.trim() || '',
                plan: analysisResult.soapNotes.match(/P:([\s\S]*?)$/)?.[1]?.trim() || ''
              },              // Enhanced medical history analysis results
              medical_history_analysis: {
                allergy_warnings: analysisResult.allergyWarnings || [],
                medication_interactions: analysisResult.medicationInteractions || [],
                previous_conditions_impact: analysisResult.previousConditionsImpact || [],
              },
              status: 'complete',
              ai_analysis_timestamp: new Date(),
            },
          }
        );
        console.log(`Successfully updated patient ${result.insertedId} with AI analysis.`);
      } catch (aiError) {
        console.error('AI analysis failed for patient:', result.insertedId, aiError);
        // Optionally update the patient status to 'analysis_failed'
        await patientsCollection.updateOne(
          { _id: result.insertedId },
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
