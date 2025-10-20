import type { APIRoute } from "astro";
import { BoardIdParamSchema } from "../../../lib/validation/boards";
import { fetchBoardById } from "../../../lib/services/board.service";
import {
  createErrorResponse,
  createSuccessResponse,
  formatValidationErrors,
  getErrorMapping,
} from "../../../lib/utils/api-response";
import { HttpError, ValidationError } from "../../../lib/utils/http-error";

export const prerender = false;

/**
 * GET /api/boards/:id
 *
 * Returns board metadata, pairs and the current user last time (if any).
 * Public boards accessible to anyone; private boards only to owner.
 *
 * @returns 200 OK - BoardViewDTO
 * @returns 400 Bad Request - Invalid id param
 * @returns 401 Unauthorized - Private board, not owner
 * @returns 404 Not Found - Board not found or archived
 * @returns 500 Internal Server Error - Unexpected errors
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate path param
    const parseResult = BoardIdParamSchema.safeParse(params);
    if (!parseResult.success) {
      const errors = formatValidationErrors(parseResult.error);
      throw new ValidationError("Validation failed", errors);
    }

    const { id } = parseResult.data;
    const userId = locals.user?.id;

    // 2. Fetch board
    const board = await fetchBoardById(locals.supabase, id, userId);

    return createSuccessResponse(board);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return createErrorResponse(error.response, error.status);
    }

    if (error instanceof Error) {
      if (error.message === "BOARD_NOT_FOUND" || error.message === "BOARD_PRIVATE") {
        const map = getErrorMapping(error.message);
        return createErrorResponse(map!.response, map!.status);
      }
      const mapping = getErrorMapping(error.message);
      if (mapping) {
        return createErrorResponse(mapping.response, mapping.status);
      }
    }

    console.error("Error in GET /api/boards/:id:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
