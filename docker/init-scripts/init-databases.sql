-- ============================================================
-- HealthTrack AI - Database Initialization Script
-- Runs automatically on first PostgreSQL container startup
-- via /docker-entrypoint-initdb.d/
-- ============================================================

-- Create the primary application database
-- (If POSTGRES_DB is set via env vars, this is redundant but harmless)
SELECT 'CREATE DATABASE healthtrack'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'healthtrack')\gexec

-- Connect to the healthtrack database
\c healthtrack;

-- Enable pgvector extension for vector similarity search
-- Required for semantic search, embeddings, and AI-powered features
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a sample vector table for case similarity search
-- Adjust dimensions (384 = default BioBERT/embedding model output size)
-- to match your actual embedding model dimensions
CREATE TABLE IF NOT EXISTS case_embeddings (
    id SERIAL PRIMARY KEY,
    case_id VARCHAR(255) NOT NULL,
    case_text TEXT NOT NULL,
    embedding vector(384),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for efficient vector similarity search
-- Uses ivfflat for approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS case_embeddings_embedding_idx
    ON case_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO healthtrack;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO healthtrack;

-- Confirmation
SELECT 'Database initialization complete: healthtrack + pgvector extension' AS status;
