import type { APIRoute } from "astro";
import { CreateBoardSchema, ListBoardsSchema } from "../../../lib/validation/boards";
import { createBoard, listPublicBoards } from "../../../lib/services/board.service";
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
 * GET /api/boards
 *
 * Lists public, non-archived boards with pagination, optional FTS search, tag filter,
 * author filter and sorting. Anonymous access permitted.
 *
 * @returns 200 OK - Paged<BoardSummaryDTO>
 * @returns 400 Bad Request - Invalid query params
 * @returns 500 Internal Server Error - Unexpected errors
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // 1. Parse & validate query params
    const parseResult = ListBoardsSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parseResult.success) {
      const errors = formatValidationErrors(parseResult.error);
      throw new ValidationError("Validation failed", errors);
    }

    // 2. Service call (no auth required, use service with public filter)
    const paged = await listPublicBoards(locals.supabase, parseResult.data);

    return createSuccessResponse(paged);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return createErrorResponse(error.response, error.status);
    }

    if (error instanceof Error) {
      const mapping = getErrorMapping(error.message);
      if (mapping) {
        return createErrorResponse(mapping.response, mapping.status);
      }
    }

    console.error("Error in GET /api/boards:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

/**
 * POST /api/boards
 *
 * Creates one or more board levels with provided term-definition pairs.
 * Slices the provided pairs into chunks of `cardCount/2` terms; each chunk becomes a separate level.
 *
 * Authentication is required and enforced by global middleware.
 *
 * @returns 201 Created - { message: string }
 * @returns 400 Bad Request - Validation failed
 * @returns 401 Unauthorized - No auth
 * @returns 409 Conflict - Duplicate title/level constraint violation
 * @returns 500 Internal Server Error - Unhandled errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw new HttpError("Unauthorized", 401);
    }

    // 1. Parse & validate body
    const body = await request.json().catch(() => undefined);
    if (!body) {
      throw new HttpError("Invalid JSON in request body", 400);
    }

    const parseResult = CreateBoardSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = formatValidationErrors(parseResult.error);
      throw new ValidationError("Validation failed", errors);
    }

    const command = parseResult.data;

    // 2. Call service layer
    const message = await createBoard(locals.supabase, user.id, command);

    return createSuccessResponse({ message }, 201);
  } catch (error: any) {
    if (error instanceof HttpError) {
      return createErrorResponse(error.response || error.message, error.status);
    }

    if (error instanceof Error) {
      const mapping = getErrorMapping(error.message);
      if (mapping) {
        return createErrorResponse(mapping.response, mapping.status);
      }

      if ((error as any).code === "23505") {
        return createErrorResponse(getErrorMapping("DUPLICATE_BOARD")!.response, 409);
      }
    }

    console.error("Error in POST /api/boards:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
