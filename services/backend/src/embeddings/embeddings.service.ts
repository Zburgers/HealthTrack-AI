import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzlePgService } from '../database/drizzle-pg.service';
import { mimicCases, caseEmbeddings } from '../../drizzle/schema';
import { HfInference } from '@huggingface/inference';

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
      await this.drizzle.db.insert(caseEmbeddings).values({
        caseId,
        embedding,
        model: 'biobert-v1.1',
      });
    }
  }

  async generateAllPending(): Promise<number> {
    // Get all cases without embeddings
    const casesWithoutEmbeddings = await this.drizzle.db
      .select({
        id: mimicCases.id,
        note: mimicCases.note,
      })
      .from(mimicCases)
      .where(eq(mimicCases.id, this.drizzle.db
        .select({ id: mimicCases.id })
        .from(mimicCases)
        .where(eq(mimicCases.id, mimicCases.id))
        .except(
          this.drizzle.db
            .select({ caseId: caseEmbeddings.caseId })
            .from(caseEmbeddings)
        )
      ));

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
