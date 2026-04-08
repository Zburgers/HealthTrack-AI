import { HfInference } from '@huggingface/inference';

/**
 * Generate embeddings using BioBERT via Hugging Face Inference API.
 * This is the core embedding function used by both the worker and the API.
 */
export async function generateBioEmbedding(hf: HfInference, text: string): Promise<number[]> {
  const response = await hf.featureExtraction({
    model: 'emilyalsentzer/Bio_ClinicalBERT',
    inputs: text,
  });

  // Mean pool over token embeddings if nested
  const responseArray = response as any;
  if (Array.isArray(responseArray?.[0]?.[0])) {
    const tokens = responseArray[0] as number[][];
    const dim = tokens[0].length;
    const pooled = new Array(dim).fill(0);
    for (const token of tokens) {
      for (let i = 0; i < dim; i++) {
        pooled[i] += token[i];
      }
    }
    return pooled.map(v => v / tokens.length);
  }

  return responseArray[0] as number[];
}
