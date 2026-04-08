import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { patients } from '../../../drizzle/schema';
import { ilike, or, and, eq } from 'drizzle-orm';

/**
 * Mastra tool for searching patients in the database.
 * Migrated from Genkit frontend to backend Mastra tool.
 */
export const patientSearchTool = createTool({
  id: 'patient-search',
  description: 'Search for patients by name, date of birth, or other identifying criteria',
  inputSchema: z.object({
    name: z.string().optional().describe('Patient name (full or partial)'),
    dateOfBirth: z.string().optional().describe('Patient date of birth (YYYY-MM-DD)'),
    email: z.string().optional().describe('Patient email address'),
    organizationId: z.string().optional().describe('Organization ID for scoping search'),
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
    const db = drizzle(
      new Pool({ connectionString: process.env.DATABASE_URL }),
    );

    const conditions = [];

    if (context.name) {
      conditions.push(ilike(patients.name, `%${context.name}%`));
    }

    if (context.dateOfBirth) {
      conditions.push(eq(patients.dateOfBirth, context.dateOfBirth));
    }

    if (context.email) {
      conditions.push(ilike(patients.email, `%${context.email}%`));
    }

    if (context.organizationId) {
      conditions.push(eq(patients.organizationId, context.organizationId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: patients.id,
        name: patients.name,
        dateOfBirth: patients.dateOfBirth,
        gender: patients.gender,
        email: patients.email,
      })
      .from(patients)
      .where(whereClause)
      .limit(context.limit);

    return {
      patients: results,
      totalResults: results.length,
    };
  },
});
