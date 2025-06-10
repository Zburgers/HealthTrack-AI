
import type { Patient } from '@/types';
import type { AnalyzePatientSymptomsOutput } from '@/ai/flows/analyze-patient-symptoms';

const defaultAiAnalysis: AnalyzePatientSymptomsOutput = {
  icd10Tags: ['R07.9', 'R06.02'],
  riskScore: 0.6,
  soapNotes: "S: Patient reports chest discomfort and occasional shortness of breath over the past week.\nO: Vitals stable. Mild tenderness on palpation of left sternal border. Lungs clear.\nA: Atypical chest pain. Consider musculoskeletal origin or GERD. Low to moderate cardiac risk.\nP: Recommend ECG, consider stress test if symptoms persist. Lifestyle modifications advised."
};

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'John Doe',
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'man portrait',
    riskScore: 0.75,
    conditions: ['Hypertension', 'Diabetes'],
    lastVisit: '2024-07-15',
    age: 58,
    gender: 'Male',
    primaryComplaint: 'Chest pain for 2 days',
    vitals: {
      bp: '160/95 mmHg',
      hr: '88 bpm',
      rr: '18/min',
      temp: '37.1°C',
      spo2: '97%',
    },
    doctorsObservations: 'Patient appears anxious. Mild tenderness to palpation in epigastric region. Lungs clear to auscultation bilaterally. No pedal edema.',
    aiAnalysis: {
      icd10Tags: ['I10', 'E11.9', 'R07.4'],
      riskScore: 0.75,
      soapNotes: "S: 58 y/o male with hx of HTN and Diabetes presenting with chest pain for 2 days. Describes pain as pressure-like, non-radiating, 5/10 intensity.\nO: BP 160/95, HR 88, RR 18, Temp 37.1C, SpO2 97%. ECG shows NSR, no acute ST-T changes. Mild epigastric tenderness.\nA: Chest pain, likely multifactorial. Given risk factors, acute coronary syndrome needs to be considered, though current presentation less typical. Gastritis/GERD also possible.\nP: Admit for observation, serial troponins, cardiology consult. Start aspirin, PPI. Monitor blood glucose closely."
    },
  },
  {
    id: '2',
    name: 'Jane Smith',
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'woman portrait',
    riskScore: 0.45,
    conditions: ['Asthma'],
    lastVisit: '2024-07-10',
    age: 34,
    gender: 'Female',
    primaryComplaint: 'Persistent cough and wheezing',
    vitals: {
      bp: '120/75 mmHg',
      hr: '76 bpm',
      rr: '20/min',
      temp: '36.8°C',
      spo2: '98%',
    },
    doctorsObservations: 'Mild expiratory wheezes heard bilaterally. Good air entry. No signs of respiratory distress currently.',
    aiAnalysis: {
      icd10Tags: ['J45.909', 'R05'],
      riskScore: 0.45,
      soapNotes: "S: 34 y/o female with known asthma reports persistent cough and intermittent wheezing for 1 week, worse at night. Using albuterol inhaler 3-4 times/day.\nO: BP 120/75, HR 76, RR 20, Temp 36.8C, SpO2 98%. Mild expiratory wheezes. PEFR 350L/min (baseline 450L/min).\nA: Mild asthma exacerbation, likely triggered by recent environmental allergens.\nP: Start short course of oral corticosteroids (prednisone 40mg daily for 5 days). Continue SABA PRN. Reinforce asthma action plan. Follow-up in 1 week or sooner if symptoms worsen."
    },
  },
  {
    id: '3',
    name: 'Robert Johnson',
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'senior man',
    riskScore: 0.90,
    conditions: ['Heart Disease', 'COPD'],
    lastVisit: '2024-07-18',
    age: 68,
    gender: 'Male',
    primaryComplaint: 'Shortness of breath for 3 days',
    vitals: {
      bp: '155/95 mmHg',
      hr: '105 bpm',
      rr: '24/min',
      temp: '38.1°C',
      spo2: '88%',
    },
    doctorsObservations: 'Patient appears in moderate distress. Audible wheezing. Crackles on auscultation. Cyanosis noted around lips.',
    aiAnalysis: {
      icd10Tags: ['J44.1', 'I50.9', 'R06.02'],
      riskScore: 0.90,
      soapNotes: "S: 68 y/o male with hx of COPD and CHF presents with worsening shortness of breath, productive cough (yellow sputum), and fatigue for 3 days. Increased inhaler use with minimal relief.\nO: BP 155/95, HR 105, RR 24, Temp 38.1C, SpO2 88% on RA. Appears dyspneic. Bilateral wheezes and crackles. Pitting edema 1+ BLE. Mild cyanosis.\nA: Acute exacerbation of COPD, likely infectious. Possible concurrent CHF exacerbation. High risk for respiratory failure.\nP: Immediate O2 support. Nebulized bronchodilators (Albuterol/Ipratropium). IV corticosteroids. IV antibiotics (e.g., Ceftriaxone + Azithromycin). ECG, CXR, ABG, BNP. Admit to hospital, consider ICU if no improvement."
    },
  },
  {
    id: '4',
    name: 'Emily White',
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'young woman',
    riskScore: 0.20,
    conditions: ['Migraine'],
    lastVisit: '2024-07-01',
    age: 29,
    gender: 'Female',
    primaryComplaint: 'Severe headache with nausea',
    vitals: {
      bp: '115/70 mmHg',
      hr: '70 bpm',
      rr: '16/min',
      temp: '36.5°C',
      spo2: '99%',
    },
    doctorsObservations: 'Patient in dark room, photophobic. Neurological exam grossly intact. No focal deficits.',
    aiAnalysis: {
      icd10Tags: ['G43.909', 'R51'],
      riskScore: 0.20,
      soapNotes: "S: 29 y/o female with hx of migraines presents with severe throbbing right-sided headache for 6 hours, associated with nausea and photophobia. Denies aura. Usual rescue medication (sumatriptan) ineffective.\nO: BP 115/70, HR 70, RR 16, Temp 36.5C, SpO2 99%. Appears uncomfortable. Prefers dark environment. Neuro exam WNL.\nA: Acute migraine exacerbation, refractory to home treatment.\nP: Administer parenteral antiemetic (e.g., ondansetron) and abortive migraine therapy (e.g., ketorolac IM or IV). Provide hydration. Discuss migraine triggers and prophylactic options if attacks are frequent. Follow up with primary care or neurologist."
    },
  },
];
