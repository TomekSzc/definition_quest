import { z } from 'zod';
import pLimit from 'p-limit';

/**
 * OpenRouter API Service
 * 
 * Provides standardized interface for communication with openrouter.ai API.
 * Handles request validation, retry logic, error handling, and response parsing.
 */

// ============================================================================
// Types and Schemas
// ============================================================================

export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

export const JsonSchemaFormatSchema = z.object({
  type: z.literal('json_schema'),
  json_schema: z.object({
    name: z.string(),
    strict: z.boolean().optional(),
    schema: z.record(z.any()),
  }),
});

export type JsonSchemaFormat = z.infer<typeof JsonSchemaFormatSchema>;

export const ChatOptionsSchema = z.object({
  model: z.string().optional().default('openai/gpt-4o-mini'),
  responseFormat: JsonSchemaFormatSchema.optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  timeoutMs: z.number().positive().optional().default(30000),
});

export type ChatOptions = z.infer<typeof ChatOptionsSchema>;

export interface ChatCompletion {
  content: string;
  json?: unknown;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface Model {
  id: string;
  name: string;
  created: number;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

// ============================================================================
// Custom Errors
// ============================================================================

export class OpenRouterError extends Error {
  constructor(message: string, public code: string, public status?: number) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export class AuthenticationError extends OpenRouterError {
  constructor(message = 'Invalid or missing API key') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class BadRequestError extends OpenRouterError {
  constructor(message: string, public details?: unknown) {
    super(message, 'BAD_REQUEST', 400);
  }
}

export class RateLimitError extends OpenRouterError {
  constructor(message = 'Rate limit exceeded', public retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', 429);
  }
}

export class ServiceUnavailableError extends OpenRouterError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 'SERVICE_UNAVAILABLE', 503);
  }
}

export class ParseError extends OpenRouterError {
  constructor(message: string, public rawResponse?: string) {
    super(message, 'PARSE_ERROR', 500);
  }
}

export class SchemaValidationError extends OpenRouterError {
  constructor(message: string, public validationErrors?: unknown) {
    super(message, 'SCHEMA_VALIDATION_ERROR', 422);
  }
}

// ============================================================================
// OpenRouterService Class
// ============================================================================

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly maxRetries = 3;
  private readonly rateLimiter = pLimit(5); // Max 5 concurrent requests
  private defaultParams: Partial<ChatOptions> = {};

  constructor(apiKey: string, baseUrl = 'https://openrouter.ai/api/v1') {
    if (!apiKey || apiKey.trim() === '') {
      throw new AuthenticationError('API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Set default parameters for all chat completion requests
   */
  public setDefaultParams(params: Partial<ChatOptions>): void {
    this.defaultParams = { ...params };
  }

  /**
   * Send a chat completion request to OpenRouter
   */
  public async chatCompletion(
    messages: Message[],
    options?: Partial<ChatOptions>
  ): Promise<ChatCompletion> {
    // Validate messages
    const validatedMessages = z.array(MessageSchema).parse(messages);

    // Merge options with defaults
    const mergedOptions = { ...this.defaultParams, ...options };
    const validatedOptions = ChatOptionsSchema.parse(mergedOptions);

    // Build request
    const requestBody = this.buildRequestBody(validatedMessages, validatedOptions);

    // Execute with retry logic
    return this.rateLimiter(() => this.retry(async () => {
      const response = await this.sendRequest('/chat/completions', requestBody, validatedOptions.timeoutMs);
      return this.handleChatResponse(response, validatedOptions.responseFormat);
    }));
  }

  /**
   * Get list of available models from OpenRouter
   */
  public async models(): Promise<Model[]> {
    return this.rateLimiter(() => this.retry(async () => {
      const response = await this.sendRequest('/models', undefined, 10000);
      return this.handleModelsResponse(response);
    }));
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Build request body for chat completion
   */
  private buildRequestBody(
    messages: Message[],
    options: ChatOptions
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: options.model,
      messages,
    };

    if (options.responseFormat) {
      body.response_format = options.responseFormat;
    }

    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }

    if (options.top_p !== undefined) {
      body.top_p = options.top_p;
    }

    if (options.frequency_penalty !== undefined) {
      body.frequency_penalty = options.frequency_penalty;
    }

    if (options.presence_penalty !== undefined) {
      body.presence_penalty = options.presence_penalty;
    }

    return body;
  }

  /**
   * Send HTTP request to OpenRouter API
   */
  private async sendRequest(
    endpoint: string,
    body?: Record<string, unknown>,
    timeoutMs = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: body ? 'POST' : 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://definition-quest.app',
          'X-Title': 'Definition Quest',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableError('Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Handle chat completion response
   */
  private async handleChatResponse(
    response: Response,
    responseFormat?: JsonSchemaFormat
  ): Promise<ChatCompletion> {
    // Handle HTTP errors
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    let data: any;
    try {
      data = await response.json();
    } catch (error) {
      const text = await response.text();
      throw new ParseError('Failed to parse JSON response', text);
    }

    // Extract content
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new ParseError('No content in response', JSON.stringify(data));
    }

    // Parse JSON if responseFormat specified
    let parsedJson: unknown = undefined;
    if (responseFormat) {
      try {
        parsedJson = JSON.parse(content);
        // Note: Full JSON Schema validation would go here if needed
      } catch (error) {
        throw new SchemaValidationError(
          'Response does not match expected JSON format',
          error
        );
      }
    }

    // Extract usage stats
    const usage = {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    };

    return {
      content,
      json: parsedJson,
      usage,
    };
  }

  /**
   * Handle models response
   */
  private async handleModelsResponse(response: Response): Promise<Model[]> {
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    let data: any;
    try {
      data = await response.json();
    } catch (error) {
      const text = await response.text();
      throw new ParseError('Failed to parse models response', text);
    }

    return data.data || [];
  }

  /**
   * Handle error responses from API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: { message: await response.text() } };
    }

    const errorMessage = errorData.error?.message || errorData.message || 'Unknown error';

    switch (response.status) {
      case 401:
        throw new AuthenticationError(errorMessage);
      case 429: {
        const retryAfter = response.headers.get('retry-after');
        throw new RateLimitError(
          errorMessage,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      }
      case 400:
      case 422:
        throw new BadRequestError(errorMessage, errorData);
      case 500:
      case 502:
      case 503:
      case 504:
        throw new ServiceUnavailableError(errorMessage);
      default:
        throw new OpenRouterError(errorMessage, 'UNKNOWN_ERROR', response.status);
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on authentication or bad request errors
        if (
          error instanceof AuthenticationError ||
          error instanceof BadRequestError ||
          error instanceof SchemaValidationError
        ) {
          throw error;
        }

        // Retry on rate limit or service unavailable
        if (
          error instanceof RateLimitError ||
          error instanceof ServiceUnavailableError
        ) {
          const isLastAttempt = attempt === this.maxRetries - 1;
          if (isLastAttempt) {
            throw error;
          }

          // Calculate backoff delay
          let delayMs: number;
          if (error instanceof RateLimitError && error.retryAfter) {
            delayMs = error.retryAfter * 1000;
          } else {
            // Exponential backoff: 1s, 2s, 4s
            delayMs = Math.pow(2, attempt) * 1000;
          }

          this.log('warn', `Retrying after ${delayMs}ms (attempt ${attempt + 1}/${this.maxRetries})`, { error: error.message });
          await this.sleep(delayMs);
          continue;
        }

        // For other errors, throw immediately
        throw error;
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Logging utility (can be replaced with proper logger)
   */
  private log(level: 'info' | 'warn' | 'error', message: string, extra?: Record<string, unknown>): void {
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...extra,
    };

    switch (level) {
      case 'error':
        console.error('[OpenRouter]', JSON.stringify(logData));
        break;
      case 'warn':
        console.warn('[OpenRouter]', JSON.stringify(logData));
        break;
      default:
        console.log('[OpenRouter]', JSON.stringify(logData));
    }
  }
}

