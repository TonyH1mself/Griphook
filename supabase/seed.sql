-- GripHook demo seed (run after migrations, e.g. `supabase db reset` picks this up if configured)
-- Requires at least one auth user for user-scoped rows; use two sign-ups for the shared-bucket demo.
-- System categories are created by migration `20260415180000_seed_system_categories.sql`
-- and renamed to the German MVP defaults by `20260416130000_system_categories_de_defaults.sql`.

-- System categories (idempotent; redundant if the migrations above already ran)
INSERT INTO public.categories (id, name, slug, created_by_user_id, is_system)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Lebensmittel',   'system-lebensmittel',   NULL, true),
  ('11111111-1111-1111-1111-111111111102', 'Miete',          'system-miete',          NULL, true),
  ('11111111-1111-1111-1111-111111111103', 'Gehalt',         'system-gehalt',         NULL, true),
  ('11111111-1111-1111-1111-111111111104', 'Abos',           'system-abos',           NULL, true),
  ('11111111-1111-1111-1111-111111111105', 'Transport',      'system-transport',      NULL, true),
  ('11111111-1111-1111-1111-111111111106', 'Haushalt',       'system-haushalt',       NULL, true),
  ('11111111-1111-1111-1111-111111111107', 'Hygieneartikel', 'system-hygieneartikel', NULL, true)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      slug = EXCLUDED.slug;

DO $$
DECLARE
  u1 uuid;
  u2 uuid;
  private_bucket uuid;
  shared_bucket uuid;
BEGIN
  SELECT id INTO u1 FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF u1 IS NULL THEN
    RAISE NOTICE 'Seed skip: no auth.users yet. Sign up once, then re-run seed.';
    RETURN;
  END IF;

  SELECT id INTO u2 FROM auth.users ORDER BY created_at ASC LIMIT 1 OFFSET 1;

  -- Private bucket + entries for first user
  INSERT INTO public.buckets (name, description, type, created_by_user_id, has_budget, budget_amount, budget_period)
  VALUES ('Everyday', 'General private spending', 'private', u1, true, 450.00, 'monthly')
  RETURNING id INTO private_bucket;

  INSERT INTO public.entries (
    transaction_type, amount, title, occurred_at, created_by_user_id, category_id, bucket_id
  ) VALUES
    ('expense', 52.30, 'Wocheneinkauf',   date_trunc('month', now()) + interval '3 days', u1, '11111111-1111-1111-1111-111111111101', private_bucket),
    ('expense', 12.99, 'Streaming-Abo',   date_trunc('month', now()) + interval '5 days', u1, '11111111-1111-1111-1111-111111111104', private_bucket),
    ('income', 2800.00, 'Gehalt',         date_trunc('month', now()) + interval '1 day', u1, '11111111-1111-1111-1111-111111111103', NULL);

  INSERT INTO public.recurring_entry_templates (
    created_by_user_id, bucket_id, category_id, transaction_type, amount, title, frequency, next_due_at
  ) VALUES (
    u1,
    private_bucket,
    '11111111-1111-1111-1111-111111111102',
    'expense',
    950.00,
    'Rent',
    'monthly',
    (date_trunc('month', now()) + interval '1 month' + interval '3 days')
  );

  IF u2 IS NULL THEN
    RAISE NOTICE 'Seed: single-user demo inserted. Add a second auth user and re-run for shared bucket demo.';
    RETURN;
  END IF;

  INSERT INTO public.buckets (name, description, type, created_by_user_id, has_budget, join_code)
  VALUES ('Household', 'Shared home costs', 'shared', u1, false, '424242')
  RETURNING id INTO shared_bucket;

  INSERT INTO public.bucket_members (bucket_id, user_id, role, share_percent)
  VALUES
    (shared_bucket, u1, 'admin', 60),
    (shared_bucket, u2, 'member', 40);

  INSERT INTO public.entries (
    transaction_type, amount, title, occurred_at, created_by_user_id, category_id, bucket_id
  ) VALUES
    ('expense', 120.00, 'Nebenkosten',   now() - interval '2 days', u1, '11111111-1111-1111-1111-111111111106', shared_bucket),
    ('expense',  80.00, 'Wocheneinkauf', now() - interval '1 day',  u2, '11111111-1111-1111-1111-111111111101', shared_bucket);

END $$;
