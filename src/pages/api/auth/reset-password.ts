import type { APIRoute } from "astro";
import { ResetPasswordSchema } from "../../../lib/validation/auth";
import {
  createErrorResponse,
  createSuccessResponse,
  formatValidationErrors,
  getErrorMapping,
} from "../../../lib/utils/api-response";
import { HttpError, ValidationError } from "../../../lib/utils/http-error";
import { isEnabled } from "../../../features/featureFlags";

export const prerender = false;

/**
 * POST /api/auth/reset-password
 *
 * Resets the user's password using the reset token from the email link.
 * The token is automatically verified by Supabase (must be in the session).
 *
 * @returns 200 OK - { message: "Password updated successfully" }
 * @returns 400 Bad Request - Invalid input
 * @returns 401 Unauthorized - Invalid or expired token
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

    const parseResult = ResetPasswordSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = formatValidationErrors(parseResult.error);
      throw new ValidationError("Validation failed", errors);
    }

    const { newPassword } = parseResult.data;

    // 2. Verify that user has a valid reset token session
    const {
      data: { user },
      error: userError,
    } = await locals.supabase.auth.getUser();

    if (userError || !user) {
      throw new HttpError("INVALID_RESET_TOKEN", 401);
    }

    // 3. Update the password
    const { error: updateError } = await locals.supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw new HttpError(updateError.message, updateError.status || 500);
    }

    // 4. Return success response
    return createSuccessResponse(
      {
        message: "Password updated successfully",
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

    console.error("Error in POST /api/auth/reset-password:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
