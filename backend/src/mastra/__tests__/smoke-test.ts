/**
 * Quick smoke test: verify Mastra agents initialize and can call OpenRouter
 * Run: npx tsx src/mastra/__tests__/smoke-test.ts
 */
import { config } from 'dotenv';
config({ path: '.env' });

import { Mastra } from '@mastra/core';
import { patientAnalysisAgent } from '../agents/patient-analysis-agent';
import { soapNotesAgent } from '../agents/soap-notes-agent';

async function smokeTest() {
  console.log('=== Mastra Agent Smoke Test ===\n');

  // 1. Test agent initialization
  console.log('1. Creating Mastra instance...');
  const mastra = new Mastra({
    agents: { patientAnalysisAgent, soapNotesAgent },
  });
  console.log('   ✓ Mastra instance created\n');

  // 2. Test agent retrieval
  console.log('2. Retrieving patient-analysis-agent...');
  const analysisAgent = mastra.getAgentById('patient-analysis-agent');
  if (!analysisAgent) {
    console.error('   ✗ Failed to get patient-analysis-agent');
    process.exit(1);
  }
  console.log('   ✓ Agent retrieved\n');

  console.log('3. Retrieving soap-notes-agent...');
  const notesAgent = mastra.getAgentById('soap-notes-agent');
  if (!notesAgent) {
    console.error('   ✗ Failed to get soap-notes-agent');
    process.exit(1);
  }
  console.log('   ✓ Agent retrieved\n');

  // 3. Test OpenRouter connection
  console.log('4. Testing OpenRouter connection (patient-analysis-agent)...');
  try {
    const response = await analysisAgent.generate(
      'A 45-year-old male presents with fever, cough, and shortness of breath for 3 days. Temperature 38.5°C, HR 110, RR 22, SpO2 92% on room air. What is your differential diagnosis?',
    );
    console.log('   ✓ OpenRouter response received\n');
    console.log('   Response preview:', response.text.substring(0, 200) + '...\n');
  } catch (error) {
    console.error('   ✗ OpenRouter call failed:', error);
    process.exit(1);
  }

  // 4. Test SOAP notes agent
  console.log('5. Testing SOAP notes agent...');
  try {
    const response = await notesAgent.generate(
      'Enhance this SOAP note:\nS: Patient reports headache and nausea for 2 days.\nO: BP 140/90, HR 88, T 37.1°C.\nA: Tension headache.\nP: Recommend rest and OTC analgesics.',
    );
    console.log('   ✓ SOAP notes enhancement successful\n');
    console.log('   Response preview:', response.text.substring(0, 200) + '...\n');
  } catch (error) {
    console.error('   ✗ SOAP notes agent failed:', error);
    process.exit(1);
  }

  console.log('=== All smoke tests passed! ===');
}

smokeTest().catch((error) => {
  console.error('Smoke test failed:', error);
  process.exit(1);
});
