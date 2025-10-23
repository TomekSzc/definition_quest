import type { SupabaseClient } from "../../db/supabase.client";
import type {
  GenerateBoardCmd,
  BoardGenerationResultDTO,
  GeneratedPair,
} from "../../types";
import { createOpenRouterService } from "./openrouter.factory";
import type { Message, JsonSchemaFormat } from "./openrouter.service";
import { OpenRouterError } from "./openrouter.service";

/**
 * Service for AI-powered board generation.
 * Handles quota checking, AI pair generation, and request tracking.
 * 
 * Integrates with OpenRouter API for real-time pair generation.
 */

const DAILY_QUOTA_LIMIT = 50;
const INPUT_TEXT_MAX_LENGTH = 5000;
const DEFAULT_MODEL = "openai/gpt-4o-mini";

/**
 * Checks if the user has exceeded their daily AI request quota.
 * Uses the daily_ai_usage materialized view for efficient quota checking.
 * 
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID to check quota for
 * @returns true if user has quota remaining, false if exceeded
 */
export async function checkDailyQuota(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  const { data, error } = await supabase
    .from("daily_ai_usage")
    .select("cnt")
    .eq("user_id", userId)
    .eq("request_date", today)
    .maybeSingle();

  if (error) {
    console.error("Error checking daily quota:", error);
    throw new Error("Failed to check AI quota");
  }

  const currentCount = data?.cnt ?? 0;
  return currentCount < DAILY_QUOTA_LIMIT;
}

/**
 * Generates educational term-definition pairs using OpenRouter AI.
 * 
 * @param cardCount - Number of cards to generate (16 or 24)
 * @param inputText - Source text for generation
 * @param title - Board title for context
 * @returns Array of term-definition pairs and token usage stats
 */
async function generatePairsWithAI(
  cardCount: 16 | 24,
  inputText: string,
  title: string
): Promise<{ pairs: GeneratedPair[]; promptTokens: number; completionTokens: number; totalTokens: number }> {
  const pairCount = cardCount / 2;
  
  // Create OpenRouter service
  const service = createOpenRouterService();

  // Build system prompt
  const systemPrompt = `You are an expert educational content creator specializing in creating study materials.
Your task is to analyze provided text and extract the most important concepts as term-definition pairs for a memory matching game.

Requirements:
- Extract exactly ${pairCount} pairs
- Terms should be 1-4 words: key concepts, names, or technical terms
- Definitions should be 5-15 words: clear, concise explanations
- Focus on the most important concepts from the text
- Ensure variety - avoid repetitive or overlapping concepts
- Use language that matches the input text (Polish or English), if you dont know which one, use Polish
- Definitions must be self-contained and understandable without context`;

  const userPrompt = `Title: ${title}

Input text:
${inputText}

Generate ${pairCount} term-definition pairs from the above content.`;

  // Define response format schema
  const responseFormat: JsonSchemaFormat = {
    type: 'json_schema',
    json_schema: {
      name: 'GeneratedPairs',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          pairs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                term: { type: 'string' },
                definition: { type: 'string' },
              },
              required: ['term', 'definition'],
              additionalProperties: false,
            },
            minItems: pairCount,
            maxItems: pairCount,
          },
        },
        required: ['pairs'],
        additionalProperties: false,
      },
    },
  };

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  // Call OpenRouter API
  const completion = await service.chatCompletion(messages, {
    model: DEFAULT_MODEL,
    responseFormat,
    temperature: 0.7,
    top_p: 1.0,
  });

  // Parse and validate response
  const result = completion.json as { pairs: GeneratedPair[] };
  
  if (!result.pairs || !Array.isArray(result.pairs) || result.pairs.length !== pairCount) {
    throw new Error('AI_INVALID_RESPONSE_FORMAT');
  }

  // Validate each pair
  for (const pair of result.pairs) {
    if (!pair.term || !pair.definition || 
        typeof pair.term !== 'string' || 
        typeof pair.definition !== 'string' ||
        pair.term.trim().length === 0 ||
        pair.definition.trim().length === 0) {
      throw new Error('AI_INVALID_PAIR_FORMAT');
    }
  }

  return {
    pairs: result.pairs,
    promptTokens: completion.usage.promptTokens,
    completionTokens: completion.usage.completionTokens,
    totalTokens: completion.usage.totalTokens,
  };
}

/**
 * Calculates cost in USD based on OpenRouter pricing for gpt-4o-mini
 * Pricing as of 2025: $0.15 per 1M input tokens, $0.60 per 1M output tokens
 * 
 * @param promptTokens - Number of input tokens
 * @param completionTokens - Number of output tokens
 * @returns Cost in USD (rounded to 4 decimal places)
 */
function calculateCost(promptTokens: number, completionTokens: number): number {
  const INPUT_COST_PER_1M = 0.15;
  const OUTPUT_COST_PER_1M = 0.60;
  
  const inputCost = (promptTokens / 1_000_000) * INPUT_COST_PER_1M;
  const outputCost = (completionTokens / 1_000_000) * OUTPUT_COST_PER_1M;
  
  return Math.round((inputCost + outputCost) * 10000) / 10000; // Round to 4 decimals
}

/**
 * Generates board pairs using OpenRouter AI.
 * Validates input, checks quota, creates audit record, and returns generated pairs.
 * 
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID requesting generation
 * @param command - Board generation parameters (inputText, cardCount, title, etc.)
 * @returns Generated pairs and request ID for tracking
 * @throws Error if quota exceeded, input invalid, or database operation fails
 */
export async function generateBoardPairs(
  supabase: SupabaseClient,
  userId: string,
  command: GenerateBoardCmd
): Promise<BoardGenerationResultDTO> {
  // Validate input text length
  if (command.inputText.length > INPUT_TEXT_MAX_LENGTH) {
    throw new Error("INPUT_TEXT_TOO_LONG");
  }
  
  if (command.inputText.trim().length === 0) {
    throw new Error("INPUT_TEXT_EMPTY");
  }
  
  // Validate card count
  if (command.cardCount !== 16 && command.cardCount !== 24) {
    throw new Error("INVALID_CARD_COUNT");
  }

  // Check quota before processing
  const hasQuota = await checkDailyQuota(supabase, userId);
  
  if (!hasQuota) {
    throw new Error("QUOTA_EXCEEDED");
  }

  // Create ai_request record for audit trail
  const { data: aiRequest, error: insertError } = await supabase
    .from("ai_requests")
    .insert({
      user_id: userId,
      status: "pending",
      model: DEFAULT_MODEL,
      prompt_tokens: 0,
      cost_usd: 0,
    })
    .select("id")
    .single();

  if (insertError || !aiRequest) {
    console.error("Error creating AI request:", insertError);
    throw new Error("Failed to create AI request record");
  }

  const requestId = aiRequest.id;

  try {
    // Generate pairs using OpenRouter AI
    const result = await generatePairsWithAI(
      command.cardCount,
      command.inputText,
      command.title
    );
    
    // Calculate actual cost
    const costUsd = calculateCost(result.promptTokens, result.completionTokens);
    
    // Update request status to completed with actual metrics
    const { error: updateError } = await supabase
      .from("ai_requests")
      .update({
        status: "completed",
        prompt_tokens: result.totalTokens, // Store total tokens in prompt_tokens field
        cost_usd: costUsd,
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("Error updating AI request status:", updateError);
      // Don't throw here - pairs were generated successfully
    }

    return {
      pairs: result.pairs,
      requestId,
    };
  } catch (error) {
    // Update request status to failed
    await supabase
      .from("ai_requests")
      .update({ status: "failed" })
      .eq("id", requestId);
    
    // Re-throw with more context if it's an OpenRouter error
    if (error instanceof OpenRouterError) {
      throw new Error(`AI_SERVICE_ERROR: ${error.message}`);
    }
    
    throw error;
  }
}

/**
 * Gets the remaining quota for a user today.
 * 
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID to check
 * @returns Remaining quota count
 */
export async function getRemainingQuota(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  const { data, error } = await supabase
    .from("daily_ai_usage")
    .select("cnt")
    .eq("user_id", userId)
    .eq("request_date", today)
    .maybeSingle();

  if (error) {
    console.error("Error getting remaining quota:", error);
    throw new Error("Failed to get quota information");
  }

  const currentCount = data?.cnt ?? 0;
  return Math.max(0, DAILY_QUOTA_LIMIT - currentCount);
}

