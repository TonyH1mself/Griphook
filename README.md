# GripHook

GripHook is a **mobile-first PWA** for personal finance tracking: bucket-centric organization, optional **shared buckets** with lightweight fairness math, and a calm dashboard — not a full accounting suite.

Product rules and schema are documented in `.cursor/product.md`, `.cursor/app-logic.md`, and `.cursor/data-model.md`.

## Stack

- Next.js App Router (React 19, TypeScript)
- Tailwind CSS v4
- Supabase (Auth + Postgres + RLS)
- Deploy target: Vercel

## Quick start

See **[docs/setup.md](docs/setup.md)** for Supabase migrations, Auth URL configuration, env vars, and seed data.

```bash
npm install
cp .env.example .env.local   # then add your Supabase keys
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |

## Project layout (high level)

- `src/app` — routes (marketing, auth, protected `/app` shell)
- `src/components` — UI + feature components
- `src/lib/domain` — pure finance helpers (month summary, budgets, shared split, join codes)
- `src/lib/supabase` — browser/server/middleware Supabase clients (`@supabase/ssr`)
- `src/server` — server actions (mutations)
- `supabase/migrations` — SQL schema + RLS + `join_bucket_by_code` RPC
- `supabase/seed.sql` — optional demo categories/buckets/entries

## PWA status

Installable metadata and icons are wired; **offline/service worker** support is deferred — see `docs/setup.md`.

## License

Private / all rights reserved unless otherwise noted.
