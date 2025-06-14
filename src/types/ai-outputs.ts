
import { z } from 'zod';

export const PatientConditionSummaryOutputSchema = z.object({
  overallAssessment: z.string().describe("A brief summary of the patient's current primary issues and overall state."),
  keyFindings: z.array(z.string()).describe("A list of the most significant findings from the provided information."),
  careSuggestions: z.array(z.string()).describe("A list of general care considerations or potential areas for further investigation (non-prescriptive)."),
  furtherDataNeeded: z.string().describe("Statement on whether more data/tests are needed, or if provided data is sufficient for a preliminary assessment."),
});

export type PatientConditionSummaryOutput = z.infer<typeof PatientConditionSummaryOutputSchema>;
