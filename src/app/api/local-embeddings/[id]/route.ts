import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * GET /api/local-embeddings/[id]
 * Retrieve a specific local embedding by ID (including the embedding vector)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { message: 'Invalid embedding ID' },
        { status: 400 }
      );
    }

    // Get unified database connection
    const db = await getDb('local_embeddings');

    // Retrieve the specific embedding
    const embedding = await db.collection('local_embeddings').findOne({ id });

    if (!embedding) {
      return NextResponse.json(
        { message: 'Embedding not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(embedding, { status: 200 });

  } catch (error) {
    console.error('[Local Embeddings GET by ID] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/local-embeddings/[id]
 * Delete a specific local embedding by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { message: 'Invalid embedding ID' },
        { status: 400 }
      );
    }

    // Get unified database connection
    const db = await getDb('local_embeddings');

    // Delete the embedding
    const result = await db.collection('local_embeddings').deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: 'Embedding not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Embedding deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('[Local Embeddings DELETE] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
