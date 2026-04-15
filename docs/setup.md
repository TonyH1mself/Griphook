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
2. Apply migrations in order:
   - [`supabase/migrations/20260415120000_init.sql`](../supabase/migrations/20260415120000_init.sql) — schema, RLS, initial `join_bucket_by_code`
   - [`supabase/migrations/20260415140000_hardening.sql`](../supabase/migrations/20260415140000_hardening.sql) — RLS/tightening, stable join RPC error codes (`GH_*`), indexes

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
3. Redeploy after changing env vars.

## PWA notes

- `manifest.ts` lists **192** and **512** logical sizes (both served from `/icon`, generated at 512×512), plus `/apple-icon`.
- Safe-area padding and mobile scroll margins help forms clear the bottom nav.
- **Service worker / offline caching are intentionally not enabled** yet; add something like `next-pwa` in a follow-up when requirements are clear.

## Known MVP limits

- No settlement engine or full “who owes whom” accounting — shared buckets use a simple fairness breakdown only.
- Recurring templates are stored and listed; automatic entry generation is not implemented.

## Troubleshooting

- **Build errors about missing Supabase env:** add `.env.local` or set variables in the hosting dashboard. Pages that talk to Supabase are marked `dynamic = "force-dynamic"` so they are not statically prerendered with secrets.
- **Join code errors:** ensure the SQL migration ran and `join_bucket_by_code` exists; check RLS isn’t blocking the RPC (function is `SECURITY DEFINER`).
