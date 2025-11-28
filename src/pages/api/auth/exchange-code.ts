import type { APIRoute } from "astro";
import { ExchangeCodeSchema } from "../../../lib/validation/auth";
import { createErrorResponse, createSuccessResponse, formatValidationErrors } from "../../../lib/utils/api-response";
import { HttpError, ValidationError } from "../../../lib/utils/http-error";
import { isEnabled } from "../../../features/featureFlags";

export const prerender = false;

/**
 * POST /api/auth/exchange-code
 *
 * Sets the session using access and refresh tokens from password reset email.
 * Tokens are extracted from URL hash fragment (#access_token=...).
 *
 * @returns 200 OK - { message: "Session established successfully" }
 * @returns 400 Bad Request - Invalid input or expired tokens
 * @returns 500 Internal Server Error - Unexpected errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!isEnabled("auth")) {
    return createErrorResponse("FEATURE_DISABLED", 503);
  }
  try {
    // 1. Parse & validate body
    const body = await request.json().catch(() => undefined);
    if (!body) {
      throw new HttpError("Invalid JSON in request body", 400);
    }

    const parseResult = ExchangeCodeSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = formatValidationErrors(parseResult.error);
      throw new ValidationError("Validation failed", errors);
    }

    const { accessToken, refreshToken } = parseResult.data;

    // 2. Set session with tokens
    const {
      data: { session },
      error,
    } = await locals.supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error || !session) {
      throw new HttpError("INVALID_OR_EXPIRED_TOKENS", 401);
    }

    // 3. Return success response
    return createSuccessResponse(
      {
        message: "Session established successfully",
      },
      200
    );
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return createErrorResponse(error.response, error.status);
    }

    if (error instanceof HttpError) {
      return createErrorResponse({ error: error.message }, error.status);
    }

    console.error("Error in POST /api/auth/exchange-code:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
