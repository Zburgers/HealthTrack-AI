
// electron/types/database.ts

export interface Patient {
  _id?: string;
  name: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  contact: {
    phone: string;
    email: string;
  };
  address: string;
  // Add other patient fields as needed
}

export interface Encounter {
  _id?: string;
  patientId: string;
  date: string;
  class: 'ambulatory' | 'inpatient' | 'emergency' | 'virtual';
  // Add other encounter fields as needed
}

export interface Observation {
  _id?: string;
  encounterId: string;
  code: string;
  value: string | number;
  unit: string;
  // Add other observation fields as needed
}

export interface Practitioner {
    _id?: string;
    name: string;
    role: string;
    specialty: string;
}

export interface Medication {
    _id?: string;
    name: string;
    code: string;
    form: string; // e.g., tablet, capsule
}

export interface MedicationRequest {
    _id?: string;
    patientId: string;
    medicationId: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
}

export interface Appointment {
    _id?: string;
    patientId: string;
    practitionerId: string;
    date: string;
    status: 'scheduled' | 'completed' | 'cancelled';
}

export interface SOAPNote {
    _id?: string;
    encounterId: string;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
}

export interface Task {
    _id?: string;
    description: string;
    dueDate: string;
    isCompleted: boolean;
}

export interface CodeMapping {
    _id?: string;
    sourceCode: string;
    targetCode: string;
    system: string; // e.g., ICD-10, SNOMED
}

export interface Setting {
    _id?: string;
    key: string;
    value: any;
}

export interface LogEntry {
    _id?: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
}
