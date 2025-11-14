import type { APIRoute } from "astro";
import { RefreshTokenSchema } from "../../../lib/validation/auth";
import {
  createErrorResponse,
  createSuccessResponse,
  formatValidationErrors,
  getErrorMapping,
} from "../../../lib/utils/api-response";
import { HttpError, ValidationError } from "../../../lib/utils/http-error";

export const prerender = false;

/**
 * POST /api/auth/refresh-token
 *
 * Refreshes the access token using a valid refresh token.
 * Returns new access token and refresh token.
 *
 * @returns 200 OK - { data: { session }, message }
 * @returns 400 Bad Request - Invalid input
 * @returns 401 Unauthorized - Invalid or expired refresh token
 * @returns 500 Internal Server Error - Unexpected errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse & validate body
    const body = await request.json().catch(() => undefined);
    if (!body) {
      throw new HttpError("Invalid JSON in request body", 400);
    }

    const parseResult = RefreshTokenSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = formatValidationErrors(parseResult.error);
      throw new ValidationError("Validation failed", errors);
    }

    const { refreshToken } = parseResult.data;

    // 2. Refresh the session using Supabase
    const { data: sessionData, error: refreshError } = await locals.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (refreshError) {
      throw new HttpError("INVALID_REFRESH_TOKEN", 401);
    }

    if (!sessionData.session) {
      throw new HttpError("INVALID_REFRESH_TOKEN", 401);
    }

    // 3. Return success response with new tokens
    return createSuccessResponse(
      {
        data: {
          session: {
            accessToken: sessionData.session.access_token,
            refreshToken: sessionData.session.refresh_token,
          },
        },
        message: "Token refreshed successfully",
      },
      200
    );
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return createErrorResponse(error.response, error.status);
    }

    if (error instanceof HttpError) {
      const mapping = getErrorMapping(error.message);
      if (mapping) {
        return createErrorResponse(mapping.response, mapping.status);
      }
      return createErrorResponse({ error: error.message }, error.status);
    }

    console.error("Error in POST /api/auth/refresh-token:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
