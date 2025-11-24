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
import { PatchBoardSchema } from "../../../lib/validation/boards";
import { updateBoardMeta } from "../../../lib/services/board.service";
import { archiveBoard } from "../../../lib/services/board.service";

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
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return createErrorResponse(error.response, error.status);
    }

    if (error instanceof Error) {
      if (error.message === "BOARD_NOT_FOUND" || error.message === "BOARD_PRIVATE") {
        const map = getErrorMapping(error.message);
        if (map) {
          return createErrorResponse(map.response, map.status);
        }
      }
      const mapping = getErrorMapping(error.message);
      if (mapping) {
        return createErrorResponse(mapping.response, mapping.status);
      }
    }

    return createErrorResponse("Internal server error", 500);
  }
};

/**
 * PATCH /api/boards/:id
 *
 * Partial update of board metadata (title, isPublic, archived, tags).
 */
export const PATCH: APIRoute = async ({ params, locals, request }) => {
  try {
    // 1. Validate path param
    const idParse = BoardIdParamSchema.safeParse(params);
    if (!idParse.success) {
      const errors = formatValidationErrors(idParse.error);
      throw new ValidationError("Validation failed", errors);
    }
    const { id } = idParse.data;

    // 2. Ensure authenticated user
    if (!locals.user) {
      throw new HttpError("Authentication required", 401);
    }
    const userId = locals.user.id;

    // 3. Parse and validate body
    const body = await request.json();
    const bodyParse = PatchBoardSchema.safeParse(body);
    if (!bodyParse.success) {
      const errors = formatValidationErrors(bodyParse.error);
      throw new ValidationError("Validation failed", errors);
    }
    const payload = bodyParse.data;

    // 4. Update board
    const message = await updateBoardMeta(locals.supabase, userId, id, payload);

    return createSuccessResponse({ message });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return createErrorResponse(error.response, error.status);
    }

    if (error instanceof HttpError) {
      return createErrorResponse({ error: error.message }, error.status);
    }

    if (error instanceof Error) {
      const mapping = getErrorMapping(error.message);
      if (mapping) {
        return createErrorResponse(mapping.response, mapping.status);
      }
    }

    return createErrorResponse("Internal server error", 500);
  }
};

/**
 * DELETE /api/boards/:id
 *
 * Soft-archives board (archived = true).
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate path param
    const parse = BoardIdParamSchema.safeParse(params);
    if (!parse.success) {
      const errors = formatValidationErrors(parse.error);
      throw new ValidationError("Validation failed", errors);
    }
    const { id } = parse.data;

    // 2. Ensure authenticated user
    if (!locals.user) {
      throw new HttpError("Authentication required", 401);
    }

    const userId = locals.user.id;

    // 3. Archive board
    const message = await archiveBoard(locals.supabase, userId, id);

    return createSuccessResponse({ message });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return createErrorResponse(error.response, error.status);
    }

    if (error instanceof HttpError) {
      return createErrorResponse({ error: error.message }, error.status);
    }

    if (error instanceof Error) {
      const mapping = getErrorMapping(error.message);
      if (mapping) {
        return createErrorResponse(mapping.response, mapping.status);
      }
    }

    return createErrorResponse("Internal server error", 500);
  }
};
