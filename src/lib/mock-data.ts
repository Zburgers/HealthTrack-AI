
import type { Patient, AIAnalysisOutput } from '@/types';

// Default AI analysis for patients who might not have a specific one
const defaultAiAnalysis: AIAnalysisOutput = {
  icd10Tags: [
    { code: 'R07.9', description: `Chest pain, unspecified. This code is used when a patient reports chest pain, but a more specific diagnosis has not been established. It serves as a preliminary diagnosis while further investigations are underway to determine the cause, which could range from benign musculoskeletal pain to serious cardiac conditions.` },
    { code: 'R06.02', description: `Shortness of breath (Dyspnea). This code is for the symptom of difficult or labored breathing. It is a common symptom for a wide range of disorders, including respiratory, cardiovascular, neuromuscular, and metabolic conditions. Evaluation is necessary to identify the underlying pathology.` }
  ],
  riskScore: 0.60, // Risk score between 0 and 1
  soapNotes: `S: Patient reports chest discomfort and occasional shortness of breath over the past week.
O: Vitals stable. Mild tenderness on palpation of left sternal border. Lungs clear.
A: Atypical chest pain. Consider musculoskeletal origin or GERD. Low to moderate cardiac risk.
P: Recommend ECG, consider stress test if symptoms persist. Lifestyle modifications advised.`
};

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Johnathan Doe',
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'man portrait',
    riskScore: 0.75, // 75%
    conditions: ['Hypertension', 'Diabetes'],
    lastVisit: '2024-07-15',
    age: 58,
    gender: 'Male',
    primaryComplaint: 'Chest pain for 2 days',
    vitals: { bp: '160/95 mmHg', hr: '88 bpm', rr: '18/min', temp: '37.1°C', spo2: '97%' },
    doctorsObservations: 'Patient appears anxious. Mild tenderness to palpation in epigastric region. Lungs clear to auscultation bilaterally. No pedal edema.',
    aiAnalysis: {
      icd10Tags: [
        { code: 'I10', description: `Essential (primary) hypertension. This is the most common type of high blood pressure, not caused by other medical conditions. It is a major risk factor for stroke, heart disease, and kidney failure. Management includes lifestyle changes and antihypertensive medications.` },
        { code: 'E11.9', description: `Type 2 diabetes mellitus without complications. A chronic condition that affects the way the body processes blood sugar (glucose). This diagnosis indicates the absence of common diabetic complications like neuropathy, nephropathy, or retinopathy at the time of assessment.` },
        { code: 'R07.4', description: `Chest pain, unspecified. Used for chest pain without a clear cause after initial examination. Given the patient's risk factors (hypertension, diabetes), this symptom requires careful evaluation to rule out cardiac ischemia.` }
      ],
      riskScore: 75,
      soapNotes: `S: 58 y/o male with hx of HTN and Diabetes presenting with chest pain for 2 days. Describes pain as pressure-like, non-radiating, 5/10 intensity.
O: BP 160/95, HR 88, RR 18, Temp 37.1C, SpO2 97%. ECG shows NSR, no acute ST-T changes. Mild epigastric tenderness.
A: Chest pain, likely multifactorial. Given risk factors, acute coronary syndrome needs to be considered, though current presentation less typical. Gastritis/GERD also possible.
P: Admit for observation, serial troponins, cardiology consult. Start aspirin, PPI. Monitor blood glucose closely.`
    },
    alert: { iconName: 'ShieldAlert', label: 'Urgent Review', colorClass: 'text-red-500', tooltip: 'Patient flagged for urgent review due to high risk factors.'}
  },
  {
    id: '2',
    name: 'Jane Smith',
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'woman portrait',
    riskScore: 0.45,
    conditions: ['Asthma', 'Allergies'],
    lastVisit: '2024-07-10',
    age: 34,
    gender: 'Female',
    primaryComplaint: 'Persistent cough and wheezing',
    vitals: { bp: '120/75 mmHg', hr: '76 bpm', rr: '20/min', temp: '36.8°C', spo2: '98%' },
    doctorsObservations: 'Mild expiratory wheezes heard bilaterally. Good air entry. No signs of respiratory distress currently.',
    aiAnalysis: {
      icd10Tags: [
        { code: 'J45.909', description: `Unspecified asthma without complication. This code is used for a patient diagnosed with asthma where the type is not specified and there are no acute exacerbations or other complications present. It represents a baseline diagnosis for ongoing management.` },
        { code: 'R05', description: `Cough. A symptom code for coughing, which can be a result of many conditions, including respiratory infections, asthma, allergies, or GERD. In this context, it is likely related to the patient's asthma.` },
        { code: 'T78.40XA', description: `Anaphylactic reaction due to unspecified food, initial encounter. This code indicates a severe, potentially life-threatening allergic reaction. "Initial encounter" specifies that this is the first time the patient is receiving active treatment for this specific event.` }
      ],
      riskScore: 45,
      soapNotes: `S: 34 y/o female with known asthma reports persistent cough and intermittent wheezing for 1 week, worse at night. Using albuterol inhaler 3-4 times/day.
O: BP 120/75, HR 76, RR 20, Temp 36.8C, SpO2 98%. Mild expiratory wheezes. PEFR 350L/min (baseline 450L/min).
A: Mild asthma exacerbation, likely triggered by recent environmental allergens.
P: Start short course of oral corticosteroids (prednisone 40mg daily for 5 days). Continue SABA PRN. Reinforce asthma action plan. Follow-up in 1 week or sooner if symptoms worsen.`
    },
    alert: { iconName: 'CalendarClock', label: 'Follow-up Due', colorClass: 'text-blue-500', tooltip: 'Scheduled follow-up approaching.'}
  },
  {
    id: '3',
    name: 'Robert Johnson',
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'senior man',
    riskScore: 0.90,
    conditions: ['Heart Disease', 'COPD'],
    lastVisit: '2024-06-18',
    age: 72,
    gender: 'Male',
    primaryComplaint: 'Shortness of breath for 3 days',
    vitals: { bp: '155/95 mmHg', hr: '105 bpm', rr: '24/min', temp: '38.1°C', spo2: '88%' },
    doctorsObservations: 'Patient appears in moderate distress. Audible wheezing. Crackles on auscultation. Cyanosis noted around lips.',
    aiAnalysis: {
      icd10Tags: [
        { code: 'J44.1', description: `Chronic obstructive pulmonary disease with (acute) exacerbation. This indicates a flare-up of COPD, leading to a worsening of respiratory symptoms. It requires immediate medical attention to prevent respiratory failure.` },
        { code: 'I50.9', description: `Heart failure, unspecified. A condition where the heart can't pump enough blood to meet the body's needs. "Unspecified" means the type of heart failure (e.g., systolic, diastolic) is not documented. This is a serious, chronic condition.` },
        { code: 'R06.02', description: `Shortness of breath (Dyspnea). A key symptom in both COPD exacerbation and heart failure. Its presence indicates significant respiratory or cardiac distress and is a primary focus of treatment.` }
      ],
      riskScore: 90,
      soapNotes: `S: 72 y/o male with hx of COPD and CHF presents with worsening shortness of breath, productive cough (yellow sputum), and fatigue for 3 days. Increased inhaler use with minimal relief.
O: BP 155/95, HR 105, RR 24, Temp 38.1C, SpO2 88% on RA. Appears dyspneic. Bilateral wheezes and crackles. Pitting edema 1+ BLE. Mild cyanosis.
A: Acute exacerbation of COPD, likely infectious. Possible concurrent CHF exacerbation. High risk for respiratory failure.
P: Immediate O2 support. Nebulized bronchodilators (Albuterol/Ipratropium). IV corticosteroids. IV antibiotics (e.g., Ceftriaxone + Azithromycin). ECG, CXR, ABG, BNP. Admit to hospital, consider ICU if no improvement.`
    },
     alert: { iconName: 'Bed', label: 'Admitted', colorClass: 'text-orange-500', tooltip: 'Patient is currently admitted.'}
  },
  {
    id: '4',
    name: 'Emily White',
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'young woman',
    riskScore: 0.20,
    conditions: ['Migraine'],
    lastVisit: '2024-07-20',
    age: 29,
    gender: 'Female',
    primaryComplaint: 'Severe headache with nausea',
    vitals: { bp: '115/70 mmHg', hr: '70 bpm', rr: '16/min', temp: '36.5°C', spo2: '99%' },
    doctorsObservations: 'Patient in dark room, photophobic. Neurological exam grossly intact. No focal deficits.',
    aiAnalysis: {
      icd10Tags: [
        { code: 'G43.909', description: `Migraine, unspecified, not intractable, without status migrainosus. This is a diagnosis for a migraine that does not have features of being difficult to treat (intractable) or being a continuous, prolonged attack (status migrainosus).` },
        { code: 'R51', description: `Headache. A general code for the symptom of a headache. It is often used as a supplementary code to a more specific diagnosis like migraine, or when the cause of the headache is not yet determined.` }
      ],
      riskScore: 20,
      soapNotes: `S: 29 y/o female with hx of migraines presents with severe throbbing right-sided headache for 6 hours, associated with nausea and photophobia. Denies aura. Usual rescue medication (sumatriptan) ineffective.
O: BP 115/70, HR 70, RR 16, Temp 36.5C, SpO2 99%. Appears uncomfortable. Prefers dark environment. Neuro exam WNL.
A: Acute migraine exacerbation, refractory to home treatment.
P: Administer parenteral antiemetic (e.g., ondansetron) and abortive migraine therapy (e.g., ketorolac IM or IV). Provide hydration. Discuss migraine triggers and prophylactic options if attacks are frequent. Follow up with primary care or neurologist.`
    },
  },
  {
    id: '5',
    name: 'Michael Brown',
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'middle-aged man',
    riskScore: 0.55,
    conditions: ['Gastroenteritis', 'Dehydration'],
    lastVisit: '2024-07-01',
    age: 45,
    gender: 'Male',
    primaryComplaint: 'Vomiting and diarrhea for 24 hours',
    vitals: { bp: '110/70 mmHg', hr: '95 bpm', rr: '18/min', temp: '37.8°C', spo2: '96%' },
    doctorsObservations: 'Patient appears lethargic. Dry mucous membranes. Abdomen soft, non-tender, hyperactive bowel sounds.',
    aiAnalysis: defaultAiAnalysis,
  },
  {
    id: '6',
    name: 'Sarah Davis',
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'woman professional',
    riskScore: 0.15,
    conditions: ['Anxiety', 'Insomnia'],
    lastVisit: '2024-05-25',
    age: 38,
    gender: 'Female',
    primaryComplaint: 'Difficulty sleeping and persistent worry',
    vitals: { bp: '125/80 mmHg', hr: '80 bpm', rr: '16/min', temp: '36.7°C', spo2: '99%' },
    doctorsObservations: 'Patient appears well-nourished, slightly fidgety. Affect is anxious but appropriate. Normal thought process.',
    aiAnalysis: {
      ...defaultAiAnalysis,
      riskScore: 15,
      icd10Tags: [
        { code: 'F41.1', description: `Generalized anxiety disorder. A mental health condition characterized by excessive, uncontrollable worry about everyday things. It can interfere with daily activities and may be accompanied by physical symptoms like fatigue and muscle tension.` },
        { code: 'G47.00', description: `Insomnia, unspecified. A sleep disorder characterized by difficulty falling asleep, staying asleep, or getting good-quality sleep. It is often linked to stress, anxiety, or other medical conditions.` }
      ]
    },
  },
];
