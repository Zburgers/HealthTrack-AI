-- ============================================================
-- HealthTrack AI - Seed Data
-- ============================================================
-- This file is a placeholder for basic seed data.
--
-- For production seed data, use the Drizzle seeder:
--   cd backend && npm run db:seed
--
-- Or add INSERT statements below for initial reference data.
-- ============================================================

\c healthtrack;

-- Example: Insert a sample case embedding record
-- Uncomment and adjust values as needed.
--
-- INSERT INTO case_embeddings (case_id, case_text, embedding)
-- VALUES
--     ('CASE-001', 'Sample medical case description', '[0.1, 0.2, 0.3, ...]'),
--     ('CASE-002', 'Another sample case', '[0.4, 0.5, 0.6, ...]')
-- ON CONFLICT DO NOTHING;

-- Note: Vector embeddings must match the dimension declared in the
-- table schema (default 384). Generate actual embeddings via your
-- embedding model (BioBERT, Vertex AI, etc.) rather than using
-- placeholder values.

SELECT 'Seed data script executed. Add your seed INSERT statements above.' AS status;
