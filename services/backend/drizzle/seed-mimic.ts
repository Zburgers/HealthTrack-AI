import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from './schema';
import { mimicCases, caseEmbeddings } from './schema';

/**
 * MIMIC-IV seed data script.
 * Inserts realistic clinical cases from the MIMIC-IV dataset structure.
 * 
 * Run with: npm run db:seed:mimic
 * Or: tsx drizzle/seed-mimic.ts
 */

interface MimicCaseSeed {
  subjectId: number;
  hadmId: number;
  age: number;
  sex: string;
  icd: string[];
  icdLabel: string[];
  note: string;
  vitals?: {
    bp: string | null;
    hr: number | null;
    rr: number | null;
    spo2: number | null;
    temp: number | null;
  };
  outcomes?: {
    result?: string;
    followUp?: string;
    dischargeStatus?: string;
    lengthOfStay?: number;
    complications?: string[];
  };
  treatments?: {
    medications?: string[];
    procedures?: string[];
    interventions?: string[];
    timeline?: Array<{ date: string; action: string }>;
  };
  diagnostics?: {
    tests?: string[];
    results?: string[];
    imaging?: string[];
    labs?: string[];
  };
  metadata?: {
    complexityScore?: number;
    outcomeClass?: string;
    admissionType?: string;
    caseDate?: Date;
  };
}

const mimicCasesData: MimicCaseSeed[] = [
  {
    subjectId: 1001,
    hadmId: 20001,
    age: 68,
    sex: 'M',
    icd: ['I50.9', 'I25.10', 'E11.9'],
    icdLabel: ['Heart failure, unspecified', 'Atherosclerotic heart disease', 'Type 2 diabetes mellitus'],
    note: `68-year-old male presented with worsening dyspnea on exertion and bilateral lower extremity edema. 
Patient has a history of congestive heart failure and coronary artery disease. 
Physical examination revealed jugular venous distension, S3 gallop, and 2+ pitting edema. 
BNP elevated at 1,200 pg/mL. Chest X-ray shows cardiomegaly with pulmonary vascular congestion.
Started on IV furosemide with good diuretic response. 
Echocardiogram reveals EF of 35% with global hypokinesis. 
Patient stabilized and transitioned to oral diuretics. 
Discharged on guideline-directed medical therapy for HFrEF.`,
    vitals: { bp: '145/92', hr: 98, rr: 22, spo2: 92, temp: 37.1 },
    outcomes: {
      result: 'Improved',
      dischargeStatus: 'Stable',
      lengthOfStay: 5,
      complications: ['Acute decompensated heart failure'],
    },
    treatments: {
      medications: ['Furosemide', 'Lisinopril', 'Carvedilol', 'Spironolactone', 'Metformin'],
      procedures: ['Echocardiography', 'Cardiac catheterization'],
      interventions: ['IV diuresis', 'Dietary sodium restriction', 'Fluid restriction'],
    },
    diagnostics: {
      tests: ['BNP', 'Basic metabolic panel', 'Troponin'],
      results: ['BNP 1,200 pg/mL', 'Creatinine 1.3 mg/dL', 'Troponin negative'],
      imaging: ['Chest X-ray', 'Echocardiogram'],
      labs: ['BMP', 'CBC', 'BNP', 'Troponin'],
    },
    metadata: {
      complexityScore: 0.75,
      outcomeClass: 'favorable',
      admissionType: 'Emergency',
      caseDate: new Date('2024-03-15'),
    },
  },
  {
    subjectId: 1002,
    hadmId: 20002,
    age: 45,
    sex: 'F',
    icd: ['J18.9', 'J96.0', 'D64.9'],
    icdLabel: ['Pneumonia, unspecified organism', 'Acute respiratory failure', 'Anemia, unspecified'],
    note: `45-year-old female admitted with high fever, productive cough, and acute hypoxemic respiratory failure.
Chest CT shows bilateral consolidations, predominantly in lower lobes. 
SpO2 was 82% on room air, improved to 94% on 4L NC.
Sputum culture pending. Started on empiric vancomycin + cefepime.
Procalcitonin elevated at 2.8 ng/mL. WBC 18,500 with left shift.
Required brief period of high-flow nasal cannula before stepping down.
Blood cultures negative at 48 hours. 
Transitioned to oral levofloxacin after clinical improvement.`,
    vitals: { bp: '110/68', hr: 112, rr: 28, spo2: 82, temp: 39.2 },
    outcomes: {
      result: 'Improved',
      dischargeStatus: 'Stable',
      lengthOfStay: 7,
      complications: ['Acute respiratory failure', 'Sepsis'],
    },
    treatments: {
      medications: ['Vancomycin', 'Cefepime', 'Levofloxacin', 'Acetaminophen', 'Albuterol nebulizer'],
      procedures: ['Chest CT', 'Sputum culture', 'Blood cultures'],
      interventions: ['High-flow nasal cannula', 'Oxygen therapy', 'IV fluids'],
    },
    diagnostics: {
      tests: ['Procalcitonin', 'CBC with differential', 'Blood culture', 'Sputum culture'],
      results: ['Procalcitonin 2.8 ng/mL', 'WBC 18,500', 'Blood cx negative'],
      imaging: ['Chest CT', 'Chest X-ray'],
      labs: ['CBC', 'CMP', 'Procalcitonin', 'Lactate'],
    },
    metadata: {
      complexityScore: 0.82,
      outcomeClass: 'favorable',
      admissionType: 'Emergency',
      caseDate: new Date('2024-04-02'),
    },
  },
  {
    subjectId: 1003,
    hadmId: 20003,
    age: 72,
    sex: 'M',
    icd: ['I63.9', 'I10', 'E78.5'],
    icdLabel: ['Cerebral infarction', 'Essential hypertension', 'Hyperlipidemia'],
    note: `72-year-old male with sudden onset right-sided weakness and expressive aphasia.
Last known well 2 hours before arrival. NIHSS score of 12.
Non-contrast CT head negative for hemorrhage. CTA shows left MCA occlusion.
Patient received IV alteplase within 3-hour window.
Post-tPA CT shows no hemorrhagic transformation.
Transferred to neuro ICU for close monitoring.
Gradual improvement in motor strength over 48 hours. 
Started on aspirin, high-intensity statin, and antihypertensives.
Speech therapy evaluation completed. Discharged to acute rehab.`,
    vitals: { bp: '178/95', hr: 88, rr: 18, spo2: 97, temp: 36.8 },
    outcomes: {
      result: 'Improved with residual deficits',
      dischargeStatus: 'Transferred to rehab',
      lengthOfStay: 8,
      complications: ['Ischemic stroke', 'Expressive aphasia'],
    },
    treatments: {
      medications: ['Alteplase', 'Aspirin', 'Atorvastatin', 'Lisinopril', 'Amlodipine'],
      procedures: ['CT head without contrast', 'CTA head and neck', 'Neurological assessment'],
      interventions: ['Thrombolysis', 'Neuro ICU monitoring', 'Speech therapy', 'Physical therapy'],
      timeline: [
        { date: '2024-01-10', action: 'Arrived at ED, NIHSS 12' },
        { date: '2024-01-10', action: 'Received IV alteplase' },
        { date: '2024-01-12', action: 'Neuro ICU transfer' },
        { date: '2024-01-15', action: 'Started rehab therapy' },
        { date: '2024-01-18', action: 'Discharged to acute rehab' },
      ],
    },
    diagnostics: {
      tests: ['NIHSS', 'Coagulation panel', 'Lipid panel'],
      results: ['NIHSS 12', 'INR 1.0', 'LDL 145 mg/dL'],
      imaging: ['CT head', 'CTA head/neck', 'MRI brain'],
      labs: ['CBC', 'CMP', 'Coags', 'Lipid panel', 'HbA1c'],
    },
    metadata: {
      complexityScore: 0.90,
      outcomeClass: 'partial recovery',
      admissionType: 'Emergency',
      caseDate: new Date('2024-01-10'),
    },
  },
  {
    subjectId: 1004,
    hadmId: 20004,
    age: 55,
    sex: 'F',
    icd: ['K80.20', 'K83.0', 'E66.01'],
    icdLabel: ['Cholelithiasis without cholecystitis', 'Cholangitis', 'Morbid obesity'],
    note: `55-year-old female with right upper quadrant pain, fever, and jaundice.
Charcot's triad present. Total bilirubin 4.2 mg/dL, direct 3.1.
Ultrasound shows choledocholithiasis with CBD dilation to 12mm.
ERCP performed with sphincterotomy and stone extraction.
Post-procedure bilirubin decreased to 1.8 mg/dL.
Patient improved clinically and scheduled for elective laparoscopic cholecystectomy.
BMI 42. Discussed weight management and metabolic surgery referral.`,
    vitals: { bp: '132/78', hr: 102, rr: 20, spo2: 96, temp: 38.5 },
    outcomes: {
      result: 'Resolved',
      dischargeStatus: 'Stable',
      lengthOfStay: 4,
      complications: ['Choledocholithiasis', 'Acute cholangitis'],
    },
    treatments: {
      medications: ['Piperacillin-tazobactam', 'Ondansetron', 'Morphine', 'Ursodiol'],
      procedures: ['ERCP with sphincterotomy', 'Abdominal ultrasound', 'MRCP'],
      interventions: ['Biliary decompression', 'Stone extraction', 'IV antibiotics'],
    },
    diagnostics: {
      tests: ['Liver function tests', 'Lipase', 'CBC'],
      results: ['Total bilirubin 4.2', 'ALP 320', 'WBC 14,200'],
      imaging: ['Abdominal ultrasound', 'MRCP'],
      labs: ['CMP', 'CBC', 'Lipase', 'Coags'],
    },
    metadata: {
      complexityScore: 0.65,
      outcomeClass: 'favorable',
      admissionType: 'Emergency',
      caseDate: new Date('2024-05-20'),
    },
  },
  {
    subjectId: 1005,
    hadmId: 20005,
    age: 80,
    sex: 'F',
    icd: ['N18.9', 'E87.6', 'D63.0'],
    icdLabel: ['Chronic kidney disease, unspecified', 'Hyperkalemia', 'Anemia in neoplastic disease'],
    note: `80-year-old female with CKD stage 4 presenting with hyperkalemia (K+ 6.2 mEq/L).
ECG shows peaked T-waves. No chest pain or palpitations.
Medications include lisinopril and spironolactone, both held.
Treated with calcium gluconate, insulin/dextrose, and patiromer.
Repeat K+ decreased to 5.1 mEq/L after 24 hours.
Baseline creatinine 2.1 mg/dL (eGFR ~22). 
Nephrology consulted for CKD management and dialysis planning.
Patient educated on low-potassium diet. Discharged with close nephrology follow-up.`,
    vitals: { bp: '155/85', hr: 72, rr: 16, spo2: 96, temp: 36.5 },
    outcomes: {
      result: 'Improved',
      dischargeStatus: 'Stable',
      lengthOfStay: 3,
      complications: ['Hyperkalemia', 'CKD stage 4'],
    },
    treatments: {
      medications: ['Calcium gluconate', 'Insulin/dextrose', 'Patiromer', 'Sodium bicarbonate', 'Sevelamer'],
      procedures: ['ECG', 'Renal ultrasound', 'Nephrology consultation'],
      interventions: ['Potassium-lowering therapy', 'Dietary modification', 'Medication reconciliation'],
    },
    diagnostics: {
      tests: ['Basic metabolic panel', 'CBC', 'Iron studies', 'PTH'],
      results: ['K+ 6.2 mEq/L', 'Creatinine 2.1 mg/dL', 'Hgb 9.2 g/dL'],
      imaging: ['Renal ultrasound'],
      labs: ['BMP', 'CBC', 'Iron studies', 'PTH', 'Urinalysis'],
    },
    metadata: {
      complexityScore: 0.70,
      outcomeClass: 'favorable',
      admissionType: 'Urgent',
      caseDate: new Date('2024-06-08'),
    },
  },
  {
    subjectId: 1006,
    hadmId: 20006,
    age: 34,
    sex: 'M',
    icd: ['S72.001A', 'T84.030A', 'Z96.642'],
    icdLabel: ['Fracture of neck of right femur', 'Mechanical complication of right knee prosthesis', 'Presence of artificial knee joint'],
    note: `34-year-old male involved in motor vehicle collision with right hip fracture.
Also has mechanical complication of existing right total knee arthroplasty.
CT pelvis shows displaced femoral neck fracture (Garden IV).
Orthopedic surgery performed ORIF with cannulated screws.
Post-op course complicated by wound drainage, treated with IV antibiotics.
Physical therapy initiated on POD 1. 
Knee prosthesis evaluation recommended for outpatient revision.
Discharged to subacute rehab with weight-bearing restrictions.`,
    vitals: { bp: '128/76', hr: 88, rr: 18, spo2: 98, temp: 37.3 },
    outcomes: {
      result: 'Recovering',
      dischargeStatus: 'Transferred to subacute rehab',
      lengthOfStay: 6,
      complications: ['Wound infection', 'Mechanical prosthesis complication'],
    },
    treatments: {
      medications: ['Cefazolin', 'Enoxaparin', 'Oxycodone', 'Ibuprofen', 'Docusate'],
      procedures: ['ORIF femoral neck', 'CT pelvis', 'Hip X-rays'],
      interventions: ['Physical therapy', 'DVT prophylaxis', 'Wound care'],
    },
    diagnostics: {
      tests: ['CBC', 'CMP', 'Coags', 'Type and screen'],
      results: ['Hgb 11.2 g/dL', 'WBC 11,800', 'Platelets 245,000'],
      imaging: ['X-ray right hip', 'CT pelvis', 'X-ray right knee'],
      labs: ['CBC', 'CMP', 'Coags', 'CRP'],
    },
    metadata: {
      complexityScore: 0.78,
      outcomeClass: 'partial recovery',
      admissionType: 'Emergency',
      caseDate: new Date('2024-07-14'),
    },
  },
  {
    subjectId: 1007,
    hadmId: 20007,
    age: 62,
    sex: 'M',
    icd: ['C34.11', 'J90', 'R05.9'],
    icdLabel: ['Malignant neoplasm of right upper lobe, bronchus or lung', 'Pleural effusion', 'Cough'],
    note: `62-year-old male with 40-pack-year smoking history presenting with chronic cough and weight loss.
CT chest reveals 3.5 cm right upper lobe mass with mediastinal lymphadenopathy.
CT-guided biopsy confirms non-small cell lung cancer, adenocarcinoma.
PET-CT shows FDG-avid right upper lobe mass with ipsilateral hilar nodes.
Pulmonary function tests adequate for resection.
Thoracic surgery performed right upper lobectomy with mediastinal lymph node dissection.
Pathology: Stage IIB (T2bN1M0), EGFR wild-type, PD-L1 60%.
Oncology recommends adjuvant carboplatin/pemetrexed x 4 cycles, then durvalumab.`,
    vitals: { bp: '138/82', hr: 76, rr: 18, spo2: 94, temp: 36.9 },
    outcomes: {
      result: 'Post-operative, awaiting adjuvant therapy',
      dischargeStatus: 'Stable',
      lengthOfStay: 5,
      complications: ['Malignant pleural effusion'],
    },
    treatments: {
      medications: ['Ondansetron', 'Dexamethasone', 'Hydromorphone', 'Enoxaparin'],
      procedures: ['Right upper lobectomy', 'Mediastinal lymph node dissection', 'CT-guided biopsy'],
      interventions: ['Chemotherapy planning', 'Immunotherapy planning', 'Smoking cessation counseling'],
    },
    diagnostics: {
      tests: ['PFTs', 'EGFR mutation testing', 'PD-L1 expression'],
      results: ['FEV1 78% predicted', 'EGFR wild-type', 'PD-L1 60%'],
      imaging: ['CT chest with contrast', 'PET-CT', 'Brain MRI'],
      labs: ['CBC', 'CMP', 'Tumor markers', 'Coags'],
    },
    metadata: {
      complexityScore: 0.88,
      outcomeClass: 'ongoing treatment',
      admissionType: 'Elective',
      caseDate: new Date('2024-02-28'),
    },
  },
  {
    subjectId: 1008,
    hadmId: 20008,
    age: 28,
    sex: 'F',
    icd: ['O80', 'Z37.0', 'Z23'],
    icdLabel: ['Encounter for full-term uncomplicated delivery', 'Single liveborn infant', 'Encounter for immunization'],
    note: `28-year-old G1P1 at 39 weeks 2 days presented in spontaneous labor.
Prenatal course uncomplicated. Group B strep negative.
Admitted at 4 cm dilation, progressed normally.
Epidural analgesia administered. 
Spontaneous vaginal delivery of healthy male infant, 3,400g, Apgars 8 and 9.
Placenta delivered intact. Uterus firm, bleeding controlled.
Tdap and rubella vaccines administered (rubella non-immune during pregnancy).
Mother and baby roomed-in. Lactation support provided.
Discharged on POD 2 with routine OB follow-up.`,
    vitals: { bp: '118/72', hr: 78, rr: 16, spo2: 99, temp: 37.0 },
    outcomes: {
      result: 'Normal delivery',
      dischargeStatus: 'Discharged',
      lengthOfStay: 2,
    },
    treatments: {
      medications: ['Ibuprofen', 'Docusate', 'Prenatal vitamins', 'Tdap vaccine', 'MMR vaccine'],
      procedures: ['Spontaneous vaginal delivery', 'Epidural anesthesia', 'Perineal repair'],
      interventions: ['Lactation support', 'Newborn care education'],
    },
    diagnostics: {
      tests: ['CBC', 'Blood type and screen', 'GBS screening'],
      results: ['Hgb 12.1 g/dL', 'O positive', 'GBS negative'],
      imaging: ['Fetal heart rate monitoring'],
      labs: ['CBC', 'Blood type'],
    },
    metadata: {
      complexityScore: 0.20,
      outcomeClass: 'favorable',
      admissionType: 'Elective',
      caseDate: new Date('2024-08-05'),
    },
  },
];

// Generate random embeddings (simulated BioBERT 768-dim vectors)
// In production, these would come from the actual BioBERT embedding pipeline
function generateRandomEmbedding(dimensions: number = 768): number[] {
  const embedding: number[] = [];
  for (let i = 0; i < dimensions; i++) {
    // Generate values between -1 and 1 (typical for normalized embeddings)
    embedding.push(Math.random() * 2 - 1);
  }
  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map((val) => val / magnitude);
}

async function seedMimicCases() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://healthtrack:healthtrack@localhost:5432/healthtrack',
  });

  const db = drizzle(pool, { schema });

  try {
    console.log('Starting MIMIC-IV case seeding...');

    for (const caseData of mimicCasesData) {
      // Check if case already exists
      const existing = await db
        .select()
        .from(mimicCases)
        .where(and(eq(mimicCases.subjectId, caseData.subjectId), eq(mimicCases.hadmId, caseData.hadmId)))
        .limit(1);

      if (existing.length > 0) {
        console.log(`Skipping case ${caseData.subjectId}/${caseData.hadmId} (already exists)`);
        continue;
      }

      // Insert the case
      const [insertedCase] = await db
        .insert(mimicCases)
        .values({
          subjectId: caseData.subjectId,
          hadmId: caseData.hadmId,
          age: caseData.age,
          sex: caseData.sex,
          icd: caseData.icd,
          icdLabel: caseData.icdLabel,
          note: caseData.note,
          vitals: caseData.vitals as any,
          outcomes: caseData.outcomes as any,
          treatments: caseData.treatments as any,
          diagnostics: caseData.diagnostics as any,
          metadata: caseData.metadata as any,
        })
        .returning();

      console.log(`Inserted case: ${insertedCase.subjectId}/${insertedCase.hadmId} - ${insertedCase.icdLabel[0]}`);

      // Generate and insert embedding using raw SQL (custom vector type needs array format)
      const embedding = generateRandomEmbedding(768);
      const embeddingStr = `[${embedding.join(',')}]`;
      await db.insert(caseEmbeddings).values({
        caseId: insertedCase.id,
        embedding: sql`${embeddingStr}::vector`,
        model: 'biobert-v1.1',
      } as any);

      console.log(`  -> Inserted 768-dim embedding for case ${insertedCase.id}`);
    }

    // Verify
    const caseCount = await db.select({ count: sql<number>`count(*)` }).from(mimicCases);
    const embeddingCount = await db.select({ count: sql<number>`count(*)` }).from(caseEmbeddings);
    console.log(`\nMIMIC-IV seeding complete:`);
    console.log(`  Cases: ${caseCount[0].count}`);
    console.log(`  Embeddings: ${embeddingCount[0].count}`);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedMimicCases();
