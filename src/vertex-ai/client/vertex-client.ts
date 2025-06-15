import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';
import { z } from 'zod';

// Vertex AI Configuration
interface VertexAIConfig {
  projectId: string;
  location: string;
  modelName: string;
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}

// Default configuration
const DEFAULT_CONFIG: VertexAIConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'healthtrack-hack',
  location: process.env.GOOGLE_CLOUD_REGION || 'us-central1',
  modelName: 'gemini-2.0-flash-001',
  maxOutputTokens: 2048,
  temperature: 0.1, // Low temperature for consistent medical responses
  topP: 0.8,
  topK: 40,
};

// Vertex AI wrapper for medical AI workflows
export class VertexAIClient {
  private vertex_ai: VertexAI;
  private model: any;
  private config: VertexAIConfig;

  constructor(config?: Partial<VertexAIConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize Vertex AI
    this.vertex_ai = new VertexAI({
      project: this.config.projectId,
      location: this.config.location,
    });

    // Get the generative model with medical-optimized settings
    this.model = this.vertex_ai.preview.getGenerativeModel({
      model: this.config.modelName,
      generationConfig: {
        maxOutputTokens: this.config.maxOutputTokens,
        temperature: this.config.temperature,
        topP: this.config.topP,
        topK: this.config.topK,
      },      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }

  /**
   * Generate content with basic text prompt
   */
  async generateContent(prompt: string, context?: Record<string, any>): Promise<string> {
    try {
      const startTime = Date.now();
      
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      
      const response = result.response;
      // Correctly extract text from the response
      if (!response.candidates || response.candidates.length === 0 ||
          !response.candidates[0].content || !response.candidates[0].content.parts || response.candidates[0].content.parts.length === 0 ||
          !response.candidates[0].content.parts[0].text) {
        this.logError('generateContent', 'Invalid response structure from Vertex AI', { response });
        throw new Error('Invalid response structure from Vertex AI: No text found.');
      }
      const text = response.candidates[0].content.parts[0].text;
      const duration = Date.now() - startTime;
      
      // Log for monitoring
      this.logRequest({
        type: 'generateContent',
        promptLength: prompt.length,
        responseLength: text.length,
        duration,
        context,
      });
      
      return text;
    } catch (error) {
      this.logError('generateContent', error, { prompt: prompt.substring(0, 100) });
      throw new Error(`Vertex AI request failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Generate structured content with schema validation
   */
  async generateStructuredContent<T>(
    prompt: string, 
    schema: z.ZodSchema<T>,
    context?: Record<string, any>
  ): Promise<T> {
    try {
      const startTime = Date.now();
      
      const jsonPrompt = `${prompt}

IMPORTANT: Respond with valid JSON only, following this exact schema structure. Do not include any markdown formatting, explanations, or additional text.

Required JSON structure example:
${this.generateSchemaExample(schema)}

Response:`;

      const result = await this.generateContent(jsonPrompt, context);
      const duration = Date.now() - startTime;
      
      // Clean the response (remove any markdown or extra text)
      const cleanedResult = this.cleanJsonResponse(result);
      
      try {
        const parsed = JSON.parse(cleanedResult);
        const validated = schema.parse(parsed);
        
        this.logRequest({
          type: 'generateStructuredContent',
          promptLength: jsonPrompt.length,
          responseLength: cleanedResult.length,
          duration,
          context,
          schemaValidation: 'success',
        });
        
        return validated;
      } catch (parseError) {
        this.logError('JSON parsing', parseError, { 
          rawResponse: result.substring(0, 200),
          cleanedResponse: cleanedResult.substring(0, 200),
        });
        throw new Error('Failed to parse structured response from Vertex AI');
      }
    } catch (error) {
      this.logError('generateStructuredContent', error, { prompt: prompt.substring(0, 100) });
      throw error;
    }
  }

  /**
   * Generate content with retry mechanism
   */
  async generateContentWithRetry(
    prompt: string, 
    maxRetries: number = 3,
    context?: Record<string, any>
  ): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateContent(prompt, { ...context, attempt });
      } catch (error) {
        lastError = error as Error;
        console.warn(`[Vertex AI] Attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Batch process multiple prompts
   */
  async batchGenerate(prompts: string[], context?: Record<string, any>): Promise<string[]> {
    const results = await Promise.allSettled(
      prompts.map((prompt, index) => 
        this.generateContent(prompt, { ...context, batchIndex: index })
      )
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`[Vertex AI] Batch item ${index} failed:`, result.reason);
        return `Error: ${result.reason.message || 'Unknown error'}`;
      }
    });
  }

  /**
   * Private helper methods
   */
  private cleanJsonResponse(response: string): string {
    return response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/^[^{]*/, '') // Remove any text before the first {
      .replace(/[^}]*$/, '') // Remove any text after the last }
      .trim();
  }
  private generateSchemaExample(schema: z.ZodSchema): string {
    // Simple schema example generator
    try {
      // Type guard for ZodObject
      if (schema instanceof z.ZodObject) {
        const shape = schema.shape;
        const example: any = {};
        
        for (const [key, value] of Object.entries(shape)) {
          const fieldSchema = value as z.ZodSchema;
          example[key] = this.getSchemaFieldExample(fieldSchema);
        }
        
        return JSON.stringify(example, null, 2);
      }
    } catch (error) {
      console.warn('[Vertex AI] Could not generate schema example:', error);
    }
    
    return '{ "example": "Please follow the provided schema structure" }';
  }

  private getSchemaFieldExample(schema: z.ZodSchema): any {
    // Use instanceof checks instead of _def.typeName
    if (schema instanceof z.ZodString) {
      return 'example_string';
    } else if (schema instanceof z.ZodNumber) {
      return 0;
    } else if (schema instanceof z.ZodBoolean) {
      return true;
    } else if (schema instanceof z.ZodArray) {
      return ['example_item'];
    } else if (schema instanceof z.ZodObject) {
      return {};
    } else {
      return 'example_value';
    }
  }

  private logRequest(data: Record<string, any>): void {
    console.log('[Vertex AI] Request completed', {
      timestamp: new Date().toISOString(),
      model: this.config.modelName,
      ...data,
    });
  }

  private logError(operation: string, error: unknown, context?: Record<string, any>): void {
    console.error(`[Vertex AI] ${operation} error:`, {
      timestamp: new Date().toISOString(),
      model: this.config.modelName,
      error: this.getErrorMessage(error),
      context,
    });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error';
  }

  /**
   * Get current configuration
   */
  getConfig(): VertexAIConfig {
    return { ...this.config };
  }

  /**
   * Update model configuration
   */
  updateConfig(newConfig: Partial<VertexAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize model with new config
    this.model = this.vertex_ai.preview.getGenerativeModel({
      model: this.config.modelName,
      generationConfig: {
        maxOutputTokens: this.config.maxOutputTokens,
        temperature: this.config.temperature,
        topP: this.config.topP,
        topK: this.config.topK,
      },
    });
  }
}

// Singleton instance for the application
export const vertexAIClient = new VertexAIClient();

// Export types
export interface VertexAIRequest {
  prompt: string;
  context?: Record<string, any>;
  maxTokens?: number;
  temperature?: number;
}

export interface VertexAIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  metadata?: Record<string, any>;
}

export type { VertexAIConfig };
