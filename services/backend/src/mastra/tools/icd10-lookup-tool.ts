import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

/**
 * Mastra tool for looking up ICD-10 codes from the local JSON database.
 * Migrated from Genkit's fetchICDCodes tool.
 */
export const icd10LookupTool = createTool({
  id: 'icd10-lookup',
  description: 'Retrieves ICD-10 code descriptions from the local codes_icd10_2026.json database',
  inputSchema: z.object({
    codes: z.array(z.string()).describe('Array of ICD-10 codes to look up (e.g., ["A000", "I500"])'),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        code: z.string(),
        description: z.string(),
      }),
    ),
  }),
  execute: async ({ context }) => {
    try {
      // Path to ICD-10 JSON file - relative to project root
      const filePath = path.join(process.cwd(), 'codes_icd10_2026.json');
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const icd10Data = JSON.parse(fileContent) as Array<{ code: string; desc: string }>;

      const results = context.codes.map((code) => {
        const found = icd10Data.find((item) => item.code === code);
        return {
          code,
          description: found ? found.desc : 'Description not found',
        };
      });

      return { results };
    } catch (error) {
      console.error('Error fetching ICD-10 codes:', error);
      return {
        results: context.codes.map((code) => ({
          code,
          description: 'Error fetching description',
        })),
      };
    }
  },
});
