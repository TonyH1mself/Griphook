-- System categories required for entry/recurring forms (same UUIDs as supabase/seed.sql)
-- Idempotent; safe to re-run.

INSERT INTO public.categories (id, name, slug, created_by_user_id, is_system)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Groceries', 'system-groceries', NULL, true),
  ('11111111-1111-1111-1111-111111111102', 'Rent', 'system-rent', NULL, true),
  ('11111111-1111-1111-1111-111111111103', 'Salary', 'system-salary', NULL, true),
  ('11111111-1111-1111-1111-111111111104', 'Dining out', 'system-dining', NULL, true),
  ('11111111-1111-1111-1111-111111111105', 'Transport', 'system-transport', NULL, true)
ON CONFLICT (id) DO NOTHING;
