import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Mastra tool for calculating patient risk score.
 * Migrated from Genkit's calculateRiskScoreEnhanced tool.
 * Uses deterministic algorithm (not LLM-based) for consistent risk assessment.
 */
export const riskScoreTool = createTool({
  id: 'risk-score-calculation',
  description: 'Calculates a comprehensive risk score based on patient information, vitals, and medical history',
  inputSchema: z.object({
    patientInformation: z.string().optional().describe('Comprehensive details about the patient'),
    vitals: z.string().optional().describe('Patient vitals such as heart rate, blood pressure, etc.'),
    allergies: z.array(z.string()).optional().describe('Known allergies'),
    currentMedications: z.array(z.string()).optional().describe('Current medications'),
    previousConditions: z.array(z.string()).optional().describe('Previous medical conditions'),
  }),
  outputSchema: z.object({
    riskScore: z.number().describe('Overall risk score (0.0-1.0)'),
    riskFactors: z.array(z.string()).describe('Identified risk factors'),
    allergyRiskLevel: z.enum(['low', 'moderate', 'high']).describe('Allergy-related risk level'),
    medicationRiskLevel: z.enum(['low', 'moderate', 'high']).describe('Medication-related risk level'),
  }),
  execute: async ({ context }) => {
    let baseRisk = 0.3; // Base risk
    const riskFactors: string[] = [];
    let allergyRiskLevel: 'low' | 'moderate' | 'high' = 'low';
    let medicationRiskLevel: 'low' | 'moderate' | 'high' = 'low';

    // Analyze allergies
    if (context.allergies && context.allergies.length > 0) {
      const criticalAllergies = context.allergies.filter(
        (allergy) =>
          allergy.toLowerCase().includes('penicillin') ||
          allergy.toLowerCase().includes('nsaid') ||
          allergy.toLowerCase().includes('latex') ||
          allergy.toLowerCase().includes('contrast'),
      );

      if (criticalAllergies.length > 0) {
        baseRisk += 0.2;
        allergyRiskLevel = 'high';
        riskFactors.push(`Critical allergies: ${criticalAllergies.join(', ')}`);
      } else if (context.allergies.length > 3) {
        baseRisk += 0.1;
        allergyRiskLevel = 'moderate';
        riskFactors.push('Multiple allergies present');
      }
    }

    // Analyze medications
    if (context.currentMedications && context.currentMedications.length > 0) {
      if (context.currentMedications.length > 5) {
        baseRisk += 0.15;
        medicationRiskLevel = 'high';
        riskFactors.push('Polypharmacy (>5 medications)');
      }

      const highRiskMeds = context.currentMedications.filter(
        (med) =>
          med.toLowerCase().includes('warfarin') ||
          med.toLowerCase().includes('insulin') ||
          med.toLowerCase().includes('digoxin') ||
          med.toLowerCase().includes('lithium'),
      );

      if (highRiskMeds.length > 0) {
        baseRisk += 0.1;
        medicationRiskLevel = medicationRiskLevel === 'high' ? 'high' : 'moderate';
        riskFactors.push(`High-risk medications: ${highRiskMeds.join(', ')}`);
      }
    }

    // Analyze previous conditions
    if (context.previousConditions && context.previousConditions.length > 0) {
      const chronicConditions = context.previousConditions.filter(
        (condition) =>
          condition.toLowerCase().includes('diabetes') ||
          condition.toLowerCase().includes('hypertension') ||
          condition.toLowerCase().includes('heart') ||
          condition.toLowerCase().includes('kidney') ||
          condition.toLowerCase().includes('liver'),
      );

      if (chronicConditions.length > 0) {
        baseRisk += 0.1 * chronicConditions.length;
        riskFactors.push(`Chronic conditions: ${chronicConditions.join(', ')}`);
      }
    }

    // Cap the risk score at 1.0
    const finalRiskScore = Math.min(baseRisk, 1.0);

    return {
      riskScore: finalRiskScore,
      riskFactors,
      allergyRiskLevel,
      medicationRiskLevel,
    };
  },
});
