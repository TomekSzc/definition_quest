import type { APIRoute } from "astro";
import { ListPlayedBoardsSchema } from "../../../lib/validation/boards";
import { listBoardsPlayedByUser } from "../../../lib/services/board.service";
import {
  createErrorResponse,
  createSuccessResponse,
  formatValidationErrors,
  getErrorMapping,
} from "../../../lib/utils/api-response";

class HttpError extends Error {
  constructor(public message: string, public status: number, public response?: any) {
    super(message);
    this.name = "HttpError";
  }
}

class ValidationError extends HttpError {
  constructor(message: string, details: any) {
    super(message, 400, { error: message, details });
    this.name = "ValidationError";
  }
}

export const prerender = false;

/**
 * GET /api/boards/played
 *
 * Returns a paged list of boards (public or private) in which the authenticated user has at least one score.
 * Each item includes the user’s last recorded time (`lastTime`).
 * Supports the same query parameters as GET /api/boards except `ownerId`.
 *
 * @returns 200 OK - Paged<BoardSummaryDTO>
 * @returns 400 Bad Request - Invalid query params
 * @returns 401 Unauthorized - Missing or invalid auth token
 * @returns 500 Internal Server Error - Unexpected errors
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw new HttpError("Unauthorized", 401);
    }

    // 1. Parse & validate query params
    const parseResult = ListPlayedBoardsSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parseResult.success) {
      const errors = formatValidationErrors(parseResult.error);
      throw new ValidationError("Validation failed", errors);
    }

    // 2. Service call restricted to user
    const paged = await listBoardsPlayedByUser(locals.supabase, user.id, parseResult.data);

    return createSuccessResponse(paged);
  } catch (error: any) {
    if (error instanceof HttpError) {
      return createErrorResponse(error.response || error.message, error.status);
    }

    if (error instanceof Error) {
      const mapping = getErrorMapping(error.message);
      if (mapping) {
        return createErrorResponse(mapping.response, mapping.status);
      }
    }

    console.error("Error in GET /api/boards/played:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
