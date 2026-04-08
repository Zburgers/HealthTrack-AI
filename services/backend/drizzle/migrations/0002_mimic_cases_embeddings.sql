-- Custom migration: Add MIMIC-IV cases and case embeddings tables

-- Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- MIMIC-IV clinical cases table
CREATE TABLE IF NOT EXISTS mimic_cases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id integer NOT NULL,
    hadm_id integer NOT NULL,
    age integer NOT NULL,
    sex varchar(10),
    icd jsonb NOT NULL DEFAULT '[]',
    icd_label jsonb NOT NULL DEFAULT '[]',
    note text NOT NULL,
    vitals jsonb,
    outcomes jsonb,
    treatments jsonb,
    diagnostics jsonb,
    metadata jsonb,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

-- Indexes for mimic_cases
CREATE INDEX IF NOT EXISTS mimic_cases_subject_id_idx ON mimic_cases(subject_id);
CREATE INDEX IF NOT EXISTS mimic_cases_hadm_id_idx ON mimic_cases(hadm_id);
CREATE UNIQUE INDEX IF NOT EXISTS mimic_cases_subject_hadm_unique_idx ON mimic_cases(subject_id, hadm_id);
CREATE INDEX IF NOT EXISTS mimic_cases_age_idx ON mimic_cases(age);
CREATE INDEX IF NOT EXISTS mimic_cases_sex_idx ON mimic_cases(sex);

-- Drop old case_embeddings table if it exists (from previous Electron app)
-- and recreate with correct schema
DROP TABLE IF EXISTS case_embeddings CASCADE;

-- Case embeddings table with pgvector (768-dimensional BioBERT embeddings)
CREATE TABLE case_embeddings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES mimic_cases(id),
    embedding vector(768) NOT NULL,
    model varchar(50) NOT NULL DEFAULT 'biobert-v1.1',
    created_at timestamp NOT NULL DEFAULT now()
);

-- Indexes for case_embeddings
CREATE INDEX IF NOT EXISTS case_embeddings_case_id_idx ON case_embeddings(case_id);
CREATE INDEX IF NOT EXISTS case_embeddings_model_idx ON case_embeddings(model);

-- HNSW index for fast similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS case_embeddings_embedding_idx ON case_embeddings USING hnsw (embedding vector_cosine_ops);
