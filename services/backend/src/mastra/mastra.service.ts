import { Injectable, OnModuleInit } from '@nestjs/common';
import { Mastra } from '@mastra/core';
import { patientAnalysisAgent } from './agents/patient-analysis-agent';
import { soapNotesAgent } from './agents/soap-notes-agent';

@Injectable()
export class MastraService implements OnModuleInit {
  private mastra: Mastra;

  onModuleInit() {
    this.mastra = new Mastra({
      agents: { patientAnalysisAgent, soapNotesAgent },
    });
  }

  getMastra(): Mastra {
    return this.mastra;
  }

  getAgentById(id: string) {
    return this.mastra.getAgentById(id);
  }
}
