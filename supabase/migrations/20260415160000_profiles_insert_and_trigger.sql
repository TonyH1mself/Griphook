-- GripHook: profiles insert policy (upsert/recovery) + idempotent auth trigger + backfill
-- Apply after 20260415140000_hardening.sql
--
-- Backfill (runs once when migration is applied): creates profile rows for existing auth.users
-- without a row. Safe to re-run manually in SQL Editor if needed:
--   INSERT INTO public.profiles (id, email, username, display_name)
--   SELECT u.id, u.email, NULL, NULL
--   FROM auth.users u
--   WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
--   ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, display_name)
  VALUES (NEW.id, NEW.email, NULL, NULL)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

COMMENT ON POLICY profiles_insert_own ON public.profiles IS
  'User may insert only their own profile row (id = auth.uid()); enables upsert recovery if the trigger row was missing.';

INSERT INTO public.profiles (id, email, username, display_name)
SELECT u.id, u.email, NULL, NULL
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
