import { Mastra } from '@mastra/core';
import { patientAnalysisAgent } from './agents/patient-analysis-agent';

export const mastra = new Mastra({
  agents: { patientAnalysisAgent },
});
