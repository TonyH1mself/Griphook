-- Creator must always be able to SELECT their own bucket, even before the
-- bucket_members admin row is written. This unblocks the shared-bucket create
-- flow: the server action inserts the bucket row, needs .select("id") back,
-- and only then writes the admin bucket_members row.
--
-- Before this patch the policy allowed SELECT only for:
--   (type = 'private' AND created_by_user_id = auth.uid())
--   OR is_bucket_member(id)
-- Shared creators therefore could not see their own freshly-inserted row
-- during the same transaction, so .select(...).single() returned null and
-- the action failed with a misleading "Could not create bucket." error.

DROP POLICY IF EXISTS buckets_select ON public.buckets;
CREATE POLICY buckets_select ON public.buckets
FOR SELECT USING (
  created_by_user_id = auth.uid()
  OR public.is_bucket_member(id)
);

COMMENT ON POLICY buckets_select ON public.buckets IS
  'Creator always sees own buckets (private or shared, incl. freshly inserted rows). '
  'Members see shared buckets they belong to via is_bucket_member().';
