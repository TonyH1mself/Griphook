-- One result grid, one row — avoids confusion when the SQL editor shows multiple tabs/panels.
-- Run in the SAME Supabase project as NEXT_PUBLIC_SUPABASE_URL on Vercel.

SELECT
  EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) AS profiles_table_exists,
  (to_regclass('public.profiles') IS NOT NULL) AS postgres_knows_public_profiles,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'profiles'
    )
    THEN 'OK — public.profiles is present'
    ELSE 'MISSING — run docs/supabase-bootstrap-profiles.sql (then full init.sql if needed)'
  END AS read_this_status;
