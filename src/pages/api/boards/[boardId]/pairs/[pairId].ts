import type { APIRoute } from "astro";
import { z } from "zod";
import { PatchPairSchema } from "../../../../../lib/validation/pairs";
import {
  createErrorResponse,
  createSuccessResponse,
  formatValidationErrors,
  getErrorMapping,
} from "../../../../../lib/utils/api-response";
import { ValidationError } from "../../../../../lib/utils/http-error";
import { updatePair } from "../../../../../lib/services/board.service";
import { removePair } from "../../../../../lib/services/board.service";
import { PairPathParamSchema } from "../../../../../lib/validation/pairs";

export const prerender = false;

const PathParamSchema = z.object({
  boardId: z.string().uuid("Invalid board id"),
  pairId: z.string().uuid("Invalid pair id"),
});

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      const map = getErrorMapping("UNAUTHORIZED")!;
      return createErrorResponse(map.response, map.status);
    }

    // 1. Validate params
    const paramResult = PathParamSchema.safeParse(params);
    if (!paramResult.success) {
      const errors = formatValidationErrors(paramResult.error);
      throw new ValidationError("Validation failed", errors);
    }
    // 2. Validate body
    const bodyJson = await request.json().catch(() => undefined);
    if (!bodyJson) {
      throw new ValidationError("Invalid JSON body", []);
    }
    const bodyResult = PatchPairSchema.safeParse(bodyJson);
    if (!bodyResult.success) {
      const errors = formatValidationErrors(bodyResult.error);
      throw new ValidationError("Validation failed", errors);
    }

    // 3. Service call
    const { boardId, pairId } = paramResult.data;
    const updated = await updatePair(
      locals.supabase,
      user.id,
      boardId,
      pairId,
      bodyResult.data,
    );

    return createSuccessResponse(updated);
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

    console.error("Error in PATCH /api/boards/:boardId/pairs/:pairId:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      const map = getErrorMapping("UNAUTHORIZED")!;
      return createErrorResponse(map.response, map.status);
    }

    // 1. Validate params
    const paramResult = PairPathParamSchema.safeParse(params);
    if (!paramResult.success) {
      const errors = formatValidationErrors(paramResult.error);
      throw new ValidationError("Validation failed", errors);
    }

    const { boardId, pairId } = paramResult.data;

    // 2. Service call
    const deleted = await removePair(locals.supabase, user.id, boardId, pairId);

    return createSuccessResponse({ ...deleted, message: "deleted" });
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

    console.error("Error in DELETE /api/boards/:boardId/pairs/:pairId:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
