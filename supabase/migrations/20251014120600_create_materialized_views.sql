-- =====================================================================
-- Migration: Create Materialized Views
-- Description: Creates materialized views for performance optimization
--              - daily_ai_usage: aggregates daily AI request counts per user
--              - best_scores: pre-aggregates best times per user per board
-- Tables: N/A (views only)
-- Dependencies: ai_requests, scores
-- =====================================================================

-- materialized view: daily_ai_usage
-- aggregates ai requests by user and day for rate limiting (50 per day)
-- should be refreshed nightly via supabase cron or scheduled function
create materialized view daily_ai_usage as
select 
  user_id,
  date_trunc('day', requested_at) as request_date,
  count(*) as cnt
from ai_requests
group by user_id, date_trunc('day', requested_at);

-- index on user_id and request_date for fast rate limit checks
create index daily_ai_usage_user_date_idx 
  on daily_ai_usage(user_id, request_date);

-- materialized view: best_scores
-- pre-aggregates the best (minimum) time per user per board
-- refreshes on commit for real-time leaderboard updates
create materialized view best_scores as
select 
  user_id,
  board_id,
  min(elapsed_ms) as best_time
from scores
group by user_id, board_id;

-- composite index for efficient lookups by board (for leaderboards)
create index best_scores_board_best_time_idx 
  on best_scores(board_id, best_time);

-- index on user_id for user performance queries
create index best_scores_user_idx 
  on best_scores(user_id);

-- add comments for documentation
comment on materialized view daily_ai_usage is 
  'Aggregates daily AI request counts per user for rate limiting (refresh nightly)';
comment on materialized view best_scores is 
  'Pre-aggregates best completion times per user per board for leaderboards';

