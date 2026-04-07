import { Patient } from '@/types';
import { Document, ObjectId } from 'mongodb';

export function mapDbPatientToFrontendPatient(doc: Document | null): Patient | null {
  if (!doc) {
    return null;
  }

  // Ensure ObjectId is properly converted to string
  const getId = (doc: Document): string => {
    if (doc._id) {
      if (typeof doc._id === 'string') return doc._id;
      if (doc._id instanceof ObjectId) return doc._id.toString();
      if (doc._id.toString) return doc._id.toString();
    }
    if (doc.id) {
      if (typeof doc.id === 'string') return doc.id;
      if (doc.id.toString) return doc.id.toString();
    }
    return 'unknown-id';
  };

  return {
    id: getId(doc),
    name: doc.name || 'Unknown Patient',
    age: doc.age || 0,
    gender: doc.sex || doc.gender || 'Other',
    lastVisit: doc.last_updated?.toString() || new Date().toISOString(),
    riskScore: doc.risk_score || 0,
    conditions: doc.icd_tag_summary || doc.conditions || [],
    status: doc.status || 'draft',
    avatarUrl: doc.avatarUrl || null,
    dataAiHint: doc.dataAiHint || 'portrait',
    primaryComplaint: doc.primary_complaint || doc.primaryComplaint || '',
    vitals: doc.vitals || {},
    doctorsObservations: doc.observations || doc.doctorsObservations || '',
    aiAnalysis: doc.aiAnalysis || undefined,
    alert: doc.alert || undefined,
    previousConditions: doc.previous_conditions || doc.previousConditions || [],
    allergies: doc.allergies || [],
    medications: doc.current_medications || doc.medications || [],
    notes: doc.notes || undefined,
    aiSoapNotes: doc.ai_soap_notes || doc.aiSoapNotes || undefined,
    matched_cases: doc.matched_cases || undefined,
    isDeleted: doc.isDeleted || false,
    deletedAt: doc.deletedAt || undefined,
    deletedBy: doc.deletedBy || undefined,
    deletionReason: doc.deletionReason || undefined,
  };
}