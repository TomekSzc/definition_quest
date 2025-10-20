import { v4 as uuid } from "uuid";
import type { SupabaseClient } from "../../db/supabase.client";
import type { PairDTO } from "../../types";
import type { CreateBoardInput } from "../validation/boards";
import type { ListBoardsQuery } from "../validation/boards";
import type { PaginationMeta, BoardSummaryDTO, Paged } from "../../types";
import type { Database } from "../../db/database.types";
// Board row type corresponding to the selected columns from the `boards` table
type BoardSelect = Pick<
  Database["public"]["Tables"]["boards"]["Row"],
  | "id"
  | "owner_id"
  | "title"
  | "card_count"
  | "level"
  | "is_public"
  | "archived"
  | "tags"
  | "created_at"
  | "updated_at"
>;

/**
 * Splits an array into chunks of a given size.
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Fetches pairs belonging to a specific board (ordered by creation time) and
 * maps them to PairDTO objects.
 */
export async function fetchInsertedPairs(
  supabase: SupabaseClient,
  boardId: string,
): Promise<PairDTO[]> {
  const { data: pairRows, error } = await supabase
    .from("pairs")
    .select("id, term, definition")
    .eq("board_id", boardId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error selecting pairs:", error);
    throw error;
  }

  return (pairRows ?? []).map((r) => ({
    id: r.id,
    term: r.term,
    definition: r.definition,
  }));
}

/**
 * Inserts an array of term/definition pairs for the given board ID.
 */
export async function insertPairsForBoard(
  supabase: SupabaseClient,
  boardId: string,
  pairs: { term: string; definition: string }[],
): Promise<void> {
  const pairsPayload = pairs.map((p) => ({
    id: uuid(),
    board_id: boardId,
    term: p.term,
    definition: p.definition,
  }));

  const { error } = await supabase.from("pairs").insert(pairsPayload);
  if (error) {
    console.error("Error inserting pairs:", error);
    throw error;
  }
}

/**
 * Creates boards (potentially multiple levels) with associated pairs inside a single transaction.
 *
 * NOTE: Supabase JS does not yet expose explicit transaction helpers on the client.
 * Until they do, we rely on Postgres `rpc` call to a small SQL block. For MVP we
 * run sequential inserts and rely on RLS/unique constraints for integrity.
 *
 * @param supabase Authenticated Supabase client for the current user
 * @param ownerId  User ID owning the boards
 * @param command  Validated CreateBoardInput payload
 * @returns Array of BoardDetailDTO objects for the created boards
 */
export async function createBoard(
  supabase: SupabaseClient,
  ownerId: string,
  command: CreateBoardInput
): Promise<string> {
  const segmentSize = command.cardCount / 2;
  const segments = chunkArray(command.pairs, segmentSize);

  // We no longer need to build up full BoardDetailDTO objects; the frontend navigates away
  // after creation so we simply ensure inserts succeed.

  // Iterate over each segment (level)
  for (let i = 0; i < segments.length; i++) {
    const level = i + 1;
    const { data: boardRow, error: insertBoardError } = await supabase
      .from("boards")
      .insert({
        id: uuid(),
        owner_id: ownerId,
        title: command.title,
        card_count: command.cardCount,
        level,
        is_public: command.isPublic,
        tags: command.tags ?? [],
        archived: false,
      })
      .select()
      .single();

    if (insertBoardError || !boardRow) {
      console.error("Error inserting board:", insertBoardError);
      // Propagate original Supabase error so route handler can inspect code/message
      throw insertBoardError ?? new Error("INSERT_BOARD_FAILED");
    }

    // Bulk insert pairs for this board
    await insertPairsForBoard(supabase, boardRow.id, segments[i]);

    // No need to fetch pairs or build DTOs for the response
  }

  return `Board created with ${segments.length} level/s`;
}

/**
 * Lists public, non-archived boards with optional search, filters, sorting and pagination.
 */
export async function listPublicBoards(
  supabase: SupabaseClient,
  query: ListBoardsQuery
): Promise<Paged<BoardSummaryDTO>> {
  const {
    page,
    pageSize,
    q,
    tags,
    ownerId,
    sort,
    direction,
  } = query;

  // Mapping from API sort fields to DB column names
  const columnMap: Record<ListBoardsQuery["sort"], string> = {
    created: "created_at",
    updated: "updated_at",
    cardCount: "card_count",
  };

  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;

  let request = supabase
    .from("boards")
    .select(
      "id, owner_id, title, card_count, level, is_public, archived, tags, created_at, updated_at",
      { count: "exact" } 
    )
    .eq("archived", false)
    .eq("is_public", true);

  if (q) {
    request = request.textSearch("search_vector", q, { type: "plain" });
  }

  if (tags && tags.length) {
    request = request.contains("tags", tags);
  }

  if (ownerId) {
    request = request.eq("owner_id", ownerId);
  }

  request = request
    .order(columnMap[sort], { ascending: direction === "asc" })
    .range(from, to);

  const { data, error, count } = await request;

  if (error) {
    console.error("Error selecting public boards:", error);
    throw error;
  }

  const boards: BoardSummaryDTO[] = (data ?? []).map((r: BoardSelect) => ({
    id: r.id,
    ownerId: r.owner_id,
    title: r.title,
    cardCount: r.card_count,
    level: r.level,
    isPublic: r.is_public,
    archived: r.archived,
    tags: r.tags,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const meta: PaginationMeta = {
    page,
    pageSize,
    total: count ?? boards.length,
  };

  return { data: boards, meta };
}
