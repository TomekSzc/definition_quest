import { v4 as uuid } from "uuid";
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  PairDTO,
  PaginationMeta,
  BoardSummaryDTO,
  Paged,
  BoardDetailDTO,
  BoardMyScoreDTO,
  BoardViewDTO,
  PlayedBoardDTO,
} from "../../types";
import type { CreateBoardInput } from "../validation/boards";
import type { ListBoardsQuery } from "../validation/boards";
import type { Database } from "../../db/database.types";
// Board row type corresponding to the selected columns from the `boards` table
type BoardSelect = Pick<
  Database["public"]["Tables"]["boards"]["Row"],
  "id" | "owner_id" | "title" | "card_count" | "level" | "is_public" | "archived" | "tags" | "created_at" | "updated_at"
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
export async function fetchInsertedPairs(supabase: SupabaseClient, boardId: string): Promise<PairDTO[]> {
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
  pairs: { term: string; definition: string }[]
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
 * Creates the next level for an existing board (identified by boardId of any previous level)
 * adhering to business rules described in CreateNextLevelCmd.
 *
 * Preconditions (caller responsibility):
 *   • supabase client authenticated as the board owner (middleware enforces JWT)
 *
 * @throws Error codes (string) mapped by api-response.getErrorMapping
 *   • BOARD_NOT_FOUND – board id not found
 *   • NOT_OWNER – current user is not the owner
 *   • BOARD_ARCHIVED – board is archived
 *   • INVALID_INPUT – pairs length mismatch with cardCount/2
 */
export async function createBoardNextLevel(
  supabase: SupabaseClient,
  ownerId: string,
  command: { boardId: string; pairs: { term: string; definition: string }[] }
): Promise<string> {
  const { boardId, pairs } = command;

  // 1. Fetch reference board row to inherit properties
  const { data: baseRow, error: selectErr } = await supabase
    .from("boards")
    .select("id, owner_id, title, card_count, is_public, tags, archived")
    .eq("id", boardId)
    .maybeSingle();

  if (selectErr) {
    console.error("Error selecting board:", selectErr);
    throw selectErr;
  }

  if (!baseRow) {
    throw new Error("BOARD_NOT_FOUND");
  }

  if (baseRow.owner_id !== ownerId) {
    throw new Error("NOT_OWNER");
  }

  if (baseRow.archived) {
    throw new Error("BOARD_ARCHIVED");
  }

  // 2. Business validation – cannot exceed cardCount/2 pairs
  const maxExpectedPairs = baseRow.card_count / 2;
  if (pairs.length > maxExpectedPairs) {
    throw new Error("INVALID_INPUT");
  }

  // 3. Determine next level
  const { data: maxRes, error: maxErr } = await supabase
    .from("boards")
    .select("level")
    .eq("owner_id", ownerId)
    .eq("title", baseRow.title)
    .order("level", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxErr) {
    console.error("Error fetching max level:", maxErr);
    throw maxErr;
  }

  const nextLevel = (maxRes?.level ?? 0) + 1;

  // 4. Insert new board level
  const { data: newBoard, error: insertErr } = await supabase
    .from("boards")
    .insert({
      id: uuid(),
      owner_id: ownerId,
      title: baseRow.title,
      card_count: baseRow.card_count,
      level: nextLevel,
      is_public: baseRow.is_public,
      archived: false,
      tags: baseRow.tags,
    })
    .select()
    .single();

  if (insertErr || !newBoard) {
    console.error("Error inserting next level board:", insertErr);
    throw insertErr ?? new Error("INSERT_BOARD_FAILED");
  }

  // 5. Insert pairs
  await insertPairsForBoard(supabase, newBoard.id, pairs);

  // 6. Return confirmation message
  return `Level ${newBoard.level} of ${newBoard.title} created`;
}

/**
 * Lists public, non-archived boards with optional search, filters, sorting and pagination.
 * When ownerId is provided, returns both public and private boards for that owner.
 * Without ownerId, returns only public boards.
 */
export async function listPublicBoards(
  supabase: SupabaseClient,
  query: ListBoardsQuery
): Promise<Paged<BoardSummaryDTO>> {
  const { page, pageSize, q, tags, ownerId, sort, direction } = query;

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
    .select("id, owner_id, title, card_count, level, is_public, archived, tags, created_at, updated_at", {
      count: "exact",
    })
    .eq("archived", false);

  // When ownerId is provided, show all boards (public + private) for that owner
  // Otherwise, show only public boards
  if (ownerId) {
    request = request.eq("owner_id", ownerId);
  } else {
    request = request.eq("is_public", true);
  }

  // Perform case-insensitive substring search on the title or tags.
  // Using ilike allows queries with single characters (e.g., "a") to match any title containing that substring.
  // For tags, we check if any tag in the array contains the query string (case-insensitive).
  if (q) {
    // Escape special characters for pattern matching
    const escapedQ = q.replace(/[%_\\]/g, '\\$&');
    // Search in title (substring) OR in tags array (exact match or substring)
    // Format: title.ilike.pattern OR tags.cs.{value}
    request = request.or(`title.ilike.%${escapedQ}%,tags.cs.{${escapedQ}}`);
  }

  if (tags && tags.length) {
    request = request.contains("tags", tags);
  }

  request = request.order(columnMap[sort], { ascending: direction === "asc" }).range(from, to);

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

/**
 * Lists public, non-archived boards that the given user has played (has at least one score).
 * Uses an inner join on `scores` limited to `user_id` plus standard filters/search/sort/pagination.
 */
export async function listBoardsPlayedByUser(
  supabase: SupabaseClient,
  userId: string,
  query: Omit<ListBoardsQuery, "ownerId">
): Promise<Paged<PlayedBoardDTO>> {
  const { page, pageSize, q, tags, sort, direction } = query;

  const columnMap: Record<ListBoardsQuery["sort"], string> = {
    created: "created_at",
    updated: "updated_at",
    cardCount: "card_count",
  } as const;

  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;

  let request = supabase
    .from("boards")
    .select(
      "id, owner_id, title, card_count, level, is_public, archived, tags, created_at, updated_at, scores!inner(user_id, elapsed_ms)",
      { count: "exact" }
    )
    .eq("archived", false)
    .eq("scores.user_id", userId);

  if (q) {
    // Escape special characters for pattern matching
    const escapedQ = q.replace(/[%_\\]/g, '\\$&');
    // Case-insensitive substring match on board title or tags
    // Search in title (substring) OR in tags array (exact match)
    request = request.or(`title.ilike.%${escapedQ}%,tags.cs.{${escapedQ}}`);
  }

  if (tags && tags.length) {
    request = request.contains("tags", tags);
  }

  request = request.order(columnMap[sort], { ascending: direction === "asc" }).range(from, to);

  const { data, error, count } = await request;

  if (error) {
    console.error("Error selecting played boards:", error);
    throw error;
  }

  // Remove duplicates and pick bestTime
  const uniqueMap = new Map<string, PlayedBoardDTO>();

  interface PlayedBoardRow {
    id: string;
    owner_id: string;
    title: string;
    card_count: number;
    level: number;
    is_public: boolean;
    tags: string[];
    created_at: string;
    updated_at: string;
    scores?: { elapsed_ms: number }[];
  }

  (data ?? []).forEach((r: PlayedBoardRow) => {
    const existing = uniqueMap.get(r.id);
    const scoresArr = Array.isArray(r.scores) ? r.scores : [];
    const elapsed = scoresArr.length ? scoresArr[0].elapsed_ms : 0;

    if (!existing) {
      uniqueMap.set(r.id, {
        id: r.id,
        ownerId: r.owner_id,
        title: r.title,
        cardCount: r.card_count,
        level: r.level,
        isPublic: r.is_public,
        tags: r.tags,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        lastTime: elapsed,
      });
    } else if (elapsed !== 0) {
      // For MVP we keep the most recent score regardless of value (scores returned sorted by board order, not time)
      existing.lastTime = elapsed;
    }
  });

  const boards = Array.from(uniqueMap.values());

  const meta: PaginationMeta = {
    page,
    pageSize,
    total: count ?? boards.length,
  };

  return { data: boards, meta };
}

/**
 * Fetch a single board with pairs and the current user last score (if any).
 * Ensures board exists, is not archived and user has access.
 *
 * @throws Error("BOARD_NOT_FOUND") when no board or no access
 */
export async function fetchBoardById(
  supabase: SupabaseClient,
  boardId: string,
  userId?: string
): Promise<BoardViewDTO> {
  // Build base select with left joins
  let request = supabase
    .from("boards")
    .select(
      `id, owner_id, title, card_count, level, is_public, archived, tags, created_at, updated_at,
       pairs(id, term, definition),
       scores(elapsed_ms)`
    )
    .eq("id", boardId)
    .eq("archived", false);

  // Filter score by current user if provided
  if (userId) {
    request = request.eq("scores.user_id", userId);
  }

  const { data, error } = await request.maybeSingle();

  if (error) {
    console.error("Error fetching board by id:", error);
    throw error;
  }

  if (!data) {
    throw new Error("BOARD_NOT_FOUND");
  }

  // If board is private and user is not owner
  if (!data.is_public && data.owner_id !== userId) {
    throw new Error("BOARD_PRIVATE");
  }

  // Map to DTOs
  interface PairRow {
    id: string;
    term: string;
    definition: string;
    level?: number;
  }

  const pairs: PairDTO[] = (data.pairs ?? []).map((p: PairRow) => ({
    id: p.id,
    term: p.term,
    definition: p.definition,
  }));

  const boardDetail: BoardDetailDTO = {
    id: data.id,
    ownerId: data.owner_id,
    title: data.title,
    cardCount: data.card_count,
    level: data.level,
    isPublic: data.is_public,
    archived: data.archived,
    tags: data.tags,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    pairs,
  };

  const myScore: BoardMyScoreDTO | undefined =
    data.scores && data.scores.length ? { lastTime: data.scores[0].elapsed_ms } : undefined;

  return { ...boardDetail, myScore };
}

// NEW CODE: Update board meta (title, is_public, archived, tags)
export async function updateBoardMeta(
  supabase: SupabaseClient,
  userId: string,
  boardId: string,
  payload: {
    title?: string;
    isPublic?: boolean;
    tags?: string[];
  }
): Promise<string> {
  // 1. Fetch board to verify ownership and current status
  const { data: boardRow, error: selectErr } = await supabase
    .from("boards")
    .select("id, owner_id, title, card_count, level, is_public, archived, tags, created_at, updated_at")
    .eq("id", boardId)
    .maybeSingle();

  if (selectErr) {
    console.error("Error selecting board:", selectErr);
    throw selectErr;
  }

  if (!boardRow) {
    throw new Error("BOARD_NOT_FOUND");
  }

  if (boardRow.owner_id !== userId) {
    throw new Error("NOT_OWNER");
  }

  // Disallow modifications on archived boards
  if (boardRow.archived) {
    throw new Error("BOARD_ARCHIVED");
  }

  // 2. Build update object, skipping undefined fields
  const updateColumns = Object.fromEntries(
    Object.entries({
      title: payload.title,
      is_public: payload.isPublic,
      tags: payload.tags,
    }).filter(([, value]) => value !== undefined)
  );

  if (Object.keys(updateColumns).length === 0) {
    // Client did not provide any new values.
    throw new Error("NO_CHANGES");
  }

  updateColumns.updated_at = new Date().toISOString();

  // 3. Apply update to all levels (same owner & current title)
  const { error: updateErr2 } = await supabase
    .from("boards")
    .update(updateColumns)
    .eq("owner_id", userId)
    .eq("title", boardRow.title);

  if (updateErr2) {
    if ((updateErr2 as { code?: string }).code === "23505") {
      throw new Error("DUPLICATE_BOARD");
    }
    console.error("Error updating boards:", updateErr2);
    throw updateErr2;
  }

  return `updated ${Object.keys(updateColumns).join(", ")} for all levels`;
}

export async function updatePair(
  supabase: SupabaseClient,
  userId: string,
  boardId: string,
  pairId: string,
  updates: { term?: string; definition?: string }
): Promise<{ id: string; term: string; definition: string }> {
  // 1. Ensure board exists and user is owner
  const { data: boardRow, error: boardErr } = await supabase
    .from("boards")
    .select("owner_id, archived")
    .eq("id", boardId)
    .maybeSingle();

  if (boardErr) {
    console.error("Error selecting board:", boardErr);
    throw boardErr;
  }

  if (!boardRow) {
    throw new Error("BOARD_NOT_FOUND");
  }

  if (boardRow.archived) {
    throw new Error("BOARD_ARCHIVED");
  }

  if (boardRow.owner_id !== userId) {
    throw new Error("NOT_OWNER");
  }

  // 2. Perform update
  const { data: pairRow, error: pairErr } = await supabase
    .from("pairs")
    .update({ ...updates })
    .eq("id", pairId)
    .eq("board_id", boardId)
    .select("id, term, definition")
    .maybeSingle();

  if (pairErr) {
    console.error("Error updating pair:", pairErr);
    throw pairErr;
  }

  if (!pairRow) {
    throw new Error("PAIR_NOT_FOUND");
  }

  return {
    id: pairRow.id,
    term: pairRow.term,
    definition: pairRow.definition,
  };
}

export async function removePair(
  supabase: SupabaseClient,
  userId: string,
  boardId: string,
  pairId: string
): Promise<{ id: string; boardId: string }> {
  // 1. Ensure board exists and user is owner and not archived
  const { data: boardRow, error: boardErr } = await supabase
    .from("boards")
    .select("owner_id, archived")
    .eq("id", boardId)
    .maybeSingle();

  if (boardErr) {
    console.error("Error selecting board:", boardErr);
    throw boardErr;
  }

  if (!boardRow) {
    throw new Error("BOARD_NOT_FOUND");
  }

  if (boardRow.archived) {
    throw new Error("BOARD_ARCHIVED");
  }

  if (boardRow.owner_id !== userId) {
    throw new Error("NOT_OWNER");
  }

  // 2. Delete pair
  const { data: deletedRow, error: delErr } = await supabase
    .from("pairs")
    .delete()
    .eq("id", pairId)
    .eq("board_id", boardId)
    .select("id, board_id")
    .maybeSingle();

  if (delErr) {
    console.error("Error deleting pair:", delErr);
    throw delErr;
  }

  if (!deletedRow) {
    throw new Error("PAIR_NOT_FOUND");
  }

  return {
    id: deletedRow.id,
    boardId: deletedRow.board_id,
  };
}

export async function addPairToBoard(
  supabase: SupabaseClient,
  userId: string,
  boardId: string,
  input: { term: string; definition: string }
): Promise<{ id: string; term: string; definition: string }> {
  // 1. Ensure board exists and user is owner
  const { data: boardRow, error: boardErr } = await supabase
    .from("boards")
    .select("owner_id, card_count, archived")
    .eq("id", boardId)
    .maybeSingle();

  if (boardErr) {
    console.error("Error selecting board:", boardErr);
    throw boardErr;
  }

  if (!boardRow) {
    throw new Error("BOARD_NOT_FOUND");
  }

  if (boardRow.owner_id !== userId) {
    throw new Error("NOT_OWNER");
  }

  if (boardRow.archived) {
    throw new Error("BOARD_ARCHIVED");
  }

  // 2. Check card limit
  const { count: pairCount, error: countErr } = await supabase
    .from("pairs")
    .select("id", { count: "exact", head: true })
    .eq("board_id", boardId);

  if (countErr) {
    console.error("Error counting pairs:", countErr);
    throw countErr;
  }

  const maxPairs = boardRow.card_count / 2;
  if ((pairCount ?? 0) >= maxPairs) {
    throw new Error("CARD_LIMIT_REACHED");
  }

  // 3. Insert new pair
  const newId = uuid();
  const { data: pairRow, error: insertErr } = await supabase
    .from("pairs")
    .insert({
      id: newId,
      board_id: boardId,
      term: input.term,
      definition: input.definition,
    })
    .select("id, term, definition")
    .single();

  if (insertErr) {
    // Unique violation
    if ((insertErr as { code?: string }).code === "23505") {
      throw new Error("DUPLICATE_PAIR");
    }

    console.error("Error inserting pair:", insertErr);
    throw insertErr;
  }

  if (!pairRow) {
    throw new Error("SERVER_ERROR");
  }

  return {
    id: pairRow.id,
    term: pairRow.term,
    definition: pairRow.definition,
  };
}

export async function archiveBoard(supabase: SupabaseClient, userId: string, boardId: string): Promise<string> {
  // 1. Fetch board to verify ownership and status
  const { data: boardRow, error: selectErr } = await supabase
    .from("boards")
    .select("owner_id, archived")
    .eq("id", boardId)
    .maybeSingle();

  if (selectErr) {
    console.error("Error selecting board:", selectErr);
    throw selectErr;
  }

  if (!boardRow) {
    throw new Error("BOARD_NOT_FOUND");
  }

  if (boardRow.owner_id !== userId) {
    throw new Error("NOT_OWNER");
  }

  if (boardRow.archived) {
    throw new Error("BOARD_ALREADY_ARCHIVED");
  }

  // 2. Soft-archive – affect only this board level
  const { error: updateErr } = await supabase
    .from("boards")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", boardId);

  if (updateErr) {
    console.error("Error archiving board:", updateErr);
    throw updateErr;
  }

  return "Board archived";
}
