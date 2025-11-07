import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/utils/api-response";
import { HttpError } from "../../../lib/utils/http-error";

export const prerender = false;

/**
 * POST /api/auth/logout
 *
 * Signs out the current user and clears their session.
 * No authentication required (can be called even if not logged in).
 *
 * @returns 200 OK - { message: "Logged out successfully" }
 * @returns 500 Internal Server Error - Unexpected errors
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    // Sign out from Supabase Auth
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      console.error("Error during logout:", error);
      throw new HttpError("Failed to log out", 500);
    }

    return createSuccessResponse({ message: "Logged out successfully" }, 200);
  } catch (error: any) {
    if (error instanceof HttpError) {
      return createErrorResponse({ error: error.message }, error.status);
    }

    console.error("Error in POST /api/auth/logout:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
