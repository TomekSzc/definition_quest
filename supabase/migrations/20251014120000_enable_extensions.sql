-- =====================================================================
-- Migration: Enable Required Extensions
-- Description: Enables pgcrypto for gen_random_uuid() function
-- =====================================================================

-- enable pgcrypto extension for uuid generation
create extension if not exists pgcrypto;

