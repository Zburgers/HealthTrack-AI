"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patientSearchTool = void 0;
const tools_1 = require("@mastra/core/tools");
const zod_1 = require("zod");
exports.patientSearchTool = (0, tools_1.createTool)({
    id: 'patient-search',
    description: 'Search for patients by name, date of birth, or other identifying criteria',
    inputSchema: zod_1.z.object({
        name: zod_1.z.string().optional().describe('Patient name (full or partial)'),
        dateOfBirth: zod_1.z.string().optional().describe('Patient date of birth (YYYY-MM-DD)'),
        email: zod_1.z.string().optional().describe('Patient email address'),
        limit: zod_1.z.number().default(10).describe('Maximum number of results to return'),
    }),
    outputSchema: zod_1.z.object({
        patients: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string(),
            dateOfBirth: zod_1.z.string().nullable(),
            gender: zod_1.z.string().nullable(),
            email: zod_1.z.string().nullable(),
        })),
        totalResults: zod_1.z.number(),
    }),
    execute: async ({ context }) => {
        return {
            patients: [],
            totalResults: 0,
        };
    },
});
//# sourceMappingURL=patient-search-tool.js.map