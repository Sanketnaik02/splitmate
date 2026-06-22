-- 011_restore_splitmate_id_generation.sql
-- Restore automatic SplitMate ID generation for new user signups.
--
-- Root cause:
--   The database function public.handle_new_user() and the trigger
--   on_auth_user_created on auth.users are BOTH missing.
--   (Confirmed by database inspection: function + trigger absent.)
--
--   Without the trigger, new auth.users INSERTs do not auto-create
--   a profiles row with a splitmate_id. Instead, profiles are created
--   by client-side code (AuthContext.jsx: ensureProfile / signUp insert)
--   which never includes splitmate_id in the payload.
--
--   The splitmate_id_seq and generate_splitmate_id() function DO exist
--   (created by migration 002), but are never called.
--
-- This migration:
--   - Creates public.handle_new_user() trigger function
--     (with schema-qualified public.generate_splitmate_id() call)
--   - Creates on_auth_user_created trigger on auth.users
--   - Backfills all existing profiles with NULL splitmate_id
--   - Does NOT modify any existing tables, policies, or business logic
--
-- Safe to run multiple times (idempotent via CREATE OR REPLACE,
-- DROP TRIGGER IF EXISTS, and WHERE splitmate_id IS NULL guard).

-- ============================================================
-- 1. Create handle_new_user() trigger function
--    Called automatically when a new row is inserted into auth.users.
--    Creates a matching profiles row with a generated SplitMate ID.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, phone, splitmate_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    '',
    public.generate_splitmate_id()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    splitmate_id = COALESCE(profiles.splitmate_id, EXCLUDED.splitmate_id);
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. Create trigger on auth.users
--    Fires AFTER INSERT to ensure the profile row exists
--    before any client-side code tries to read or upsert it.
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. Backfill all existing profiles with NULL splitmate_id
--    Uses the same generate_splitmate_id() function to ensure
--    consistent ID format (SM + 5 zero-padded digits).
-- ============================================================
UPDATE profiles
SET splitmate_id = public.generate_splitmate_id()
WHERE splitmate_id IS NULL;

-- ============================================================
-- 4. Verification queries
--    Copy-paste these into Supabase SQL Editor after applying.
-- ============================================================

-- 4a. Confirm no profiles remain with NULL splitmate_id
-- SELECT id, email, display_name, splitmate_id, created_at
-- FROM profiles
-- WHERE splitmate_id IS NULL
-- ORDER BY created_at DESC;
-- Expected: 0 rows

-- 4b. Confirm trigger exists and is enabled on auth.users
-- SELECT tgname, tgrelid::regclass, tgenabled
-- FROM pg_trigger
-- WHERE tgname = 'on_auth_user_created';
-- Expected: 1 row, tgrelid = 'auth.users', tgenabled = 'O'

-- 4c. Confirm function body contains the schema-qualified call
-- SELECT proname, prosrc
-- FROM pg_proc
-- WHERE proname = 'handle_new_user'
--   AND prosrc NOT LIKE '%public.generate_splitmate_id%';
-- Expected: 0 rows

-- 4d. Test ID generation increments the sequence
-- SELECT public.generate_splitmate_id();
-- Expected: SM followed by 5 zero-padded digits (e.g. SM00031)
-- Run twice to confirm the sequence increments.

-- 4e. Verify a specific user now has a splitmate_id
-- SELECT splitmate_id FROM profiles WHERE email = 'splitmate02@gmail.com';
-- Expected: Non-null value (e.g. SM00024)

-- ============================================================
-- 5. Rollback
--    WARNING: Rollback re-introduces the bug for future signups.
--    Existing profiles are NOT affected (splitmate_id column
--    values are already stored and persist).
-- ============================================================
-- Run the following in Supabase SQL Editor to revert:
--
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
--
-- Note: Only drop the trigger and function. Do NOT drop
-- generate_splitmate_id() or splitmate_id_seq — other code
-- depends on them.
