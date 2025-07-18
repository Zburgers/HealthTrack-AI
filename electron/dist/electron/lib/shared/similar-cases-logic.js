"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimilarCasesApiInputSchema = void 0;
exports.prepareInputTextForEmbedding = prepareInputTextForEmbedding;
const zod_1 = require("zod");
// Define Zod schema for input validation based on SimilarCasesApiInput
exports.SimilarCasesApiInputSchema = zod_1.z.object({
    note: zod_1.z.string().min(1, { message: "Note cannot be empty." }),
    age: zod_1.z.number().int().positive().optional(),
    sex: zod_1.z.string().optional(), // Could be an enum: z.enum(['M', 'F', 'O']).optional()
    vitals: zod_1.z.object({
        bp: zod_1.z.string().optional().nullable(),
        hr: zod_1.z.number().int().positive().optional().nullable(),
        rr: zod_1.z.number().int().positive().optional().nullable(),
        spo2: zod_1.z.number().int().positive().optional().nullable(),
        temp: zod_1.z.number().positive().optional().nullable(),
    }).partial().optional(), // partial means all fields within vitals are optional
});
// Helper function to concatenate relevant fields for embedding
function prepareInputTextForEmbedding(input) {
    // Prioritize the clinical note.
    let mainNote = input.note;
    // Create a compact string for additional structured data if available.
    let structuredDataParts = [];
    if (input.age)
        structuredDataParts.push(`A:${input.age}`);
    if (input.sex)
        structuredDataParts.push(`S:${input.sex.charAt(0)}`); // M/F/O
    if (input.vitals) {
        const { bp, hr, rr, spo2, temp } = input.vitals;
        let vitalsSummary = [];
        if (temp != null)
            vitalsSummary.push(`T:${temp}`);
        if (bp)
            vitalsSummary.push(`BP:${bp}`);
        if (hr != null)
            vitalsSummary.push(`HR:${hr}`);
        if (spo2 != null)
            vitalsSummary.push(`O2:${spo2}`);
        if (rr != null)
            vitalsSummary.push(`RR:${rr}`);
        if (vitalsSummary.length > 0) {
            structuredDataParts.push(`Vitals[${vitalsSummary.join(',')}]`);
        }
    }
    let combinedText;
    // Combine the main note with a very concise summary of structured data.
    if (structuredDataParts.length > 0) {
        combinedText = `${mainNote} (${structuredDataParts.join(' ')})`;
    }
    else {
        combinedText = mainNote;
    }
    // Optimize whitespace:
    // 1. Replace multiple whitespace characters (including newlines, tabs, etc.) with a single space.
    let optimizedText = combinedText.replace(/\s\s+/g, ' ');
    // 2. Trim leading/trailing whitespace from the final string.
    optimizedText = optimizedText.trim();
    return optimizedText;
}
//# sourceMappingURL=similar-cases-logic.js.map