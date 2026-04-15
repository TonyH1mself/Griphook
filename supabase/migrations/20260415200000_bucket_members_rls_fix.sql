-- Fix infinite recursion on bucket_members RLS: policies must not subquery bucket_members
-- under the same RLS. Use SECURITY DEFINER helpers that read membership without RLS re-entry.
-- Apply after prior migrations (init, hardening, profiles, categories seed).

CREATE OR REPLACE FUNCTION public.is_bucket_member(p_bucket_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bucket_members bm
    WHERE bm.bucket_id = p_bucket_id
      AND bm.user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_bucket_admin(p_bucket_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bucket_members bm
    WHERE bm.bucket_id = p_bucket_id
      AND bm.user_id = (SELECT auth.uid())
      AND bm.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_bucket_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_bucket_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_bucket_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_bucket_admin(uuid) TO authenticated;

CREATE INDEX IF NOT EXISTS bucket_members_bucket_user_idx
ON public.bucket_members (bucket_id, user_id);

-- buckets
DROP POLICY IF EXISTS buckets_select ON public.buckets;
CREATE POLICY buckets_select ON public.buckets
FOR SELECT USING (
  (type = 'private' AND created_by_user_id = auth.uid())
  OR public.is_bucket_member(id)
);

DROP POLICY IF EXISTS buckets_update ON public.buckets;
CREATE POLICY buckets_update ON public.buckets
FOR UPDATE USING (
  (type = 'private' AND created_by_user_id = auth.uid())
  OR public.is_bucket_admin(id)
)
WITH CHECK (
  (type = 'private' AND created_by_user_id = auth.uid())
  OR public.is_bucket_admin(id)
);

DROP POLICY IF EXISTS buckets_delete ON public.buckets;
CREATE POLICY buckets_delete ON public.buckets
FOR DELETE USING (
  (type = 'private' AND created_by_user_id = auth.uid())
  OR public.is_bucket_admin(id)
);

-- bucket_members
DROP POLICY IF EXISTS bucket_members_select ON public.bucket_members;
CREATE POLICY bucket_members_select ON public.bucket_members
FOR SELECT USING (public.is_bucket_member(bucket_id));

DROP POLICY IF EXISTS bucket_members_insert ON public.bucket_members;
CREATE POLICY bucket_members_insert ON public.bucket_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.buckets b
    WHERE b.id = bucket_id
      AND b.created_by_user_id = auth.uid()
      AND b.type = 'shared'
  )
  OR public.is_bucket_admin(bucket_id)
);

DROP POLICY IF EXISTS bucket_members_update ON public.bucket_members;
CREATE POLICY bucket_members_update ON public.bucket_members
FOR UPDATE USING (public.is_bucket_admin(bucket_id))
WITH CHECK (public.is_bucket_admin(bucket_id));

DROP POLICY IF EXISTS bucket_members_delete ON public.bucket_members;
CREATE POLICY bucket_members_delete ON public.bucket_members
FOR DELETE USING (public.is_bucket_admin(bucket_id));

-- entries
DROP POLICY IF EXISTS entries_select ON public.entries;
CREATE POLICY entries_select ON public.entries
FOR SELECT USING (
  created_by_user_id = auth.uid()
  OR (bucket_id IS NOT NULL AND public.is_bucket_member(bucket_id))
);

DROP POLICY IF EXISTS entries_insert ON public.entries;
CREATE POLICY entries_insert ON public.entries
FOR INSERT WITH CHECK (
  created_by_user_id = auth.uid()
  AND (
    bucket_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.buckets b
      WHERE b.id = bucket_id
        AND (
          (b.type = 'private' AND b.created_by_user_id = auth.uid())
          OR public.is_bucket_member(b.id)
        )
    )
  )
);

-- recurring_entry_templates
DROP POLICY IF EXISTS recurring_select ON public.recurring_entry_templates;
CREATE POLICY recurring_select ON public.recurring_entry_templates
FOR SELECT USING (
  created_by_user_id = auth.uid()
  OR (bucket_id IS NOT NULL AND public.is_bucket_member(bucket_id))
);

DROP POLICY IF EXISTS recurring_insert ON public.recurring_entry_templates;
CREATE POLICY recurring_insert ON public.recurring_entry_templates
FOR INSERT WITH CHECK (
  created_by_user_id = auth.uid()
  AND (
    bucket_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.buckets b
      WHERE b.id = bucket_id
        AND (
          (b.type = 'private' AND b.created_by_user_id = auth.uid())
          OR public.is_bucket_member(b.id)
        )
    )
  )
);
