import { z } from 'zod';

export const CaseVitalsSchema = z.object({
  bp: z.string().nullable(),
  hr: z.number().nullable(),
  rr: z.number().nullable(),
  spo2: z.number().nullable(),
  temp: z.number().nullable(),
});

export const SimilarCaseSearchInputSchema = z.object({
  patientInformation: z.string().optional(),
  vitals: z.record(z.unknown()).optional(),
  observations: z.string().optional(),
  diagnoses: z.array(z.string()).optional(),
  clinicalNote: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(10),
  minConfidence: z.number().min(0).max(1).default(0),
});

export const SimilarCaseOutputSchema: z.ZodType<import('./types').SimilarCaseOutput> = z.object({
  id: z.string(),
  matchConfidence: z.number().min(0).max(1),
  subject_id: z.number(),
  hadm_id: z.number(),
  age: z.number(),
  sex: z.string(),
  icd: z.array(z.string()),
  icd_label: z.array(z.string()),
  note: z.string(),
  vitals: CaseVitalsSchema.optional(),
  outcomes: z.object({
    result: z.string().optional(),
    followUp: z.string().optional(),
    dischargeStatus: z.string().optional(),
    lengthOfStay: z.number().optional(),
    complications: z.array(z.string()).optional(),
  }).optional(),
  treatments: z.object({
    medications: z.array(z.string()).optional(),
    procedures: z.array(z.string()).optional(),
    interventions: z.array(z.string()).optional(),
    timeline: z.array(z.object({ date: z.string(), action: z.string() })).optional(),
  }).optional(),
  diagnostics: z.object({
    tests: z.array(z.string()).optional(),
    results: z.array(z.string()).optional(),
    imaging: z.array(z.string()).optional(),
    labs: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.object({
    complexityScore: z.number().optional(),
    outcomeClass: z.string().optional(),
    admissionType: z.string().optional(),
    caseDate: z.date().optional(),
  }).optional(),
}) as z.ZodType<import('./types').SimilarCaseOutput>;
