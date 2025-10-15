import type { APIRoute } from "astro";
import { GenerateBoardSchema } from "../../../../lib/validation/boards";
import { generateBoardPairs } from "../../../../lib/services/board-ai.service";

/**
 * Maps business error codes to HTTP responses.
 * 
 * @param errorCode - Error code from business logic
 * @returns Object with response body and status code, or null if not mapped
 */
function getErrorMapping(errorCode: string): { response: Record<string, unknown>; status: number } | null {
  const errorMap: Record<string, { response: Record<string, unknown>; status: number }> = {
    QUOTA_EXCEEDED: {
      response: {
        error: "quota_exceeded",
        message: "Daily AI generation limit reached. Try again tomorrow.",
      },
      status: 429,
    },
    INPUT_TEXT_TOO_LONG: {
      response: {
        error: "input_too_long",
        message: "Input text exceeds 5,000 character limit.",
      },
      status: 400,
    },
    INPUT_TEXT_EMPTY: {
      response: {
        error: "input_empty",
        message: "Input text cannot be empty.",
      },
      status: 400,
    },
    INVALID_CARD_COUNT: {
      response: {
        error: "invalid_card_count",
        message: "Card count must be 16 or 24.",
      },
      status: 400,
    },
  };

  return errorMap[errorCode] || null;
}

/**
 * Helper function to create consistent error responses.
 * 
 * @param response - Error response body (object or string)
 * @param status - HTTP status code
 * @param headers - Optional headers (defaults to JSON content type)
 * @returns Response object
 */
function createErrorResponse(
  response: Record<string, unknown> | string,
  status: number,
  headers?: HeadersInit
): Response {
  const body = typeof response === "string" ? { error: response } : response;
  const defaultHeaders = { "Content-Type": "application/json" };
  
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: headers || defaultHeaders,
    }
  );
}

/**
 * POST /api/ai/boards/generate
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
    // 1. Authentication check
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse("Unauthorized", 401);
    }

    // 2. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse("Invalid JSON in request body", 400);
    }

    const parseResult = GenerateBoardSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      return createErrorResponse(
        {
          error: "Validation failed",
          details: errors,
        },
        400
      );
    }

    const command = parseResult.data;

    // 3. Generate pairs using AI service (includes quota check)
    const result = await generateBoardPairs(
      locals.supabase,
      user.id,
      command
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific business errors
    if (error instanceof Error) {
      const errorMapping = getErrorMapping(error.message);
      if (errorMapping) {
        return createErrorResponse(errorMapping.response, errorMapping.status);
      }
    }

    // General error handling
    console.error("Error in POST /api/ai/boards/generate:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

