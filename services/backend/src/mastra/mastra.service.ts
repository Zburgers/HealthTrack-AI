import { Injectable, OnModuleInit } from '@nestjs/common';
import { Mastra } from '@mastra/core';
import { patientAnalysisAgent } from './agents/patient-analysis-agent';
import { soapNotesAgent } from './agents/soap-notes-agent';
import { symptomAnalysisAgent } from './agents/symptom-analysis-agent';
import { noteEnhancementAgent } from './agents/note-enhancement-agent';
import { patientSummaryAgent } from './agents/patient-summary-agent';

@Injectable()
export class MastraService implements OnModuleInit {
  private mastra: Mastra;

  onModuleInit() {
    this.mastra = new Mastra({
      agents: {
        patientAnalysisAgent,
        soapNotesAgent,
        symptomAnalysisAgent,
        noteEnhancementAgent,
        patientSummaryAgent,
      },
    });
  }

  getMastra(): Mastra {
    return this.mastra;
  }

  getAgentById(id: string) {
    return this.mastra.getAgentById(id);
  }
}
