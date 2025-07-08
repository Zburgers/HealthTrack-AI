import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getEmbeddings } from '@/lib/embedding';
import { z, ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Schema for creating local embeddings
const CreateEmbeddingSchema = z.object({
  patient_id: z.string().min(1),
  text: z.string().min(1),
  meta: z.record(z.any()).optional()
});

// Schema for querying local embeddings
const QueryEmbeddingSchema = z.object({
  patient_id: z.string().optional(),
  limit: z.number().int().positive().max(100).default(10)
});

/**
 * POST /api/local-embeddings
 * Create and store embeddings for local patient data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patient_id, text, meta } = CreateEmbeddingSchema.parse(body);

    // Get unified database connection
    const db = await getDb('local_embeddings');

    // Verify patient exists
    const patient = await db.collection('patients').findOne({ id: patient_id });
    if (!patient) {
      return NextResponse.json(
        { message: 'Patient not found' },
        { status: 404 }
      );
    }

    // Generate embedding using Vertex AI
    const embeddingsArray = await getEmbeddings([text]);
    
    if (!embeddingsArray || embeddingsArray.length === 0 || !embeddingsArray[0]) {
      return NextResponse.json(
        { message: 'Failed to generate embedding' },
        { status: 500 }
      );
    }

    const embedding = embeddingsArray[0];

    // Store in local_embeddings table
    const embeddingDoc = {
      id: uuidv4(),
      patient_id,
      embedding,
      meta: meta || {},
      created_at: new Date().toISOString()
    };

    await db.collection('local_embeddings').insertOne(embeddingDoc);

    return NextResponse.json({
      id: embeddingDoc.id,
      patient_id,
      created_at: embeddingDoc.created_at,
      meta: embeddingDoc.meta
    }, { status: 201 });

  } catch (error) {
    console.error('[Local Embeddings POST] Error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/local-embeddings
 * Retrieve local embeddings with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const queryParams = {
      patient_id: url.searchParams.get('patient_id') || undefined,
      limit: limitParam ? Number(limitParam) : undefined
    };

    const { patient_id, limit } = QueryEmbeddingSchema.parse(queryParams);

    // Get unified database connection
    const db = await getDb('local_embeddings');

    // Build query
    const filter: any = {};
    if (patient_id) {
      filter.patient_id = patient_id;
    }

    // Retrieve embeddings (excluding the actual embedding vector for performance)
    const allEmbeddings = await db.collection('local_embeddings').find(filter);

    // Filter out embedding vector for performance and sort by created_at
    const sortedEmbeddings = allEmbeddings
      .map((embedding: any) => ({
        id: embedding.id,
        patient_id: embedding.patient_id,
        meta: embedding.meta,
        created_at: embedding.created_at
      }))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    return NextResponse.json({
      embeddings: sortedEmbeddings,
      count: sortedEmbeddings.length
    }, { status: 200 });

  } catch (error) {
    console.error('[Local Embeddings GET] Error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: 'Invalid query parameters', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
