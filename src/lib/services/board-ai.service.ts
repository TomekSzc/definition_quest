import type { SupabaseClient } from "../../db/supabase.client";
import type {
  GenerateBoardCmd,
  BoardGenerationResultDTO,
  GeneratedPair,
} from "../../types";

/**
 * Service for AI-powered board generation.
 * Handles quota checking, AI pair generation, and request tracking.
 * 
 * Current implementation uses mock data for MVP.
 * Production version will integrate with OpenRouter API.
 */

const DAILY_QUOTA_LIMIT = 50;
const INPUT_TEXT_MAX_LENGTH = 5000;

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
 * Generates mock pairs based on requested card count.
 * In production, this will be replaced with actual OpenRouter API call.
 * 
 * @param cardCount - Number of cards to generate (16 or 24)
 * @param inputText - Source text for generation (currently unused in mock)
 * @returns Array of term-definition pairs
 */
function generateMockPairs(cardCount: 16 | 24, inputText: string): GeneratedPair[] {
  const pairCount = cardCount / 2;
  const pairs: GeneratedPair[] = [];
  
  // Mock data generation - replace with actual AI call in production
  const topics = [
    { term: "Photosynthesis", definition: "Process by which plants convert light energy into chemical energy" },
    { term: "Mitosis", definition: "Cell division resulting in two identical daughter cells" },
    { term: "DNA", definition: "Deoxyribonucleic acid, carrier of genetic information" },
    { term: "Ecosystem", definition: "Community of living organisms interacting with their environment" },
    { term: "Evolution", definition: "Process of gradual change in species over time" },
    { term: "Metabolism", definition: "Chemical processes that occur within living organisms" },
    { term: "Homeostasis", definition: "Ability of organism to maintain stable internal conditions" },
    { term: "Osmosis", definition: "Movement of water across semi-permeable membrane" },
    { term: "Catalyst", definition: "Substance that speeds up chemical reactions" },
    { term: "Polymer", definition: "Large molecule composed of repeating structural units" },
    { term: "Entropy", definition: "Measure of disorder or randomness in system" },
    { term: "Isotope", definition: "Atoms of same element with different numbers of neutrons" },
  ];
  
  // Generate requested number of pairs
  for (let i = 0; i < pairCount && i < topics.length; i++) {
    pairs.push(topics[i]);
  }
  
  // If we need more pairs than available in mock data, generate generic ones
  while (pairs.length < pairCount) {
    const index = pairs.length + 1;
    pairs.push({
      term: `Term ${index}`,
      definition: `Definition for term ${index} extracted from provided text`,
    });
  }
  
  return pairs;
}

/**
 * Generates board pairs using AI (currently mock implementation).
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
      model: "mock/gpt-4", // Will be "openai/gpt-4" in production
      prompt_tokens: 0, // Will be calculated from actual API response
      cost_usd: 0, // Will be calculated based on model pricing
    })
    .select("id")
    .single();

  if (insertError || !aiRequest) {
    console.error("Error creating AI request:", insertError);
    throw new Error("Failed to create AI request record");
  }

  const requestId = aiRequest.id;

  try {
    // Generate pairs (mock implementation)
    const pairs = generateMockPairs(command.cardCount, command.inputText);
    
    // Update request status to completed
    // In production, this would include actual token counts and costs
    const { error: updateError } = await supabase
      .from("ai_requests")
      .update({
        status: "completed",
        prompt_tokens: Math.floor(command.inputText.length / 4), // Rough estimate for mock
        cost_usd: 0.001, // Mock cost
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("Error updating AI request status:", updateError);
      // Don't throw here - pairs were generated successfully
    }

    return {
      pairs,
      requestId,
    };
  } catch (error) {
    // Update request status to failed
    await supabase
      .from("ai_requests")
      .update({ status: "failed" })
      .eq("id", requestId);
    
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

