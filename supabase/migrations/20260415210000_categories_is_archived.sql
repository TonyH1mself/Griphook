-- User-defined categories can be archived (hidden from entry pickers) without deleting rows.
-- System categories stay active; the app never sets is_archived on is_system rows.

ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;
