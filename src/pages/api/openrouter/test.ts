/**
 * Test endpoint for OpenRouter API integration
 * GET /api/openrouter/test
 *
 * Tests basic connectivity and model availability
 */

import type { APIRoute } from "astro";
import { getOpenRouterService } from "@/lib/services/openrouter.factory";
import { apiResponse } from "@/lib/utils/api-response";
import { OpenRouterError } from "@/lib/services/openrouter.service";

export const GET: APIRoute = async () => {
  try {
    const service = getOpenRouterService();

    // Test 1: Get available models
    const models = await service.models();

    // Test 2: Simple chat completion
    const completion = await service.chatCompletion([
      {
        role: "system",
        content: "You are a helpful assistant. Respond in one short sentence.",
      },
      {
        role: "user",
        content: 'Say "OpenRouter API is working correctly" if you can read this.',
      },
    ]);

    return apiResponse({
      status: "ok",
      message: "OpenRouter API is working correctly",
      data: {
        modelCount: models.length,
        testResponse: completion.content,
        tokensUsed: completion.usage.totalTokens,
      },
    });
  } catch (error) {
    if (error instanceof OpenRouterError) {
      return apiResponse(
        {
          error: error.message,
          code: error.code,
        },
        error.status || 500
      );
    }

    return apiResponse(
      {
        error: "Failed to test OpenRouter API",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};
