-- =====================================================================
-- Migration: Create pairs Table
-- Description: Stores term/definition pairs that belong to game boards
-- Tables: pairs
-- Dependencies: boards
-- =====================================================================

-- create pairs table for term/definition pairs within boards
create table pairs (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards(id) on delete cascade,
  term text not null,
  definition text not null,
  created_at timestamptz not null default now()
);

-- unique constraint: prevent duplicate terms within the same board
alter table pairs 
  add constraint pairs_board_term_unique 
  unique (board_id, term);

-- index on board_id for fast retrieval of all pairs in a board
create index pairs_board_id_idx on pairs(board_id);

-- enable row level security on pairs
alter table pairs enable row level security;

-- rls policy: board owners can select pairs from their boards
-- also allow selecting pairs from public non-archived boards
create policy "pairs_select_owner_or_public"
  on pairs
  for select
  to authenticated
  using (
    exists (
      select 1 
      from boards b 
      where b.id = board_id 
        and (
          b.owner_id = auth.uid() 
          or (b.is_public = true and b.archived = false)
        )
    )
  );

-- rls policy: anonymous users can select pairs from public non-archived boards
create policy "pairs_select_public_anon"
  on pairs
  for select
  to anon
  using (
    exists (
      select 1 
      from boards b 
      where b.id = board_id 
        and b.is_public = true 
        and b.archived = false
    )
  );

-- rls policy: board owners can insert pairs into their boards
create policy "pairs_insert_owner"
  on pairs
  for insert
  to authenticated
  with check (
    exists (
      select 1 
      from boards b 
      where b.id = board_id 
        and b.owner_id = auth.uid()
    )
  );

-- rls policy: board owners can update pairs in their boards
create policy "pairs_update_owner"
  on pairs
  for update
  to authenticated
  using (
    exists (
      select 1 
      from boards b 
      where b.id = board_id 
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 
      from boards b 
      where b.id = board_id 
        and b.owner_id = auth.uid()
    )
  );

-- rls policy: board owners can delete pairs from their boards
create policy "pairs_delete_owner"
  on pairs
  for delete
  to authenticated
  using (
    exists (
      select 1 
      from boards b 
      where b.id = board_id 
        and b.owner_id = auth.uid()
    )
  );

-- add comments for documentation
comment on table pairs is 'Term and definition pairs that make up game board content';
comment on column pairs.term is 'The term/question side of the pair';
comment on column pairs.definition is 'The definition/answer side of the pair';

