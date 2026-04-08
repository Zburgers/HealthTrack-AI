"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhanceNotesTool = void 0;
const tools_1 = require("@mastra/core/tools");
const zod_1 = require("zod");
exports.enhanceNotesTool = (0, tools_1.createTool)({
    id: 'enhance-notes',
    description: 'Enhance clinical SOAP notes with additional clinical detail and formatting',
    inputSchema: zod_1.z.object({
        subjective: zod_1.z.string().optional().describe('Patient-reported symptoms and history'),
        objective: zod_1.z.string().optional().describe('Clinician observations and measurements'),
        assessment: zod_1.z.string().optional().describe('Clinical diagnosis and impressions'),
        plan: zod_1.z.string().optional().describe('Treatment plan and follow-up'),
        enhancementType: zod_1.z.enum(['full', 'minimal', 'billing-focused']).default('full').describe('Level of enhancement'),
    }),
    outputSchema: zod_1.z.object({
        enhancedNotes: zod_1.z.object({
            subjective: zod_1.z.string(),
            objective: zod_1.z.string(),
            assessment: zod_1.z.string(),
            plan: zod_1.z.string(),
        }),
        suggestedIcdCodes: zod_1.z.array(zod_1.z.string()).optional().describe('Suggested ICD-10 codes'),
        qualityNotes: zod_1.z.array(zod_1.z.string()).optional().describe('Suggestions for improving documentation'),
    }),
    execute: async ({ context }) => {
        return {
            enhancedNotes: {
                subjective: context.subjective || '',
                objective: context.objective || '',
                assessment: context.assessment || '',
                plan: context.plan || '',
            },
            suggestedIcdCodes: [],
            qualityNotes: [],
        };
    },
});
//# sourceMappingURL=enhance-notes-tool.js.map