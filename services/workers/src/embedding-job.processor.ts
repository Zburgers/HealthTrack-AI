import { Pool } from 'pg';
import { HfInference } from '@huggingface/inference';
import { generateBioEmbedding } from './mastra-embedding-tool';

interface ProcessorConfig {
  databaseUrl: string;
  hfKey: string;
  batchSize: number;
  pollingIntervalMs: number;
}

export class EmbeddingJobProcessor {
  private pool: Pool;
  private hf: HfInference;
  private running = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly config: ProcessorConfig) {
    this.pool = new Pool({
      connectionString: config.databaseUrl,
    });
    this.hf = new HfInference(config.hfKey);
  }

  async start(): Promise<void> {
    this.running = true;
    console.log('🚀 EmbeddingJobProcessor started');
    console.log(`   Batch size: ${this.config.batchSize}`);
    console.log(`   Polling interval: ${this.config.pollingIntervalMs}ms`);

    // Run immediately, then poll
    await this.processBatch();
    this.scheduleNextRun();
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.pool.end();
    console.log('🛑 EmbeddingJobProcessor stopped');
  }

  private scheduleNextRun(): void {
    if (!this.running) return;

    this.timer = setTimeout(async () => {
      await this.processBatch();
      this.scheduleNextRun();
    }, this.config.pollingIntervalMs);
  }

  /**
   * Process a batch of cases without embeddings.
   */
  async processBatch(): Promise<void> {
    try {
      const casesToEmbed = await this.getPendingCases(this.config.batchSize);

      if (casesToEmbed.length === 0) {
        console.log('✅ No pending cases to embed');
        return;
      }

      console.log(`📦 Processing ${casesToEmbed.length} cases...`);

      for (const caseData of casesToEmbed) {
        try {
          await this.processCase(caseData);
        } catch (error) {
          console.error(`❌ Failed to process case ${caseData.id}:`, error);
        }
      }

      console.log(`✅ Completed batch of ${casesToEmbed.length} cases`);
    } catch (error) {
      console.error('❌ Error processing batch:', error);
    }
  }

  /**
   * Get cases that don't have embeddings yet.
   */
  private async getPendingCases(limit: number): Promise<Array<{ id: string; note: string }>> {
    const result = await this.pool.query(`
      SELECT mc.id, mc.note
      FROM mimic_cases mc
      LEFT JOIN case_embeddings ce ON ce.case_id = mc.id
      WHERE ce.id IS NULL
        AND mc.note IS NOT NULL
        AND mc.note != ''
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  /**
   * Generate and store embedding for a single case.
   */
  private async processCase(caseData: { id: string; note: string }): Promise<void> {
    console.log(`  🔍 Generating embedding for case ${caseData.id}`);

    const embedding = await generateBioEmbedding(this.hf, caseData.note);

    const embeddingStr = `[${embedding.join(',')}]`;

    await this.pool.query(
      `INSERT INTO case_embeddings (case_id, embedding, model)
       VALUES ($1, $2::vector, $3)
       ON CONFLICT DO NOTHING`,
      [caseData.id, embeddingStr, 'biobert-v1.1']
    );

    console.log(`  ✅ Embedded case ${caseData.id}`);
  }
}
