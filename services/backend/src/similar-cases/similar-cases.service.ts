import { Injectable, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DrizzlePgService } from '../database/drizzle-pg.service';
import { mimicCases } from '../../drizzle/schema';
import { SimilarCaseSearchDto } from './dto/similar-cases.dto';
import { HfInference } from '@huggingface/inference';

interface SimilarCaseResult {
  id: string;
  subjectId: number;
  hadmId: number;
  age: number;
  sex: string;
  diagnoses: string[];
  diagnosisLabels: string[];
  vitals: Record<string, unknown>;
  diagnostics: Record<string, unknown>;
  medications: string[];
  procedures: string[];
  clinicalNote: string;
  lengthOfStay: number;
  dischargeStatus: string;
  outcomeClass: string;
  complexityScore: number;
  distance: number;
}

@Injectable()
export class SimilarCasesService {
  private hf: HfInference;

  constructor(
    private readonly drizzle: DrizzlePgService,
  ) {
    this.hf = new HfInference(process.env.HF_KEY);
  }

  /**
   * Generate embedding for input case text.
   * Uses BioBERT via Hugging Face Inference API.
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.hf.featureExtraction({
      model: 'emilyalsentzer/Bio_ClinicalBERT',
      inputs: text,
    });

    // Response is a nested array, flatten to 768-dim vector
    if (Array.isArray(response[0][0])) {
      // Mean pool over token embeddings
      const tokens = response[0] as number[][];
      const dim = tokens[0].length;
      const pooled = new Array(dim).fill(0);
      for (const token of tokens) {
        for (let i = 0; i < dim; i++) {
          pooled[i] += token[i];
        }
      }
      return pooled.map(v => v / tokens.length);
    }

    return response[0] as number[];
  }

  /**
   * Prepare clinical text for embedding generation.
   * Combines all available case fields into a single input string.
   */
  private prepareInputText(input: SimilarCaseSearchDto): string {
    const parts: string[] = [];
    if (input.clinicalNote) parts.push(input.clinicalNote);
    if (input.patientInformation) parts.push(input.patientInformation);
    if (input.observations) parts.push(input.observations);
    if (input.diagnoses?.length) parts.push(input.diagnoses.join(', '));
    if (input.vitals) parts.push(JSON.stringify(input.vitals));
    return parts.join('\n');
  }

  /**
   * Search for similar cases using pgvector cosine similarity.
   * Returns ranked results with similarity scores.
   */
  async findSimilar(input: SimilarCaseSearchDto) {
    const text = this.prepareInputText(input);
    const embedding = await this.generateEmbedding(text);

    const embeddingArray = embedding.join(',');

    // Cosine similarity search via pgvector
    // pgvector uses <=> for cosine distance
    const results = await this.drizzle.db
      .select({
        id: mimicCases.id,
        subjectId: mimicCases.subjectId,
        hadmId: mimicCases.hadmId,
        age: mimicCases.age,
        sex: mimicCases.sex,
        diagnoses: mimicCases.icd,
        diagnosisLabels: mimicCases.icdLabel,
        vitals: mimicCases.vitals,
        diagnostics: mimicCases.diagnostics,
        treatments: mimicCases.treatments,
        outcomes: mimicCases.outcomes,
        metadata: mimicCases.metadata,
        clinicalNote: mimicCases.note,
        distance: sql<number>`
          (SELECT ce.embedding FROM case_embeddings ce WHERE ce.case_id = mimic_cases.id LIMIT 1) <=> ARRAY[${embeddingArray}]::vector(768)
        `,
      })
      .from(mimicCases)
      .where(sql`
        EXISTS (
          SELECT 1 FROM case_embeddings ce
          WHERE ce.case_id = mimic_cases.id
        )
      `)
      .orderBy(sql`
        (SELECT ce.embedding FROM case_embeddings ce WHERE ce.case_id = mimic_cases.id LIMIT 1) <=> ARRAY[${embeddingArray}]::vector(768)
      `)
      .limit(input.limit || 10);

    // Transform results to SimilarCaseOutput format
    return results.map((row) => ({
      id: row.id,
      matchConfidence: Math.max(0, 1 - (row.distance as number)),
      subject_id: row.subjectId,
      hadm_id: row.hadmId,
      age: row.age,
      sex: row.sex,
      icd: row.diagnoses || [],
      icd_label: row.diagnosisLabels || [],
      note: row.clinicalNote || '',
      vitals: row.vitals,
      diagnostics: row.diagnostics,
      treatments: row.treatments,
      outcomes: row.outcomes,
      metadata: row.metadata,
    }));
  }
}
