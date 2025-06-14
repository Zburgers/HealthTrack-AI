import { Collection, Document, ObjectId } from 'mongodb';
import { connectToDatabase } from './mongodb';
import { CaseEmbeddingDocument, SimilarCaseOutput, CaseVitals } from '@/types/similar-cases';

const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'healthtrack';
const MONGODB_COLLECTION_CASE_EMBEDDINGS = process.env.MONGODB_COLLECTION_CASE_EMBEDDINGS || 'case_embeddings';
const ATLAS_VECTOR_SEARCH_INDEX_NAME_FROM_ENV = process.env.ATLAS_VECTOR_SEARCH_INDEX_NAME;
const ATLAS_VECTOR_SEARCH_INDEX_NAME = ATLAS_VECTOR_SEARCH_INDEX_NAME_FROM_ENV || 'vector_index_notes';
console.log(`[VectorSearch] Using Atlas Vector Search Index Name: "${ATLAS_VECTOR_SEARCH_INDEX_NAME}" (From ENV: "${ATLAS_VECTOR_SEARCH_INDEX_NAME_FROM_ENV}")`);

/**
 * Finds similar cases in MongoDB Atlas using vector search.
 *
 * @param queryEmbedding The embedding vector of the current case.
 * @param numCandidates The number of candidates to consider during the search (approximate nearest neighbors).
 * @param limit The maximum number of similar cases to return.
 * @returns A promise that resolves to an array of similar case documents, including a matchConfidence score.
 * @throws Error if the database connection fails or the query fails.
 */
export async function findSimilarCases(
  queryEmbedding: number[],
  numCandidates: number = 150,
  limit: number = 10
): Promise<SimilarCaseOutput[]> {
  if (!queryEmbedding || queryEmbedding.length === 0) {
    throw new Error('Query embedding cannot be empty for vector search.');
  }
  // Optional: Add a check for embedding dimensions if they are fixed (e.g., 768 for BioBERT)
  // if (queryEmbedding.length !== 768) {
  //   console.warn(`Query embedding dimension is ${queryEmbedding.length}, expected 768. Ensure this matches your indexed embeddings.`);
  // }

  try {
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DATABASE);
    const collection: Collection<CaseEmbeddingDocument> = db.collection(MONGODB_COLLECTION_CASE_EMBEDDINGS);

    const pipeline: Document[] = [
      {
        $vectorSearch: {
          index: ATLAS_VECTOR_SEARCH_INDEX_NAME,
          path: 'embedding', // The field in your documents that contains the vector embeddings
          queryVector: queryEmbedding,
          numCandidates: numCandidates,
          limit: limit,
          // similarity: 'cosine' // Optional: specify if not default in index.
        },
      },
      {
        $project: {
          _id: 1, // Explicitly include _id
          age: 1,
          // embedding: 0, // REMOVED: Do not mix exclusion with inclusion
          hadm_id: 1,
          icd: 1,
          icd_label: 1,
          note: 1,
          sex: 1,
          subject_id: 1,
          vitals: 1,
          matchConfidence: { $meta: 'vectorSearchScore' }, // Capture the similarity score
          // By not listing 'embedding', it will be excluded as this is an inclusion projection
        },
      },
    ];

    const similarCasesDocuments: Document[] = await collection.aggregate(pipeline).toArray();
    // console.log('[VectorSearch] Raw documents from MongoDB:', JSON.stringify(similarCasesDocuments, null, 2));

    // Map to SimilarCaseOutput, ensuring all required fields are present and types are correct
    const mappedCases = similarCasesDocuments.map(doc => {
      const caseDoc = doc as CaseEmbeddingDocument & { matchConfidence: number; _id: ObjectId };
      return {
        id: caseDoc._id.toString(),
        age: caseDoc.age,
        hadm_id: caseDoc.hadm_id,
        icd: caseDoc.icd,
        icd_label: caseDoc.icd_label,
        note: caseDoc.note,
        sex: caseDoc.sex,
        subject_id: caseDoc.subject_id,
        vitals: caseDoc.vitals as CaseVitals | undefined, // Ensure vitals type if present
        matchConfidence: caseDoc.matchConfidence,
      };
    });
    // console.log('[VectorSearch] Mapped similar cases:', JSON.stringify(mappedCases, null, 2));
    return mappedCases;
  } catch (error) {
    console.error('Error finding similar cases in MongoDB Atlas:', error);
    throw new Error('Failed to query similar cases from MongoDB Atlas.');
  }
}
