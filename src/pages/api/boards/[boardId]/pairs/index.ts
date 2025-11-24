import type { APIRoute } from "astro";
import { z } from "zod";
import { CreatePairSchema } from "../../../../../lib/validation/pairs";
import {
  createErrorResponse,
  createSuccessResponse,
  formatValidationErrors,
  getErrorMapping,
} from "../../../../../lib/utils/api-response";
import { ValidationError } from "../../../../../lib/utils/http-error";
import { addPairToBoard } from "../../../../../lib/services/board.service";

export const prerender = false;

const PathParamSchema = z.object({
  boardId: z.string().uuid("Invalid board id"),
});

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      const unauthorized = getErrorMapping("UNAUTHORIZED");
      return unauthorized
        ? createErrorResponse(unauthorized.response, unauthorized.status)
        : createErrorResponse({ error: "Unauthorized" }, 401);
    }

    // 1. Validate path params
    const paramRes = PathParamSchema.safeParse(params);
    if (!paramRes.success) {
      const errors = formatValidationErrors(paramRes.error);
      throw new ValidationError("Validation failed", errors);
    }

    // 2. Validate body JSON
    const bodyJson = await request.json().catch(() => undefined);
    if (!bodyJson) {
      throw new ValidationError("Invalid JSON body", []);
    }
    const bodyRes = CreatePairSchema.safeParse(bodyJson);
    if (!bodyRes.success) {
      const errors = formatValidationErrors(bodyRes.error);
      throw new ValidationError("Validation failed", errors);
    }

    // 3. Service call
    const { boardId } = paramRes.data;
    const created = await addPairToBoard(locals.supabase, user.id, boardId, bodyRes.data);

    return createSuccessResponse(created, 201);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return createErrorResponse(error.response, error.status);
    }

    if (error instanceof Error) {
      const mapping = getErrorMapping(error.message);
      if (mapping) {
        return createErrorResponse(mapping.response, mapping.status);
      }
    }

    console.error("Error in POST /api/boards/:boardId/pairs:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
