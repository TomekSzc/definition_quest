import type { APIRoute } from "astro";
import { GenerateBoardSchema } from "../../../lib/validation/boards";
import { generateBoardPairs } from "../../../lib/services/board-ai.service";
import {
  createErrorResponse,
  createSuccessResponse,
  formatValidationErrors,
  getErrorMapping,
} from "../../../lib/utils/api-response";
import { HttpError, ValidationError } from "../../../lib/utils/http-error";

/**
 * POST /api/boards/generate
 *
 * Generates term-definition pairs from raw text (≤ 5,000 chars) using AI.
 * The operation counts toward the daily limit of 50 AI requests per user.
 *
 * Current implementation returns synchronously with mock data for MVP.
 * Production version will integrate with OpenRouter API.
 *
 * Response includes generated pairs that can be edited before creating a board.
 *
 * @returns 200 OK - Pairs generated successfully
 * @returns 400 Bad Request - Validation failed or input invalid
 * @returns 401 Unauthorized - Not authenticated
 * @returns 429 Too Many Requests - Daily quota exceeded
 * @returns 500 Internal Server Error - Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // User is already authenticated by middleware and available in locals
    const user = locals.user;

    if (!user) {
      throw new HttpError("Unauthorized", 401);
    }

    // 1. Parse and validate request body
    const body = await request.json().catch(() => undefined);

    if (!body) {
      throw new HttpError("Invalid JSON in request body", 400);
    }

    const parseResult = GenerateBoardSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = formatValidationErrors(parseResult.error);
      throw new ValidationError("Validation failed", errors);
    }

    const command = parseResult.data;

    // 2. Generate pairs using AI service (includes quota check)
    const result = await generateBoardPairs(locals.supabase, user.id, command);

    return createSuccessResponse(result);
  } catch (error) {
    // Handle custom HTTP errors
    if (error instanceof HttpError) {
      return createErrorResponse(error.response || error.message, error.status);
    }

    // Handle specific business errors from services
    if (error instanceof Error) {
      const errorMapping = getErrorMapping(error.message);
      if (errorMapping) {
        return createErrorResponse(errorMapping.response, errorMapping.status);
      }
    }

    // General error handling
    console.error("Error in POST /api/boards/generate:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
