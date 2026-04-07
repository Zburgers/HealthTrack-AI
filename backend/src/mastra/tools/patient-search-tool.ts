import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const patientSearchTool = createTool({
  id: 'patient-search',
  description: 'Search for patients by name, date of birth, or other identifying criteria',
  inputSchema: z.object({
    name: z.string().optional().describe('Patient name (full or partial)'),
    dateOfBirth: z.string().optional().describe('Patient date of birth (YYYY-MM-DD)'),
    email: z.string().optional().describe('Patient email address'),
    limit: z.number().default(10).describe('Maximum number of results to return'),
  }),
  outputSchema: z.object({
    patients: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        dateOfBirth: z.string().nullable(),
        gender: z.string().nullable(),
        email: z.string().nullable(),
      }),
    ),
    totalResults: z.number(),
  }),
  execute: async ({ context }) => {
    // TODO: Implement actual patient search via NestJS PatientsService
    // This tool will be wired to the NestJS patient search endpoint
    // For now, return empty results as scaffolding
    return {
      patients: [],
      totalResults: 0,
    };
  },
});
