import type { APIRoute } from "astro";
import { LoginSchema } from "../../../lib/validation/auth";
import {
  createErrorResponse,
  createSuccessResponse,
  formatValidationErrors,
  getErrorMapping,
} from "../../../lib/utils/api-response";
import { HttpError, ValidationError } from "../../../lib/utils/http-error";

export const prerender = false;

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * Returns user data and session information.
 *
 * @returns 200 OK - { data: { user, session }, message }
 * @returns 400 Bad Request - Invalid input
 * @returns 401 Unauthorized - Invalid credentials
 * @returns 403 Forbidden - Email not confirmed
 * @returns 500 Internal Server Error - Unexpected errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse & validate body
    const body = await request.json().catch(() => undefined);
    if (!body) {
      throw new HttpError("Invalid JSON in request body", 400);
    }

    const parseResult = LoginSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = formatValidationErrors(parseResult.error);
      throw new ValidationError("Validation failed", errors);
    }

    const { email, password } = parseResult.data;

    // 2. Attempt authentication with Supabase
    const { data: authData, error: authError } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // Handle specific auth errors
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        throw new HttpError("EMAIL_NOT_CONFIRMED", 403);
      }

      // Generic invalid credentials error
      throw new HttpError("INVALID_CREDENTIALS", 401);
    }

    if (!authData.user || !authData.session) {
      throw new HttpError("INVALID_CREDENTIALS", 401);
    }

    // 3. Return success response
    return createSuccessResponse(
      {
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email!,
          },
          session: {
            accessToken: authData.session.access_token,
            refreshToken: authData.session.refresh_token,
          },
        },
        message: "Logged in successfully",
      },
      200
    );
  } catch (error: any) {
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

    console.error("Error in POST /api/auth/login:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
