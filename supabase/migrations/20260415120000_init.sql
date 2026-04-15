-- GripHook initial schema, RLS, and join RPC
-- Requires Supabase (Postgres + auth)

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helper: updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_len CHECK (username IS NULL OR char_length(username) >= 2)
);

CREATE INDEX profiles_username_idx ON public.profiles (username) WHERE username IS NOT NULL;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, display_name)
  VALUES (NEW.id, NEW.email, NULL, NULL);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  created_by_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_slug_unique UNIQUE (slug)
);

CREATE INDEX categories_created_by_idx ON public.categories (created_by_user_id);

CREATE TRIGGER categories_set_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- buckets
-- ---------------------------------------------------------------------------
CREATE TABLE public.buckets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('private', 'shared')),
  created_by_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  has_budget boolean NOT NULL DEFAULT false,
  budget_amount numeric(12, 2),
  budget_period text NOT NULL DEFAULT 'none' CHECK (budget_period IN ('none', 'monthly')),
  join_code text,
  color text,
  icon text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT buckets_join_code_format CHECK (
    join_code IS NULL OR (join_code ~ '^[0-9]{6}$')
  ),
  CONSTRAINT buckets_shared_join_code CHECK (
    (type = 'shared' AND join_code IS NOT NULL) OR (type = 'private' AND join_code IS NULL)
  ),
  CONSTRAINT buckets_budget_amount CHECK (
    (has_budget = false AND budget_amount IS NULL) OR (has_budget = true)
  )
);

CREATE INDEX buckets_created_by_idx ON public.buckets (created_by_user_id);
CREATE INDEX buckets_type_idx ON public.buckets (type);

CREATE UNIQUE INDEX buckets_join_code_unique
ON public.buckets (join_code)
WHERE join_code IS NOT NULL AND type = 'shared';

CREATE TRIGGER buckets_set_updated_at
BEFORE UPDATE ON public.buckets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- bucket_members
-- ---------------------------------------------------------------------------
CREATE TABLE public.bucket_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id uuid NOT NULL REFERENCES public.buckets (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  share_percent numeric(5, 2) NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bucket_members_unique_member UNIQUE (bucket_id, user_id),
  CONSTRAINT bucket_members_share_range CHECK (share_percent >= 0 AND share_percent <= 100)
);

CREATE INDEX bucket_members_user_idx ON public.bucket_members (user_id);
CREATE INDEX bucket_members_bucket_idx ON public.bucket_members (bucket_id);

CREATE TRIGGER bucket_members_set_updated_at
BEFORE UPDATE ON public.bucket_members
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- entries
-- ---------------------------------------------------------------------------
CREATE TABLE public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount numeric(12, 2) NOT NULL CHECK (amount >= 0),
  title text NOT NULL,
  notes text,
  occurred_at timestamptz NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  bucket_id uuid REFERENCES public.buckets (id) ON DELETE SET NULL,
  currency text NOT NULL DEFAULT 'EUR',
  attachment_url text,
  is_recurring_generated boolean NOT NULL DEFAULT false,
  recurring_template_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX entries_user_occurred_idx ON public.entries (created_by_user_id, occurred_at DESC);
CREATE INDEX entries_bucket_occurred_idx ON public.entries (bucket_id, occurred_at DESC);

CREATE TRIGGER entries_set_updated_at
BEFORE UPDATE ON public.entries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- recurring_entry_templates
-- ---------------------------------------------------------------------------
CREATE TABLE public.recurring_entry_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  bucket_id uuid REFERENCES public.buckets (id) ON DELETE SET NULL,
  category_id uuid NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  transaction_type text NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount numeric(12, 2) NOT NULL CHECK (amount >= 0),
  title text NOT NULL,
  notes text,
  frequency text NOT NULL DEFAULT 'monthly',
  next_due_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX recurring_templates_user_idx ON public.recurring_entry_templates (created_by_user_id);

CREATE TRIGGER recurring_entry_templates_set_updated_at
BEFORE UPDATE ON public.recurring_entry_templates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.entries
  ADD CONSTRAINT entries_recurring_template_fk
  FOREIGN KEY (recurring_template_id) REFERENCES public.recurring_entry_templates (id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- RPC: join shared bucket by 6-digit code (SECURITY DEFINER)
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
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  v_code := trim(p_code);
  IF v_code !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'invalid_code' USING ERRCODE = 'P0001';
  END IF;

  SELECT id INTO v_bucket_id
  FROM public.buckets
  WHERE type = 'shared'
    AND join_code = v_code
    AND is_archived = false
  LIMIT 1;

  IF v_bucket_id IS NULL THEN
    RAISE EXCEPTION 'invalid_code' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.bucket_members bm
    WHERE bm.bucket_id = v_bucket_id AND bm.user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'already_member' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.bucket_members (bucket_id, user_id, role, share_percent)
  VALUES (v_bucket_id, v_uid, 'member', 0);

  RETURN v_bucket_id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_bucket_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_bucket_by_code(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_entry_templates ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY profiles_update_own ON public.profiles
FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- categories
CREATE POLICY categories_select ON public.categories
FOR SELECT USING (is_system OR created_by_user_id = auth.uid());

CREATE POLICY categories_insert_own ON public.categories
FOR INSERT WITH CHECK (
  NOT is_system AND created_by_user_id = auth.uid()
);

CREATE POLICY categories_update_own ON public.categories
FOR UPDATE USING (NOT is_system AND created_by_user_id = auth.uid())
WITH CHECK (NOT is_system AND created_by_user_id = auth.uid());

CREATE POLICY categories_delete_own ON public.categories
FOR DELETE USING (NOT is_system AND created_by_user_id = auth.uid());

-- buckets
CREATE POLICY buckets_select ON public.buckets
FOR SELECT USING (
  (type = 'private' AND created_by_user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.bucket_members bm
    WHERE bm.bucket_id = buckets.id AND bm.user_id = auth.uid()
  )
);

CREATE POLICY buckets_insert ON public.buckets
FOR INSERT WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY buckets_update ON public.buckets
FOR UPDATE USING (
  (type = 'private' AND created_by_user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.bucket_members bm
    WHERE bm.bucket_id = buckets.id AND bm.user_id = auth.uid() AND bm.role = 'admin'
  )
)
WITH CHECK (
  (type = 'private' AND created_by_user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.bucket_members bm
    WHERE bm.bucket_id = buckets.id AND bm.user_id = auth.uid() AND bm.role = 'admin'
  )
);

CREATE POLICY buckets_delete ON public.buckets
FOR DELETE USING (
  (type = 'private' AND created_by_user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.bucket_members bm
    WHERE bm.bucket_id = buckets.id AND bm.user_id = auth.uid() AND bm.role = 'admin'
  )
);

-- bucket_members
CREATE POLICY bucket_members_select ON public.bucket_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bucket_members bm
    WHERE bm.bucket_id = bucket_members.bucket_id AND bm.user_id = auth.uid()
  )
);

CREATE POLICY bucket_members_insert ON public.bucket_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.buckets b
    WHERE b.id = bucket_id
      AND b.created_by_user_id = auth.uid()
      AND b.type = 'shared'
  )
  OR EXISTS (
    SELECT 1 FROM public.bucket_members bm
    WHERE bm.bucket_id = bucket_members.bucket_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'admin'
  )
);

CREATE POLICY bucket_members_update ON public.bucket_members
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.bucket_members bm
    WHERE bm.bucket_id = bucket_members.bucket_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bucket_members bm
    WHERE bm.bucket_id = bucket_members.bucket_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'admin'
  )
);

CREATE POLICY bucket_members_delete ON public.bucket_members
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.bucket_members bm
    WHERE bm.bucket_id = bucket_members.bucket_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'admin'
  )
);

-- entries
CREATE POLICY entries_select ON public.entries
FOR SELECT USING (
  created_by_user_id = auth.uid()
  OR (
    bucket_id IS NOT NULL    AND EXISTS (
      SELECT 1 FROM public.bucket_members bm
      WHERE bm.bucket_id = entries.bucket_id AND bm.user_id = auth.uid()
    )
  )
);

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
          OR EXISTS (
            SELECT 1 FROM public.bucket_members bm
            WHERE bm.bucket_id = b.id AND bm.user_id = auth.uid()
          )
        )
    )
  )
);

CREATE POLICY entries_update_own ON public.entries
FOR UPDATE USING (created_by_user_id = auth.uid())
WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY entries_delete_own ON public.entries
FOR DELETE USING (created_by_user_id = auth.uid());

-- recurring_entry_templates
CREATE POLICY recurring_select ON public.recurring_entry_templates
FOR SELECT USING (
  created_by_user_id = auth.uid()
  OR (
    bucket_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.bucket_members bm
      WHERE bm.bucket_id = recurring_entry_templates.bucket_id AND bm.user_id = auth.uid()
    )
  )
);

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
          OR EXISTS (
            SELECT 1 FROM public.bucket_members bm
            WHERE bm.bucket_id = b.id AND bm.user_id = auth.uid()
          )
        )
    )
  )
);

CREATE POLICY recurring_update_own ON public.recurring_entry_templates
FOR UPDATE USING (created_by_user_id = auth.uid())
WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY recurring_delete_own ON public.recurring_entry_templates
FOR DELETE USING (created_by_user_id = auth.uid());
