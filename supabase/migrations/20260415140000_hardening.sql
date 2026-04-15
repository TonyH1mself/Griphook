-- GripHook: RLS documentation, indexes, immutable bucket identity, stable join RPC errors
-- Apply after 20260415120000_init.sql

-- ---------------------------------------------------------------------------
-- Indexes for common filters (policies and dashboards use these paths)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS entries_category_id_idx ON public.entries (category_id);

CREATE INDEX IF NOT EXISTS entries_bucket_month_idx
ON public.entries (bucket_id, occurred_at DESC)
WHERE bucket_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Prevent changing bucket type or owner (RLS alone cannot express column-level)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.buckets_prevent_identity_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.type IS DISTINCT FROM OLD.type THEN
    RAISE EXCEPTION 'GH_BUCKET_TYPE_IMMUTABLE' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.created_by_user_id IS DISTINCT FROM OLD.created_by_user_id THEN
    RAISE EXCEPTION 'GH_BUCKET_OWNER_IMMUTABLE' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS buckets_prevent_identity_change ON public.buckets;
CREATE TRIGGER buckets_prevent_identity_change
BEFORE UPDATE ON public.buckets
FOR EACH ROW EXECUTE FUNCTION public.buckets_prevent_identity_change();

-- ---------------------------------------------------------------------------
-- join_bucket_by_code: stable GH_* messages for the app (ERRCODE P0001)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_bucket_by_code(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bucket_id uuid;
  v_uid uuid;
  v_code text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'GH_NOT_AUTHENTICATED' USING ERRCODE = 'P0001';
  END IF;

  v_code := trim(p_code);
  IF v_code !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'GH_INVALID_CODE' USING ERRCODE = 'P0001';
  END IF;

  SELECT id INTO v_bucket_id
  FROM public.buckets
  WHERE type = 'shared'
    AND join_code = v_code
    AND is_archived = false
  LIMIT 1;

  IF v_bucket_id IS NULL THEN
    RAISE EXCEPTION 'GH_INVALID_CODE' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.bucket_members bm
    WHERE bm.bucket_id = v_bucket_id AND bm.user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'GH_ALREADY_MEMBER' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.bucket_members (bucket_id, user_id, role, share_percent)
  VALUES (v_bucket_id, v_uid, 'member', 0);

  RETURN v_bucket_id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_bucket_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_bucket_by_code(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Policy documentation (Postgres 15+)
-- ---------------------------------------------------------------------------
COMMENT ON POLICY profiles_select_own ON public.profiles IS
  'User can read only their profile row (id = auth.uid()).';

COMMENT ON POLICY profiles_update_own ON public.profiles IS
  'User can update only their profile row.';

COMMENT ON POLICY categories_select ON public.categories IS
  'System categories for everyone; user categories only for creator.';

COMMENT ON POLICY buckets_select ON public.buckets IS
  'Private bucket: creator only. Shared: any member via bucket_members.';

COMMENT ON POLICY bucket_members_select ON public.bucket_members IS
  'Visible to all members of the same bucket.';

COMMENT ON POLICY entries_select ON public.entries IS
  'Creator sees own rows; bucket-linked rows visible to members of that bucket.';

COMMENT ON POLICY entries_insert ON public.entries IS
  'Insert only as self; bucket_id must be a bucket the user can use.';

COMMENT ON POLICY entries_update_own ON public.entries IS
  'Only the creator may update or delete an entry (MVP).';

COMMENT ON POLICY recurring_select ON public.recurring_entry_templates IS
  'Same visibility model as entries: owner or member of linked shared bucket.';
