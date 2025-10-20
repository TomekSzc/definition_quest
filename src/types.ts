// Data Transfer Objects (DTO) and Command Models for the REST API layer.
// These types are derived – as much as possible – from the generated
// table/view types in `src/db/database.types.ts` to guarantee
// consistency with the database schema.
//
// NOTE: Field names are converted from snake_case (DB) to camelCase (API)
// manually to match the public contract. Where a column is reused verbatim
// the underlying DB column type is referenced to preserve accuracy.

import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./db/database.types";

/**
 * Helpers ────────────────────────────────────────────────────────────────
 */

/** Enforce an exact set of keys – no excess properties allowed. */
export type Strict<T extends object> = {
  [K in keyof T]: T[K];
} & {
  [K: string]: never;
};

/**
 * Pagination metadata returned alongside collection endpoints.
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Shared enums / literals
 */
export type SortDirection = "asc" | "desc";

/**
 * User Profiles ──────────────────────────────────────────────────────────
 */

type UserMetaRow = Tables<"user_meta">;

export interface PublicUserProfileDTO {
  id: string;
  displayName: UserMetaRow["display_name"];
  avatarUrl?: UserMetaRow["avatar_url"];
}

export interface UserProfileMeDTO extends PublicUserProfileDTO {
  email: string; // comes from `auth.users` which is managed by Supabase Auth
  createdAt: UserMetaRow["created_at"];
}

export type UpdateProfileCmd = Strict<
  Partial<Pick<UserProfileMeDTO, "displayName" | "avatarUrl">>
>;

/**
 * Boards & Pairs ─────────────────────────────────────────────────────────
 */

type BoardRow = Tables<"boards">;
type PairRow = Tables<"pairs">;

export interface PairDTO {
  id: PairRow["id"];
  term: PairRow["term"];
  definition: PairRow["definition"];
}

export interface BoardSummaryDTO {
  id: BoardRow["id"];
  ownerId: BoardRow["owner_id"];
  title: BoardRow["title"];
  cardCount: BoardRow["card_count"];
  level: BoardRow["level"];
  isPublic: BoardRow["is_public"];
  archived: BoardRow["archived"];
  tags: BoardRow["tags"];
  createdAt: BoardRow["created_at"];
  updatedAt: BoardRow["updated_at"];
}

export interface BoardDetailDTO extends BoardSummaryDTO {
  pairs: PairDTO[];
}

/**
 * Command models for Boards
 */
export type PairCreateCmd = Strict<Omit<PairDTO, "id">>;
export type PairUpdateCmd = Strict<Partial<Omit<PairDTO, "id">>>;

export interface CreateBoardCmd {
  title: BoardRow["title"];
  cardCount: 16 | 24; // allowed by business rule
  pairs: PairCreateCmd[]; // must match cardCount / 2 length – validated server-side
  isPublic: BoardRow["is_public"];
  tags?: BoardRow["tags"];
}

export interface GenerateBoardCmd extends Omit<CreateBoardCmd, "pairs"> {
  inputText: string; // ≤ 5k chars raw content
}

export type ReplaceBoardCmd = Strict<CreateBoardCmd>;
export type PatchBoardCmd = Strict<
  Partial<Omit<CreateBoardCmd, "pairs">> & {
    archived?: boolean;
    pairs?: PairCreateCmd[];
  }
>;

/**
 * Score / Leaderboard ────────────────────────────────────────────────────
 */

type ScoreRow = Tables<"scores">;

export interface ScoreSubmitCmd {
  elapsedMs: number; // validated > 0 on server
}

export interface LeaderboardScoreDTO {
  userId: ScoreRow["user_id"];
  bestTime: ScoreRow["elapsed_ms"];
  displayName?: UserMetaRow["display_name"] | null;
}

export interface MyScoreDTO {
  boardId: ScoreRow["board_id"];
  bestTime: ScoreRow["elapsed_ms"];
  boardTitle: BoardRow["title"];
}

/**
 * Extended board summary returned by GET /boards/played – includes the user’s best time for that board.
 */
export type PlayedBoardDTO = Omit<BoardSummaryDTO, "archived"> & {
  lastTime: ScoreRow["elapsed_ms"];
};

/**
 * AI endpoints ───────────────────────────────────────────────────────────
 */

type AiRequestRow = Tables<"ai_requests">;

export interface AiUsageDTO {
  remaining: number;
  resetAt: string; // ISO date string when quota resets
}

export type AiRequestDTO = {
  id: AiRequestRow["id"];
  userId: AiRequestRow["user_id"];
  model: AiRequestRow["model"];
  promptTokens: AiRequestRow["prompt_tokens"];
  costUsd: AiRequestRow["cost_usd"];
  status: AiRequestRow["status"];
  requestedAt: AiRequestRow["requested_at"];
};

export interface BoardGenerationEnqueuedDTO {
  jobId: string; // uuid from ai_requests.id
  wsChannel: string; // e.g., "ai:requests:<jobId>"
}

/**
 * Response from AI board generation containing generated pairs.
 * Used for synchronous generation flow (MVP).
 */
export interface GeneratedPair {
  term: string;
  definition: string;
}

export interface BoardGenerationResultDTO {
  pairs: GeneratedPair[];
  requestId: string; // uuid from ai_requests.id for tracking
}

/**
 * Collection wrappers ───────────────────────────────────────────────────
 */
export interface Paged<T> {
  data: T[];
  meta: PaginationMeta;
}
