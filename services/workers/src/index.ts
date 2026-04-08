import { EmbeddingJobProcessor } from './embedding-job.processor';

async function main() {
  console.log('🔧 Starting HealthTrack Workers Service...');

  const processor = new EmbeddingJobProcessor({
    databaseUrl: process.env.DATABASE_URL || 'postgresql://healthtrack:healthtrack@localhost:5432/healthtrack',
    hfKey: process.env.HF_KEY || '',
    batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || '100', 10),
    pollingIntervalMs: parseInt(process.env.WORKER_POLLING_INTERVAL || '30000', 10),
  });

  await processor.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await processor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await processor.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('❌ Workers service failed:', error);
  process.exit(1);
});
