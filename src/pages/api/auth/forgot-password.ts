import type { APIRoute } from "astro";
import { ForgotPasswordSchema } from "../../../lib/validation/auth";
import { createErrorResponse, createSuccessResponse, formatValidationErrors } from "../../../lib/utils/api-response";
import { HttpError, ValidationError } from "../../../lib/utils/http-error";

export const prerender = false;

/**
 * POST /api/auth/forgot-password
 *
 * Sends a password reset link to the user's email.
 * Always returns success (security best practice - don't reveal if email exists).
 *
 * @returns 200 OK - { message: "Password reset link sent. Please check your email." }
 * @returns 400 Bad Request - Invalid input
 * @returns 500 Internal Server Error - Unexpected errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse & validate body
    const body = await request.json().catch(() => undefined);
    if (!body) {
      throw new HttpError("Invalid JSON in request body", 400);
    }

    const parseResult = ForgotPasswordSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = formatValidationErrors(parseResult.error);
      throw new ValidationError("Validation failed", errors);
    }

    const { email } = parseResult.data;

    // 2. Request password reset from Supabase
    // Get the origin from the request to construct the redirect URL
    const origin = new URL(request.url).origin;

    await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    // 3. Always return success (security best practice)
    // Don't reveal whether the email exists in the system
    return createSuccessResponse(
      {
        message: "Password reset link sent. Please check your email.",
      },
      200
    );
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return createErrorResponse(error.response, error.status);
    }

    if (error instanceof HttpError) {
      return createErrorResponse({ error: error.message }, error.status);
    }

    console.error("Error in POST /api/auth/forgot-password:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
