-- =====================================================================
-- Migration: Create user_meta Table
-- Description: Stores additional user profile information (display name, avatar)
-- Tables: user_meta
-- Dependencies: auth.users (managed by Supabase)
-- =====================================================================

-- create user_meta table for extended user profile data
-- mirrors auth.users with 1-to-1 relationship via identical primary keys
create table user_meta (
  id uuid primary key references auth.users(id) on delete cascade not null,
  display_name text not null check (length(display_name) <= 40),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- enable row level security on user_meta
alter table user_meta enable row level security;

-- rls policy: allow authenticated users to select their own profile
create policy "user_meta_select_own"
  on user_meta
  for select
  to authenticated
  using (auth.uid() = id);

-- rls policy: allow authenticated users to insert their own profile
create policy "user_meta_insert_own"
  on user_meta
  for insert
  to authenticated
  with check (auth.uid() = id);

-- rls policy: allow authenticated users to update their own profile
create policy "user_meta_update_own"
  on user_meta
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- rls policy: allow authenticated users to delete their own profile
create policy "user_meta_delete_own"
  on user_meta
  for delete
  to authenticated
  using (auth.uid() = id);

-- add comment to table
comment on table user_meta is 'Extended user profile information with display name and avatar';
comment on column user_meta.display_name is 'Public nickname, max 40 characters';
comment on column user_meta.avatar_url is 'Optional URL to user avatar image';

