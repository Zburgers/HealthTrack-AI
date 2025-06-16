import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { CaseEmbeddingDocument } from '@/types/similar-cases';

export const dynamic = 'force-dynamic';

/**
 * GET /api/case-details/[id]
 * Fetches a full case document from the case_embeddings collection by ObjectId.
 * Returns 200 with the case, 404 if not found, 400 if invalid ObjectId.
 */
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  if (!id || typeof id !== 'string' || !ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Case ID must be a valid ObjectId string.' }, { status: 400 });
  }
  try {
    const client = await connectToDatabase();
    const db = client.db('healthtrack');
    const collection = db.collection('case_embeddings');
    const caseDoc = (await collection.findOne({ _id: new ObjectId(id) })) as CaseEmbeddingDocument | null;
    if (!caseDoc) {
      return NextResponse.json({ message: 'Case not found' }, { status: 404 });
    }
    // Convert _id to string for frontend and include all enhanced fields
    const formattedCase = {
      ...caseDoc,
      id: caseDoc._id.toString(),
      outcomes: caseDoc.outcomes || undefined,
      treatments: caseDoc.treatments || undefined,
      diagnostics: caseDoc.diagnostics || undefined,
      metadata: caseDoc.metadata || undefined,
    };
    return NextResponse.json(formattedCase, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch case details:', error);
    return NextResponse.json({ message: 'Failed to fetch case details', error: (error as Error).message }, { status: 500 });
  }
} 