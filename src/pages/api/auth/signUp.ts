import type { APIRoute } from "astro";
import { SignUpSchema } from "../../../lib/validation/auth";
import {
  createErrorResponse,
  createSuccessResponse,
  formatValidationErrors,
  getErrorMapping,
} from "../../../lib/utils/api-response";
import { HttpError, ValidationError } from "../../../lib/utils/http-error";

export const prerender = false;

/**
 * POST /api/auth/signUp
 *
 * Registers a new user with email, password, and display name.
 * Creates both auth.users record (via Supabase Auth) and user_meta record.
 *
 * @returns 201 Created - { data: { user }, message }
 * @returns 400 Bad Request - Invalid input
 * @returns 409 Conflict - Email already exists
 * @returns 500 Internal Server Error - Unexpected errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse & validate body
    const body = await request.json().catch(() => undefined);
    if (!body) {
      throw new HttpError("Invalid JSON in request body", 400);
    }

    const parseResult = SignUpSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = formatValidationErrors(parseResult.error);
      throw new ValidationError("Validation failed", errors);
    }

    const { email, password, displayName } = parseResult.data;

    // 2. Create user with Supabase Auth
    const { data: authData, error: authError } = await locals.supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      // Check if email already exists
      if (
        authError.message.toLowerCase().includes("already registered") ||
        authError.message.toLowerCase().includes("already exists")
      ) {
        throw new HttpError("EMAIL_ALREADY_EXISTS", 409);
      }

      // Other auth errors
      throw new HttpError(authError.message, authError.status || 400);
    }

    const user = authData.user;
    if (!user) {
      throw new HttpError("USER_CREATION_FAILED", 500);
    }

    // 3. Create user_meta record with display name
    const { error: metaError } = await locals.supabase.from("user_meta").insert({
      id: user.id,
      display_name: displayName,
    });

    if (metaError) {
      // Log the error but don't fail the request
      // The user_meta record can be created later if needed
      console.error("Failed to create user_meta record:", metaError);

      // For MVP, we continue - user can update profile later
      // For production, consider implementing rollback or webhook
    }

    // 4. Return success response
    return createSuccessResponse(
      {
        data: {
          user: {
            id: user.id,
            email: user.email!,
          },
        },
        message: "Account created successfully. Please check your email for verification.",
      },
      201
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

    console.error("Error in POST /api/auth/signUp:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
