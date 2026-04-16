-- Switch system categories to the German MVP defaults:
--   Haushalt, Hygieneartikel, Miete, Abos, Transport, Lebensmittel, Gehalt
--
-- Strategy: keep the five existing UUIDs stable so already-written entries
-- and recurring templates continue to resolve (categories.id is referenced
-- with ON DELETE RESTRICT). We only rename them and add the two missing
-- ones. Mapping:
--   …01 Groceries   -> Lebensmittel
--   …02 Rent        -> Miete
--   …03 Salary      -> Gehalt
--   …04 Dining out  -> Abos          (repurposed; best-effort for MVP)
--   …05 Transport   -> Transport     (unchanged)
--   new …06         -> Haushalt
--   new …07         -> Hygieneartikel
-- Idempotent; safe to re-run.

UPDATE public.categories
SET name = 'Lebensmittel', slug = 'system-lebensmittel'
WHERE id = '11111111-1111-1111-1111-111111111101';

UPDATE public.categories
SET name = 'Miete', slug = 'system-miete'
WHERE id = '11111111-1111-1111-1111-111111111102';

UPDATE public.categories
SET name = 'Gehalt', slug = 'system-gehalt'
WHERE id = '11111111-1111-1111-1111-111111111103';

UPDATE public.categories
SET name = 'Abos', slug = 'system-abos'
WHERE id = '11111111-1111-1111-1111-111111111104';

UPDATE public.categories
SET name = 'Transport', slug = 'system-transport'
WHERE id = '11111111-1111-1111-1111-111111111105';

INSERT INTO public.categories (id, name, slug, created_by_user_id, is_system)
VALUES
  ('11111111-1111-1111-1111-111111111106', 'Haushalt', 'system-haushalt', NULL, true),
  ('11111111-1111-1111-1111-111111111107', 'Hygieneartikel', 'system-hygieneartikel', NULL, true)
ON CONFLICT (id) DO NOTHING;
