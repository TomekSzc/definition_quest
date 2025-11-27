/**
 * Factory for creating OpenRouterService instances
 * Provides centralized configuration and error handling for service initialization
 */

import { OpenRouterService, AuthenticationError } from "./openrouter.service";
import { OPENROUTER_API_KEY } from "astro:env/server";

/**
 * Gets API key from environment (works in both Astro and Node.js contexts)
 */
function getApiKeyFromEnv(): string | undefined {
  // Try astro:env first (Astro context with env schema)
  if (OPENROUTER_API_KEY) {
    return OPENROUTER_API_KEY;
  }

  // Fallback to process.env (Node.js context, e.g., test scripts)
  if (typeof process !== "undefined" && process.env) {
    return process.env.OPENROUTER_API_KEY;
  }

  return undefined;
}

/**
 * Creates an OpenRouterService instance with API key from environment
 *
 * @param apiKey - Optional API key, defaults to environment variable
 * @returns Configured OpenRouterService instance
 * @throws AuthenticationError if API key is missing or invalid
 */
export function createOpenRouterService(apiKey?: string): OpenRouterService {
  const key = apiKey || getApiKeyFromEnv();

  if (!key || key.trim() === "") {
    throw new AuthenticationError("OPENROUTER_API_KEY environment variable is not set");
  }

  const service = new OpenRouterService(key);

  // Set default parameters for all requests
  service.setDefaultParams({
    model: "openai/gpt-4o-mini",
    temperature: 0.7,
    top_p: 1.0,
    timeoutMs: 30000,
  });

  return service;
}

/**
 * Type-safe helper to create OpenRouterService from Astro API context
 * Use this in API endpoints to ensure proper error handling
 */
export function getOpenRouterService(): OpenRouterService {
  try {
    return createOpenRouterService();
  } catch (error) {
    console.error("[OpenRouter Factory] Failed to initialize service:", error);
    throw error;
  }
}
