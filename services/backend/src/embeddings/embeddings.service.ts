import { Injectable } from '@nestjs/common';
import { eq, notInArray } from 'drizzle-orm';
import { DrizzlePgService } from '../database/drizzle-pg.service';
import { mimicCases, caseEmbeddings } from '../../drizzle/schema';
import { HfInference } from '@huggingface/inference';
import { sql } from 'drizzle-orm';

@Injectable()
export class EmbeddingsService {
  private hf: HfInference;

  constructor(private readonly drizzle: DrizzlePgService) {
    this.hf = new HfInference(process.env.HF_KEY);
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.hf.featureExtraction({
      model: 'emilyalsentzer/Bio_ClinicalBERT',
      inputs: text,
    });
    if (Array.isArray(response[0][0])) {
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

  async generateForCase(caseId: string): Promise<void> {
    const cases = await this.drizzle.db
      .select({ note: mimicCases.note })
      .from(mimicCases)
      .where(eq(mimicCases.id, caseId));

    if (!cases.length || !cases[0].note) return;

    const embedding = await this.generateEmbedding(cases[0].note);

    // Check if embed already exists
    const existing = await this.drizzle.db
      .select()
      .from(caseEmbeddings)
      .where(eq(caseEmbeddings.caseId, caseId));

    if (existing.length === 0) {
      const embeddingStr = `[${embedding.join(',')}]`;
      await this.drizzle.db.execute(sql`
        INSERT INTO case_embeddings (case_id, embedding, model)
        VALUES (${caseId}, ${embeddingStr}::vector, 'biobert-v1.1')
        ON CONFLICT DO NOTHING
      `);
    }
  }

  async generateAllPending(): Promise<number> {
    // Get all case IDs that already have embeddings
    const embeddedCaseIds = await this.drizzle.db
      .select({ caseId: caseEmbeddings.caseId })
      .from(caseEmbeddings);

    const caseIdSet = new Set(embeddedCaseIds.map(c => c.caseId));

    // Get all cases
    const allCases = await this.drizzle.db
      .select({ id: mimicCases.id, note: mimicCases.note })
      .from(mimicCases);

    // Filter to only cases without embeddings
    const casesWithoutEmbeddings = allCases.filter(c => !caseIdSet.has(c.id));

    let count = 0;
    for (const caseData of casesWithoutEmbeddings) {
      if (caseData.note) {
        await this.generateForCase(caseData.id);
        count++;
      }
    }

    return count;
  }
}
