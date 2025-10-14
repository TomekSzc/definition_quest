-- =====================================================================
-- Migration: Create boards Table
-- Description: Stores game boards with terms/definitions, including metadata
--              for multi-level boards, tagging, and full-text search
-- Tables: boards
-- Dependencies: auth.users
-- =====================================================================

-- create boards table for managing game boards
create table boards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  card_count smallint not null check (card_count in (16, 24)),
  level smallint not null check (level >= 1),
  is_public boolean not null default false,
  archived boolean not null default false,
  tags text[] not null default '{}'::text[] 
    check (cardinality(tags) <= 10),
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- unique constraint: prevent duplicate titles per level for one user
alter table boards 
  add constraint boards_owner_title_level_unique 
  unique (owner_id, title, level);

-- index on owner_id for fast user board lookups
create index boards_owner_id_idx on boards(owner_id);

-- composite index for filtering public/archived boards by owner
-- speeds up queries that list boards with filters
create index boards_public_archived_owner_idx 
  on boards(is_public, archived, owner_id);

-- gin index for full-text search on board titles
create index boards_search_vector_idx on boards using gin(search_vector);

-- gin index for array operations on tags
create index boards_tags_idx on boards using gin(tags);

-- trigger function to validate tag lengths (max 20 chars each)
create or replace function validate_board_tags()
returns trigger as $$
begin
  if exists (select 1 from unnest(new.tags) t where length(t) > 20) then
    raise exception 'Each tag must be at most 20 characters long';
  end if;
  return new;
end;
$$ language plpgsql;

-- trigger to validate tags before insert or update
create trigger boards_validate_tags
  before insert or update on boards
  for each row
  execute function validate_board_tags();

-- enable row level security on boards
alter table boards enable row level security;

-- rls policy: board owners can select their own boards
create policy "boards_select_owner"
  on boards
  for select
  to authenticated
  using (auth.uid() = owner_id);

-- rls policy: anyone (including anon) can select public non-archived boards
create policy "boards_select_public"
  on boards
  for select
  to anon, authenticated
  using (is_public = true and archived = false);

-- rls policy: board owners can insert new boards
create policy "boards_insert_owner"
  on boards
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

-- rls policy: board owners can update their own boards
create policy "boards_update_owner"
  on boards
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- rls policy: board owners can delete their own boards
create policy "boards_delete_owner"
  on boards
  for delete
  to authenticated
  using (auth.uid() = owner_id);

-- add comments for documentation
comment on table boards is 'Game boards containing term/definition pairs for memory matching game';
comment on column boards.card_count is 'Number of cards in the game (16 or 24 only)';
comment on column boards.level is 'Sequence number for multi-page boards (starts at 1)';
comment on column boards.is_public is 'Whether board is visible to all users';
comment on column boards.archived is 'Whether board is archived (hidden from public listings)';
comment on column boards.tags is 'Array of tags for categorization (max 10 tags via CHECK, max 20 chars each via trigger)';
comment on column boards.search_vector is 'Generated tsvector for full-text search on title';

