# GripHook setup

## Prerequisites

- Node.js 20+
- A Supabase project (free tier is fine)
- Optional: Supabase CLI for local Postgres (`supabase db push`, `supabase db reset`)

## 1. Environment variables

Copy `.env.example` to `.env.local` and fill in values from the Supabase dashboard (Settings → API):

| Variable                        | Purpose                                                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project URL                                                                                                                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` public key (RLS enforced)                                                                                                       |
| `NEXT_PUBLIC_APP_URL`           | Canonical site URL (e.g. `http://localhost:3000`, production domain on Vercel). Used for absolute auth redirect URLs (`getSiteUrl()`). |

GripHook uses the **anon** key on the server with the user’s session cookies (no service role in the app). Sensitive writes that must bypass RLS use Postgres `SECURITY DEFINER` functions (e.g. `join_bucket_by_code`).

## 2. Database

1. Open the Supabase SQL editor (or run migrations via CLI).
2. **Paste only the contents of the `.sql` migration files** from this repo (full script text). Do **not** paste your project URL (`https://….supabase.co`), API keys, or `.env` lines into the SQL editor — those are not valid SQL and will error (e.g. `syntax error at or near "https"`).
3. Apply full migrations in order:
   - [`supabase/migrations/20260415120000_init.sql`](../supabase/migrations/20260415120000_init.sql) — schema, RLS, initial `join_bucket_by_code`
   - [`supabase/migrations/20260415140000_hardening.sql`](../supabase/migrations/20260415140000_hardening.sql) — RLS/tightening, stable join RPC error codes (`GH_*`), indexes
   - [`supabase/migrations/20260415160000_profiles_insert_and_trigger.sql`](../supabase/migrations/20260415160000_profiles_insert_and_trigger.sql) — idempotent `handle_new_user`, `profiles_insert_own` (for onboarding upsert), one-time profile backfill from `auth.users`
   - [`supabase/migrations/20260415180000_seed_system_categories.sql`](../supabase/migrations/20260415180000_seed_system_categories.sql) — **required** system categories (Groceries, Rent, etc.); without this, category pickers in the app are empty
   - [`supabase/migrations/20260415200000_bucket_members_rls_fix.sql`](../supabase/migrations/20260415200000_bucket_members_rls_fix.sql) — **required** fix for `infinite recursion detected in policy for relation bucket_members` (SECURITY DEFINER helpers + non-recursive policies). Apply in every project that ran the original `init.sql` policies.
   - [`supabase/migrations/20260415210000_categories_is_archived.sql`](../supabase/migrations/20260415210000_categories_is_archived.sql) — **required** for the in-app Categories page and archived-category pickers; without it, queries referencing `is_archived` will error until applied

**Indexes / RLS:** Dashboard and list views use `entries(created_by_user_id, occurred_at)` and `entries(bucket_id, occurred_at)` (see `init` + `hardening` migrations). `bucket_members` access uses `is_bucket_member` / `is_bucket_admin` helpers after `20260415200000_bucket_members_rls_fix.sql`.
4. **If `public.profiles` is still missing** (e.g. `init.sql` stopped before the `profiles` block or the run errored partway), execute [`docs/supabase-bootstrap-profiles.sql`](supabase-bootstrap-profiles.sql) once, then verify with [`docs/supabase-verify.sql`](supabase-verify.sql). That script only fixes `profiles`; you still need a successful full `init.sql` for categories, buckets, entries, and RPCs, or other parts of the app will break.

**Profiles backfill (recovery):** If some `auth.users` rows have no `public.profiles` row (e.g. trigger was missing), run the idempotent insert from [`20260415160000_profiles_insert_and_trigger.sql`](../supabase/migrations/20260415160000_profiles_insert_and_trigger.sql) (the `INSERT … SELECT … FROM auth.users … ON CONFLICT DO NOTHING` block) in the SQL editor, or apply that migration if you have not yet. Duplicates are prevented by the primary key on `profiles.id`.

Optional demo data:

- Run [`supabase/seed.sql`](../supabase/seed.sql) after at least one user has signed up (two users unlock the shared-bucket portion).

## 3. Supabase Auth URLs

In Supabase → Authentication → URL configuration:

- **Site URL:** `http://localhost:3000` during development; production URL on Vercel (must match `NEXT_PUBLIC_APP_URL` in production).
- **Redirect URLs:** include:
  - `http://localhost:3000/**` and your production `https://your-domain.com/**`
  - **Email / PKCE callback:** `http://localhost:3000/auth/callback` and `https://your-domain.com/auth/callback`

The app route [`/auth/callback`](../src/app/auth/callback/route.ts) exchanges the auth `code` (or verifies `token_hash` from the email link) and sets the session cookie.

**Email confirmation:** if “Confirm email” is on, new users may have **no session** until they click the link — the signup screen explains that case. For the fastest local loop, you can disable email confirmation while iterating.

## 4. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## 5. Deploy on Vercel

1. Create a Vercel project from this repo.
2. Set the same environment variables as in `.env.example` (production `NEXT_PUBLIC_APP_URL`).
3. **Run the SQL migrations in the Supabase project that matches your Vercel env** (`NEXT_PUBLIC_SUPABASE_URL` / anon key). The app only hosts the UI; tables like `public.profiles` exist only after you execute `supabase/migrations/*.sql` in the Supabase SQL editor (or via CLI against that project). If migrations are missing, onboarding can fail with errors mentioning `profiles` or “schema cache”.
4. Redeploy after changing env vars.

## PWA notes

- `manifest.ts` lists **192** and **512** logical sizes (both served from `/icon`, generated at 512×512), plus `/apple-icon`.
- Safe-area padding and mobile scroll margins help forms clear the bottom nav.
- **Service worker / offline caching are intentionally not enabled** yet; add something like `next-pwa` in a follow-up when requirements are clear.

## Known MVP limits

- No settlement engine or full “who owes whom” accounting — shared buckets use a simple fairness breakdown only.
- Recurring templates are stored and listed; automatic entry generation is not implemented.

## Troubleshooting

- **Build errors about missing Supabase env:** add `.env.local` or set variables in the hosting dashboard. Pages that talk to Supabase are marked `dynamic = "force-dynamic"` so they are not statically prerendered with secrets.
- **`profiles` / “schema cache” on onboarding (Vercel):** PostgREST does not see `public.profiles` for the Supabase project behind your **production** `NEXT_PUBLIC_SUPABASE_URL`. Common causes: migrations were run in a **different** Supabase project than the one in Vercel env vars, or `init.sql` **did not complete** (check SQL Editor **History** for errors). Verify: open **Settings → API** and confirm the **Project URL** matches Vercel exactly; then run the checks in [`docs/supabase-verify.sql`](supabase-verify.sql). If `profiles` is missing, run `20260415120000_init.sql` then `20260415140000_hardening.sql` again in that same project (see §2).

**Auth / profiles maintenance:** Apply [`20260415160000_profiles_insert_and_trigger.sql`](../supabase/migrations/20260415160000_profiles_insert_and_trigger.sql) in every Supabase project that already ran the older two migrations — it adds `profiles_insert_own` (required for onboarding **upsert**), makes `handle_new_user` idempotent, and backfills missing profile rows. Without it, users without a profile row may still hit onboarding errors until the SQL is applied.
- **Join code errors:** ensure the SQL migration ran and `join_bucket_by_code` exists; check RLS isn’t blocking the RPC (function is `SECURITY DEFINER`).
- **`infinite recursion` on `bucket_members`:** apply [`20260415200000_bucket_members_rls_fix.sql`](../supabase/migrations/20260415200000_bucket_members_rls_fix.sql) in this Supabase project (see §2).
- **`column … is_archived does not exist` (categories):** apply [`20260415210000_categories_is_archived.sql`](../supabase/migrations/20260415210000_categories_is_archived.sql).
