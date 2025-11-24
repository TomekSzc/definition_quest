import type { APIRoute } from "astro";
import { CreateNextLevelSchema } from "../../../lib/validation/board-level";
import { createBoardNextLevel } from "../../../lib/services/board.service";
import {
  createErrorResponse,
  createSuccessResponse,
  formatValidationErrors,
  getErrorMapping,
} from "../../../lib/utils/api-response";
import { HttpError, ValidationError } from "../../../lib/utils/http-error";

export const prerender = false;

/**
 * POST /api/boards/level
 *
 * Creates the next level of an existing board owned by the authenticated user.
 *
 * @returns 201 Created - BoardDetailDTO
 * @returns 400 Bad Request - Validation failed / business rule violation
 * @returns 401 Unauthorized - Not owner / unauthenticated
 * @returns 404 Not Found - Board does not exist
 * @returns 500 Internal Server Error - Unhandled errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw new HttpError("Unauthorized", 401);
    }

    // 1. Parse & validate request body
    const body = await request.json().catch(() => undefined);
    if (!body) {
      throw new HttpError("Invalid JSON in request body", 400);
    }

    const parseResult = CreateNextLevelSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = formatValidationErrors(parseResult.error);
      throw new ValidationError("Validation failed", errors);
    }

    const cmd = parseResult.data;

    // 2. Call service layer
    const message = await createBoardNextLevel(locals.supabase, user.id, cmd);
    return createSuccessResponse({ message }, 201);
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return createErrorResponse(error.response || error.message, error.status);
    }

    if (error instanceof ValidationError) {
      return createErrorResponse(error.response, error.status);
    }

    if (error instanceof Error) {
      const mapping = getErrorMapping(error.message);
      if (mapping) {
        return createErrorResponse(mapping.response, mapping.status);
      }
    }

    console.error("Error in POST /api/boards/level:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
