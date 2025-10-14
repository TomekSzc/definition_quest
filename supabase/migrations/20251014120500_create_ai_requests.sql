-- =====================================================================
-- Migration: Create ai_requests Table
-- Description: Tracks AI API usage for monitoring costs and implementing rate limits
-- Tables: ai_requests
-- Dependencies: auth.users
-- =====================================================================

-- create ai_requests table for tracking ai usage and costs
create table ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now(),
  model text not null,
  prompt_tokens integer not null,
  cost_usd numeric(10, 4) not null,
  status text not null
);

-- composite index on user_id and requested_at for time-based queries
-- supports daily usage queries and rate limiting checks
create index ai_requests_user_requested_idx 
  on ai_requests(user_id, requested_at);

-- enable row level security on ai_requests
alter table ai_requests enable row level security;

-- rls policy: authenticated users can select their own ai requests
create policy "ai_requests_select_own"
  on ai_requests
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: authenticated users can insert their own ai requests
create policy "ai_requests_insert_own"
  on ai_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can update their own ai requests
create policy "ai_requests_update_own"
  on ai_requests
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can delete their own ai requests
create policy "ai_requests_delete_own"
  on ai_requests
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- add comments for documentation
comment on table ai_requests is 'Tracks AI API usage for cost monitoring and rate limiting';
comment on column ai_requests.model is 'AI model identifier used for the request';
comment on column ai_requests.prompt_tokens is 'Number of tokens in the request prompt';
comment on column ai_requests.cost_usd is 'Calculated cost in USD (up to 4 decimal places)';
comment on column ai_requests.status is 'Request outcome: ok, error, etc.';

