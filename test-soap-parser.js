import { parseSOAPNotes } from './soap-parser';

// Test with the problematic SOAP notes from the screenshot
const testNotes = `S: Ravi Sharma, 54-year-old male, presents with chest pain and shortness of breath for 2 days. Pain is pressure-like, non-radiating, worsens with exertion, and rated 6/10. No known allergies, currently not taking any medications. History of CAD (I20.0), Hypertension (I10), Type 2 Diabetes Mellitus (E11.9), Hyperlipidemia (E78.5), Chest Pain (R07.2), and Shortness of Breath (R06.02).
O: BP: 160/98, HR: 92, Temp: 37.2, RR: 20, SpO2: 95%. Patient appears anxious and mildly diaphoretic. Mild tenderness in the epigastric region. No cyanosis or edema noted. ECG pending.
A: Chest pain and shortness of breath, likely unstable angina versus GERD mimic. Differential includes acute coronary syndrome. Risk stratification pending ECG results. History of CAD, hypertension, diabetes, and hyperlipidemia increases risk for cardiac event.
P: Order ECG and cardiac enzymes. Administer oxygen as needed to maintain SpO2 >90%. Consider aspirin and nitroglycerin if not contraindicated. Monitor vital signs and symptoms closely. Obtain cardiology consult if ECG shows ischemic changes or cardiac enzymes are elevated. Rule out GERD with antacids or PPIs if cardiac workup is negative. Follow up with primary care physician for chronic disease management. Allergy precautions: None. Interaction checks: Monitor for potential interactions if medications are initiated. Monitoring needs: Continuous cardiac monitoring, serial ECGs and cardiac enzymes.`;

console.log('Testing SOAP notes parsing...');
const result = parseSOAPNotes(testNotes);
console.log('Parse result:', {
  isValid: result.isValid,
  format: result.format,
  errors: result.errors,
  sections: {
    subjective: result.subjective.substring(0, 100) + '...',
    objective: result.objective.substring(0, 100) + '...',
    assessment: result.assessment.substring(0, 100) + '...',
    plan: result.plan.substring(0, 100) + '...'
  }
});
