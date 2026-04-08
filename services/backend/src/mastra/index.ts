import { Mastra } from '@mastra/core';
import { patientAnalysisAgent } from './agents/patient-analysis-agent';
import { soapNotesAgent } from './agents/soap-notes-agent';
import { symptomAnalysisAgent } from './agents/symptom-analysis-agent';
import { noteEnhancementAgent } from './agents/note-enhancement-agent';
import { patientSummaryAgent } from './agents/patient-summary-agent';

export const mastra = new Mastra({
  agents: {
    patientAnalysisAgent,
    soapNotesAgent,
    symptomAnalysisAgent,
    noteEnhancementAgent,
    patientSummaryAgent,
  },
});
