import { v4 as uuid } from "uuid";
import type { SupabaseClient } from "../../db/supabase.client";

/**
 * Upserts a score for the given board & user.
 * Returns the DB record id, elapsedMs, and whether it was newly inserted.
 *
 * Business rules:
 *  • The board must exist and be accessible (public or owned by user).
 *  • We only keep the latest submitted time – previous value is overwritten.
 *
 * Throws business error codes (string) that can be mapped in the route:
 *  • "BOARD_NOT_FOUND" – board doesn't exist or user has no access
 */
export async function upsertScore(
  supabase: SupabaseClient,
  userId: string,
  boardId: string,
  elapsedMs: number
): Promise<{ id: string; elapsedMs: number; isNew: boolean }> {
  // 1. Verify board existence & accessibility
  const { data: boardRow, error: boardError } = await supabase
    .from("boards")
    .select("id, owner_id, is_public")
    .eq("id", boardId)
    .maybeSingle();

  if (boardError) {
    console.error("Error verifying board existence:", boardError);
    throw new Error("SERVER_ERROR");
  }

  if (!boardRow) {
    throw new Error("BOARD_NOT_FOUND");
  }

  // When board is private ensure user is owner
  if (!boardRow.is_public && boardRow.owner_id !== userId) {
    throw new Error("BOARD_NOT_FOUND");
  }

  // 2. Check if a score already exists (for HTTP status purposes only)
  const { data: existingScore, error: existingError } = await supabase
    .from("scores")
    .select("id")
    .eq("user_id", userId)
    .eq("board_id", boardId)
    .maybeSingle();

  if (existingError) {
    console.error("Error checking existing score:", existingError);
    throw new Error("SERVER_ERROR");
  }

  const newId = existingScore?.id ?? uuid();

  // 3. Upsert score
  const { data: upserted, error: upsertError } = await supabase
    .from("scores")
    .upsert(
      {
        id: newId,
        user_id: userId,
        board_id: boardId,
        elapsed_ms: elapsedMs,
      },
      {
        onConflict: "user_id,board_id",
        ignoreDuplicates: false,
      }
    )
    .select("id, elapsed_ms")
    .single();

  if (upsertError || !upserted) {
    console.error("Error upserting score:", upsertError);
    throw new Error("SERVER_ERROR");
  }

  return {
    id: upserted.id,
    elapsedMs: upserted.elapsed_ms,
    isNew: !existingScore,
  };
}
