import { z } from 'zod';
import { SimilarCasesApiInput } from '@/types/similar-cases';

// Define Zod schema for input validation based on SimilarCasesApiInput
export const SimilarCasesApiInputSchema = z.object({
  note: z.string().min(1, { message: "Note cannot be empty." }),
  age: z.number().int().positive().optional(),
  sex: z.string().optional(), // Could be an enum: z.enum(['M', 'F', 'O']).optional()
  vitals: z.object({
    bp: z.string().optional().nullable(),
    hr: z.number().int().positive().optional().nullable(),
    rr: z.number().int().positive().optional().nullable(),
    spo2: z.number().int().positive().optional().nullable(),
    temp: z.number().positive().optional().nullable(),
  }).partial().optional(), // partial means all fields within vitals are optional
});

// Helper function to concatenate relevant fields for embedding
export function prepareInputTextForEmbedding(input: SimilarCasesApiInput): string {
  // Prioritize the clinical note.
  let mainNote = input.note;

  // Create a compact string for additional structured data if available.
  let structuredDataParts: string[] = [];
  if (input.age) structuredDataParts.push(`A:${input.age}`);
  if (input.sex) structuredDataParts.push(`S:${input.sex.charAt(0)}`); // M/F/O

  if (input.vitals) {
    const { bp, hr, rr, spo2, temp } = input.vitals;
    let vitalsSummary: string[] = [];
    if (temp != null) vitalsSummary.push(`T:${temp}`);
    if (bp) vitalsSummary.push(`BP:${bp}`);
    if (hr != null) vitalsSummary.push(`HR:${hr}`);
    if (spo2 != null) vitalsSummary.push(`O2:${spo2}`);
    if (rr != null) vitalsSummary.push(`RR:${rr}`);
    if (vitalsSummary.length > 0) {
      structuredDataParts.push(`Vitals[${vitalsSummary.join(',')}]`);
    }
  }

  let combinedText;
  // Combine the main note with a very concise summary of structured data.
  if (structuredDataParts.length > 0) {
    combinedText = `${mainNote} (${structuredDataParts.join(' ')})`;
  } else {
    combinedText = mainNote;
  }

  // Optimize whitespace:
  // 1. Replace multiple whitespace characters (including newlines, tabs, etc.) with a single space.
  let optimizedText = combinedText.replace(/\s\s+/g, ' ');
  // 2. Trim leading/trailing whitespace from the final string.
  optimizedText = optimizedText.trim();

  return optimizedText;
}
