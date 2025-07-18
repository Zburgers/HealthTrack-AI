"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSimilarCases = findSimilarCases;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'healthtrack';
const MONGODB_COLLECTION_CASE_EMBEDDINGS = process.env.MONGODB_COLLECTION_CASE_EMBEDDINGS || 'case_embeddings';
const ATLAS_VECTOR_SEARCH_INDEX_NAME_FROM_ENV = process.env.ATLAS_VECTOR_SEARCH_INDEX_NAME;
const ATLAS_VECTOR_SEARCH_INDEX_NAME = ATLAS_VECTOR_SEARCH_INDEX_NAME_FROM_ENV || 'vector_index_notes';
if (process.env.NODE_ENV === 'development') {
    console.log(`[VectorSearch] Using Atlas Vector Search Index Name: "${ATLAS_VECTOR_SEARCH_INDEX_NAME}" (From ENV: "${ATLAS_VECTOR_SEARCH_INDEX_NAME_FROM_ENV}")`);
}
/**
 * Finds similar cases in MongoDB Atlas using vector search.
 *
 * @param collection The MongoDB collection to perform the search on.
 * @param queryEmbedding The embedding vector of the current case.
 * @param numCandidates The number of candidates to consider during the search (approximate nearest neighbors).
 * @param limit The maximum number of similar cases to return.
 * @param filtersAndSort Optional filters and sorting options.
 * @returns A promise that resolves to an array of similar case documents, including a matchConfidence score.
 * @throws Error if the database connection fails or the query fails.
 */
async function findSimilarCases(collection, queryEmbedding, numCandidates = 150, limit = 10, filtersAndSort) {
    if (!collection) {
        throw new Error('MongoDB collection is required for vector search.');
    }
    if (!queryEmbedding || queryEmbedding.length === 0) {
        throw new Error('Query embedding cannot be empty for vector search.');
    }
    try {
        const pipeline = [
            {
                $vectorSearch: {
                    index: ATLAS_VECTOR_SEARCH_INDEX_NAME,
                    path: 'embedding',
                    queryVector: queryEmbedding,
                    numCandidates: numCandidates,
                    limit: limit,
                },
            },
            {
                $project: {
                    _id: 1,
                    subject_id: 1,
                    hadm_id: 1,
                    note: 1,
                    age: 1,
                    sex: 1,
                    icd: 1,
                    icd_label: 1,
                    vitals: 1,
                    matchConfidence: { $meta: 'vectorSearchScore' },
                },
            },
        ];
        if (filtersAndSort) {
            const match = {};
            if (filtersAndSort.minAge !== undefined)
                match.age = { ...(match.age || {}), $gte: filtersAndSort.minAge };
            if (filtersAndSort.maxAge !== undefined)
                match.age = { ...(match.age || {}), $lte: filtersAndSort.maxAge };
            if (filtersAndSort.gender)
                match.sex = filtersAndSort.gender;
            if (filtersAndSort.icdCodes && filtersAndSort.icdCodes.length > 0)
                match.icd = { $in: filtersAndSort.icdCodes };
            if (filtersAndSort.minConfidence !== undefined)
                match.matchConfidence = { $gte: filtersAndSort.minConfidence };
            if (Object.keys(match).length > 0) {
                pipeline.push({ $match: match });
            }
            if (filtersAndSort.sortBy) {
                const sort = {};
                sort[filtersAndSort.sortBy] = filtersAndSort.sortOrder === 'asc' ? 1 : -1;
                pipeline.push({ $sort: sort });
            }
        }
        const similarCasesDocuments = await collection.aggregate(pipeline).toArray();
        const mappedCases = similarCasesDocuments.map(doc => {
            const caseDoc = doc;
            return {
                id: caseDoc._id.toString(),
                age: caseDoc.age,
                hadm_id: caseDoc.hadm_id,
                icd: caseDoc.icd,
                icd_label: caseDoc.icd_label,
                note: caseDoc.note,
                sex: caseDoc.sex,
                subject_id: caseDoc.subject_id,
                vitals: caseDoc.vitals,
                matchConfidence: caseDoc.matchConfidence,
            };
        });
        return mappedCases;
    }
    catch (error) {
        console.error('Error finding similar cases in MongoDB Atlas:', error);
        throw new Error('Failed to query similar cases from MongoDB Atlas.');
    }
}
//# sourceMappingURL=vectorSearch.js.map