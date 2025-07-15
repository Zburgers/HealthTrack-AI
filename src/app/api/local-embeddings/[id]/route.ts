import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db'; // Updated import

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

    // Get database instance for local_embeddings collection
    const db = await getDatabase('local_embeddings');
    const embeddingsCollection = db.collection('local_embeddings');

    // Retrieve the specific embedding
    const embedding = await embeddingsCollection.findOne({ id });

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

    // Get database instance for local_embeddings collection
    const db = await getDatabase('local_embeddings');
    const embeddingsCollection = db.collection('local_embeddings');

    // Delete the embedding
    const result = await embeddingsCollection.deleteOne({ id });

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
