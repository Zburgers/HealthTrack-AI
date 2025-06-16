import { NextRequest, NextResponse } from 'next/server';
import { getEmbeddings } from '@/lib/embedding'; // Corrected import
import { findSimilarCases, SimilarCasesFilterSort } from '@/lib/vectorSearch';
import { SimilarCasesApiInput, SimilarCaseOutput } from '@/types/similar-cases';
import { z, ZodError } from 'zod';
import { makeAICacheKey, getAICache, setAICache } from '@/lib/aiCache';
import stringify from 'json-stable-stringify';

// Define Zod schema for input validation based on SimilarCasesApiInput
const SimilarCasesApiInputSchema = z.object({
  note: z.string().min(1, { message: "Note cannot be empty." }),
  age: z.number().int().positive().optional(),
  sex: z.string().optional(), // Could be an enum: z.enum(['M', 'F', 'O']).optional()
  vitals: z.object({
    bp: z.string().optional().nullable(),
    hr: z.number().int().positive().optional().nullable(),
    rr: z.number().int().positive().optional().nullable(),
    spo2: z.number().int().positive().optional().nullable(),
    temp: z.number().positive().optional().nullable(),
  }).partial().optional(), // partial means all fields within vitals are optional
});

// Helper function to concatenate relevant fields for embedding
function prepareInputTextForEmbedding(input: SimilarCasesApiInput): string {
  // Prioritize the clinical note.
  let mainNote = input.note;

  // Create a compact string for additional structured data if available.
  let structuredDataParts: string[] = [];
  if (input.age) structuredDataParts.push(`A:${input.age}`);
  if (input.sex) structuredDataParts.push(`S:${input.sex.charAt(0)}`); // M/F/O

  if (input.vitals) {
    const { bp, hr, rr, spo2, temp } = input.vitals;
    let vitalsSummary: string[] = [];
    if (temp != null) vitalsSummary.push(`T:${temp}`);
    if (bp) vitalsSummary.push(`BP:${bp}`);
    if (hr != null) vitalsSummary.push(`HR:${hr}`);
    if (spo2 != null) vitalsSummary.push(`O2:${spo2}`);
    if (rr != null) vitalsSummary.push(`RR:${rr}`);
    if (vitalsSummary.length > 0) {
      structuredDataParts.push(`Vitals[${vitalsSummary.join(',')}]`);
    }
  }

  let combinedText;
  // Combine the main note with a very concise summary of structured data.
  if (structuredDataParts.length > 0) {
    combinedText = `${mainNote} (${structuredDataParts.join(' ')})`;
  } else {
    combinedText = mainNote;
  }

  // Optimize whitespace:
  // 1. Replace multiple whitespace characters (including newlines, tabs, etc.) with a single space.
  let optimizedText = combinedText.replace(/\s\s+/g, ' ');
  // 2. Trim leading/trailing whitespace from the final string.
  optimizedText = optimizedText.trim();

  return optimizedText;
}

// Accept filtering and sorting parameters from query string or POST body
// Supported: minAge, maxAge, gender, icdCodes, minConfidence, sortBy, sortOrder

function parseFilterAndSortParams(req: NextRequest, body: any) {
  // Try to get from query string first
  const url = req.nextUrl;
  const minAge = url.searchParams.get('minAge') ?? body.minAge;
  const maxAge = url.searchParams.get('maxAge') ?? body.maxAge;
  const gender = url.searchParams.get('gender') ?? body.gender;
  const icdCodes = url.searchParams.get('icdCodes')
    ? url.searchParams.get('icdCodes')!.split(',').map((c) => c.trim()).filter(Boolean)
    : body.icdCodes;
  const minConfidence = url.searchParams.get('minConfidence') ?? body.minConfidence;
  const sortBy = url.searchParams.get('sortBy') ?? body.sortBy;
  const sortOrder = url.searchParams.get('sortOrder') ?? body.sortOrder;
  return {
    minAge: minAge !== undefined ? Number(minAge) : undefined,
    maxAge: maxAge !== undefined ? Number(maxAge) : undefined,
    gender: gender || undefined,
    icdCodes: icdCodes || undefined,
    minConfidence: minConfidence !== undefined ? Number(minConfidence) : undefined,
    sortBy: sortBy || undefined,
    sortOrder: sortOrder || undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate input using Zod
    const validatedInput = SimilarCasesApiInputSchema.parse(body);

    // 2. Parse filter and sort params
    const filterSortParams = parseFilterAndSortParams(request, body);

    // Persistent cache logic: hash input + filter/sort params
    const cacheKey = makeAICacheKey('similar-cases', stringify({ input: validatedInput, filterSortParams }));
    const cached = await getAICache(cacheKey);
    if (cached) {
      console.log('[API Similar Cases] Cache hit:', cacheKey);
      // If cached is an object with a 'data' property, return cached.data; else, return cached directly if it's an array
      if (Array.isArray(cached)) {
        return NextResponse.json(cached, { status: 200 });
      } else if (cached && Array.isArray(cached.data)) {
        return NextResponse.json(cached.data, { status: 200 });
      } else {
        return NextResponse.json([], { status: 200 });
      }
    }

    // 3. Prepare text for embedding from validated input
    const inputText = prepareInputTextForEmbedding(validatedInput);

    // Log the exact text and its length before sending for embedding
    console.log(`[API Similar Cases] Prepared inputText for embedding (length: ${inputText.length}): "${inputText}"`);
    console.log(`[API Similar Cases] Note: Character-based truncation to approx. <100 tokens will occur in getEmbeddings if needed. Vertex AI will determine final token count.`);

    // 4. Get embedding from Vertex AI
    const embeddingsArray = await getEmbeddings([inputText]);

    if (!embeddingsArray || embeddingsArray.length === 0 || !embeddingsArray[0] || embeddingsArray[0].length === 0) {
      return NextResponse.json({ message: 'Failed to generate query embedding from Vertex AI.' }, { status: 500 });
    }
    
    const queryEmbedding = embeddingsArray[0];

    // 5. Find similar cases in MongoDB Atlas with filters and sorting
    const similarCases = await findSimilarCases(queryEmbedding, 150, 10, filterSortParams as SimilarCasesFilterSort);

    if (!similarCases) {
      return NextResponse.json({ error: 'No similar cases found or error in processing.' }, { status: 404 });
    }

    // Store in persistent cache (24h expiry)
    await setAICache(cacheKey, 'similar-cases', { input: validatedInput, filterSortParams }, similarCases, 24 * 60 * 60 * 1000);

    return NextResponse.json(similarCases, { status: 200 });

  } catch (error: any) {
    console.error('[API Similar Cases POST] Error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json({ message: "Invalid input data.", errors: error.errors }, { status: 400 });
    }

    let statusCode = 500;
    let message = 'An unexpected error occurred while processing your request.';

    if (error.message.toLowerCase().includes('vertex ai')) {
      message = 'Error communicating with Vertex AI service.';
    } else if (error.message.toLowerCase().includes('mongodb')) {
      message = 'Error querying the database for similar cases.';
    }

    return NextResponse.json({ message: message, details: error.message }, { status: statusCode });
  }
}

// Optional: Implement GET if you need to test the endpoint or have other use cases
export async function GET(request: NextRequest) {
  // Example: return a link to documentation or a test interface if desired
  return NextResponse.json({ message: 'This endpoint expects a POST request with case data to find similar cases. Please refer to API documentation.' }, { status: 405 });
}
