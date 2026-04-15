# GripHook setup

## Prerequisites

- Node.js 20+
- A Supabase project (free tier is fine)
- Optional: Supabase CLI for local Postgres (`supabase db push`, `supabase db reset`)

## 1. Environment variables

Copy `.env.example` to `.env.local` and fill in values from the Supabase dashboard (Settings → API):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` public key (RLS enforced) |
| `NEXT_PUBLIC_APP_URL` | Canonical site URL (e.g. `http://localhost:3000`, production domain on Vercel) |

GripHook uses the **anon** key on the server with the user’s session cookies (no service role in the app). Sensitive writes that must bypass RLS use Postgres `SECURITY DEFINER` functions (e.g. `join_bucket_by_code`).

## 2. Database

1. Open the Supabase SQL editor (or run migrations via CLI).
2. Apply [`supabase/migrations/20260415120000_init.sql`](../supabase/migrations/20260415120000_init.sql).

Optional demo data:

- Run [`supabase/seed.sql`](../supabase/seed.sql) after at least one user has signed up (two users unlock the shared-bucket portion).

## 3. Supabase Auth URLs

In Supabase → Authentication → URL configuration:

- **Site URL:** `http://localhost:3000` during development; production URL on Vercel.
- **Redirect URLs:** include `http://localhost:3000/**` and your production `https://your-domain.com/**`.

Email confirmation: for the fastest local loop, you can disable “Confirm email” in Auth settings while iterating.

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

- `manifest.ts`, icons (`/icon`, `/apple-icon`), `appleWebApp` metadata, and safe-area padding are in place.
- **Service worker / offline caching are intentionally not enabled** yet; add something like `next-pwa` in a follow-up when requirements are clear.

## Troubleshooting

- **Build errors about missing Supabase env:** add `.env.local` or set variables in the hosting dashboard. Pages that talk to Supabase are marked `dynamic = "force-dynamic"` so they are not statically prerendered with secrets.
- **Join code errors:** ensure the SQL migration ran and `join_bucket_by_code` exists; check RLS isn’t blocking the RPC (function is `SECURITY DEFINER`).
