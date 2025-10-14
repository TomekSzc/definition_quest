-- =====================================================================
-- Migration: Create scores Table
-- Description: Tracks best completion times for users on each board
-- Tables: scores
-- Dependencies: auth.users, boards
-- =====================================================================

-- create scores table for tracking user performance on boards
-- stores only the best (fastest) completion time per user per board
create table scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid not null references boards(id) on delete cascade,
  elapsed_ms integer not null check (elapsed_ms > 0),
  played_at timestamptz not null default now()
);

-- unique constraint: one best score per user per board
-- this enforces that we only keep the fastest time
alter table scores 
  add constraint scores_user_board_unique 
  unique (user_id, board_id);

-- index on board_id for leaderboard queries per board
create index scores_board_id_idx on scores(board_id);

-- index on user_id for user performance history
create index scores_user_id_idx on scores(user_id);

-- enable row level security on scores
alter table scores enable row level security;

-- rls policy: authenticated users can select their own scores
create policy "scores_select_own"
  on scores
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: authenticated users can insert their own scores
create policy "scores_insert_own"
  on scores
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can update their own scores
-- typically used to update with a better (faster) time
create policy "scores_update_own"
  on scores
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can delete their own scores
create policy "scores_delete_own"
  on scores
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- add comments for documentation
comment on table scores is 'Best completion times for users on each board';
comment on column scores.elapsed_ms is 'Completion time in milliseconds (must be positive)';
comment on column scores.played_at is 'When this best time was achieved';
comment on constraint scores_user_board_unique on scores is 'Ensures only one best score per user per board';

