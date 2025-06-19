import { z } from 'zod';
import util from 'util';
import { exec as oldExec } from 'child_process';
import { InferenceClient } from "@huggingface/inference";
import { HF_KEY } from '@/config';

const exec = util.promisify(oldExec);
const hfClient = new InferenceClient(HF_KEY);

// Environment variable names
const ENV_VERTEX_AI_ENDPOINT_HOST = 'VERTEX_AI_ENDPOINT_HOST';
const ENV_VERTEX_AI_PROJECT_ID_FOR_ENDPOINT = 'VERTEX_AI_PROJECT_ID_FOR_ENDPOINT';
const ENV_VERTEX_AI_LOCATION_FOR_ENDPOINT = 'VERTEX_AI_LOCATION_FOR_ENDPOINT';
const ENV_VERTEX_AI_ENDPOINT_ID_FOR_ENDPOINT = 'VERTEX_AI_ENDPOINT_ID_FOR_ENDPOINT';
const ENV_GCLOUD_PROJECT = 'GCLOUD_PROJECT';

const MAX_CHARS_FOR_EMBEDDING = 286; // Adjusted: Approx. <90-95 tokens (based on 380 chars -> 130 tokens)

// Zod schema for validating the embedding response
// The actual embedding vector is nested two arrays deep within the predictions array
const VertexAIEmbeddingResponseSchema = z.object({
  predictions: z.array(z.array(z.array(z.number()))),
  deployedModelId: z.string().optional(),
  model: z.string().optional(),
  modelDisplayName: z.string().optional(),
  modelVersionId: z.string().optional(),
});

/**
 * Get embeddings for a list of texts using Hugging Face Inference API (feature extraction).
 * @param texts Array of input strings to embed
 * @returns Promise resolving to an array of embedding vectors (number[][])
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (!HF_KEY) {
    console.error("HF_TOKEN environment variable is not set.");
    throw new Error("HF_TOKEN environment variable is not set.");
  }

  if (!texts || texts.length === 0) {
    console.warn('getEmbeddings called with no texts.');
    return [];
  }

  // Truncate texts if they are too long (keeping same logic as Vertex AI)
  const processedTexts = texts.map(text => {
    if (text.length > MAX_CHARS_FOR_EMBEDDING) {
      console.warn(`Input text truncated from ${text.length} to ${MAX_CHARS_FOR_EMBEDDING} characters to meet token limits.`);
      return text.substring(0, MAX_CHARS_FOR_EMBEDDING);
    }
    return text;
  });

  try {
    // Use featureExtraction endpoint for actual embeddings
    const model = "pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-stsb";
    const embeddings: number[][] = [];

    for (const text of processedTexts) {
      const output = await hfClient.featureExtraction({
        model,
        inputs: text,
      });
      // output is an array of numbers (the embedding vector)
      embeddings.push(output as number[]);
    }
    
    return embeddings;
  } catch (error) {
    console.error('Error getting embeddings from Hugging Face:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get embeddings: ${error.message}`);
    }
    throw new Error('An unknown error occurred while getting embeddings.');
  }
}

export async function getEmbeddingsVertexAI(texts: string[]): Promise<number[][]> {
  const authProjectId = process.env[ENV_GCLOUD_PROJECT];
  const vertexEndpointHost = process.env[ENV_VERTEX_AI_ENDPOINT_HOST];
  const vertexProjectId = process.env[ENV_VERTEX_AI_PROJECT_ID_FOR_ENDPOINT];
  const vertexLocation = process.env[ENV_VERTEX_AI_LOCATION_FOR_ENDPOINT];
  const vertexEndpointId = process.env[ENV_VERTEX_AI_ENDPOINT_ID_FOR_ENDPOINT];

  if (!authProjectId) {
    console.error(`${ENV_GCLOUD_PROJECT} environment variable is not set.`);
    throw new Error(`${ENV_GCLOUD_PROJECT} environment variable is not set.`);
  }
  if (!vertexEndpointHost) {
    console.error(`${ENV_VERTEX_AI_ENDPOINT_HOST} environment variable is not set.`);
    throw new Error(`${ENV_VERTEX_AI_ENDPOINT_HOST} environment variable is not set.`);
  }
  if (!vertexProjectId) {
    console.error(`${ENV_VERTEX_AI_PROJECT_ID_FOR_ENDPOINT} environment variable is not set.`);
    throw new Error(`${ENV_VERTEX_AI_PROJECT_ID_FOR_ENDPOINT} environment variable is not set.`);
  }
  if (!vertexLocation) {
    console.error(`${ENV_VERTEX_AI_LOCATION_FOR_ENDPOINT} environment variable is not set.`);
    throw new Error(`${ENV_VERTEX_AI_LOCATION_FOR_ENDPOINT} environment variable is not set.`);
  }
  if (!vertexEndpointId) {
    console.error(`${ENV_VERTEX_AI_ENDPOINT_ID_FOR_ENDPOINT} environment variable is not set.`);
    throw new Error(`${ENV_VERTEX_AI_ENDPOINT_ID_FOR_ENDPOINT} environment variable is not set.`);
  }

  if (!texts || texts.length === 0) {
    console.warn('getEmbeddingsVertexAI called with no texts.');
    return [];
  }

  // Truncate texts if they are too long
  const processedTexts = texts.map(text => {
    if (text.length > MAX_CHARS_FOR_EMBEDDING) {
      console.warn(`Input text truncated from ${text.length} to ${MAX_CHARS_FOR_EMBEDDING} characters to meet token limits.`);
      return text.substring(0, MAX_CHARS_FOR_EMBEDDING);
    }
    return text;
  });

  try {
    const { stdout: token } = await exec(`gcloud auth print-access-token --project=${authProjectId}`);
    const accessToken = token.trim();

    const url = `https://${vertexEndpointHost}/v1/projects/${vertexProjectId}/locations/${vertexLocation}/endpoints/${vertexEndpointId}:predict`;

    const payload = {
      instances: processedTexts.map(text => ({ inputs: text })), // Use processedTexts
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Vertex AI API request failed with status ${response.status}: ${errorBody}`);
      throw new Error(`Vertex AI API request failed: ${response.statusText} - ${errorBody}`);
    }

    const responseData = await response.json();
    // Uncomment for debugging the raw response data
    // This can help you see the exact structure returned by Vertex AI.
    // console.log('Raw Vertex AI Response Data:', JSON.stringify(responseData, null, 2));  
    
    // Validate the response structure
    const validationResult = VertexAIEmbeddingResponseSchema.safeParse(responseData);
    if (!validationResult.success) {
      console.error('Invalid response structure from Vertex AI:', validationResult.error.issues);
      throw new Error('Invalid response structure from Vertex AI.');
    }

    // Extract embeddings. Since we send one text, we expect one prediction block.
    // The actual embedding is at validationResult.data.predictions[0][0]
    if (validationResult.data.predictions && 
        validationResult.data.predictions.length > 0 &&
        validationResult.data.predictions[0] &&
        validationResult.data.predictions[0].length > 0 &&
        validationResult.data.predictions[0][0]) {
      // Assuming a single text input, so we take the first prediction's first (and only) embedding vector.
      // If you were to batch multiple texts, you would iterate through validationResult.data.predictions
      // and for each item, take item[0] as the embedding.
      return [validationResult.data.predictions[0][0]]; 
    } else {
      console.error('Validated response does not contain expected embedding structure.', validationResult.data);
      throw new Error('Validated response does not contain expected embedding structure.');
    }
  } catch (error) {
    console.error('Error getting embeddings from Vertex AI:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get embeddings: ${error.message}`);
    }
    throw new Error('An unknown error occurred while getting embeddings.');
  }
}
