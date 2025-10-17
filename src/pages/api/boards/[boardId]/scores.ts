import type { APIRoute } from "astro";
import {
  createErrorResponse,
  createSuccessResponse,
  formatValidationErrors,
  getErrorMapping,
} from "../../../../lib/utils/api-response";
import { SubmitScoreSchema } from "../../../../lib/validation/scores";
import { upsertScore } from "../../../../lib/services/score.service";

export const prerender = false;

// Custom HTTP error wrapper
class HttpError extends Error {
  constructor(public status: number, public body: Record<string, unknown> | string) {
    super(typeof body === "string" ? body : JSON.stringify(body));
    this.name = "HttpError";
  }
}

async function handleUpsert(
  { params, request, locals }: Parameters<APIRoute>[0],
  httpMethod: "POST" | "PATCH",
): Promise<Response> {
  try {
    const { boardId } = params;

    if (!boardId) {
      throw new HttpError(400, { error: "INVALID_BOARD_ID" });
    }

    const user = locals.user;
    if (!user) {
      throw new HttpError(401, { error: "UNAUTHORIZED" });
    }

    // Parse JSON body
    const body = await request.json().catch(() => undefined);
    if (!body) {
      throw new HttpError(400, { error: "INVALID_JSON" });
    }

    const parseResult = SubmitScoreSchema.safeParse(body);
    if (!parseResult.success) {
      const details = formatValidationErrors(parseResult.error);
      throw new HttpError(400, { error: "invalid_input", details });
    }

    const { elapsedMs } = parseResult.data;

    // Business logic – upsert score
    const result = await upsertScore(
      locals.supabase,
      user.id,
      boardId,
      elapsedMs,
    );

    let status: number;
    if (httpMethod === "POST") {
      status = result.isNew ? 201 : 200;
    } else {
      // PATCH – 200 OK for both insert & update (idempotent semantics)
      status = 200;
    }
    return createSuccessResponse(
      { id: result.id, elapsedMs: result.elapsedMs },
      status,
    );
  } catch (error) {
    if (error instanceof HttpError) {
      return createErrorResponse(error.body, error.status);
    }

    if (error instanceof Error) {
      const mapped = getErrorMapping(error.message);
      if (mapped) {
        return createErrorResponse(mapped.response, mapped.status);
      }
    }
    console.error("Error in POST /boards/:boardId/scores", error);
    return createErrorResponse({ error: "SERVER_ERROR" }, 500);
  }
}

export const POST: APIRoute = (ctx) => handleUpsert(ctx, "POST");

export const PATCH: APIRoute = (ctx) => handleUpsert(ctx, "PATCH");
