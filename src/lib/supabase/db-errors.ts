/** Shared Postgres / PostgREST error hints for the browser and middleware. */

export function postgresErrorBlob(error: {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}) {
  return [error.message, error.details, error.hint, error.code].filter(Boolean).join(" | ");
}

export function missingProfilesTableMessage(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}): string | null {
  const hint =
    "Database not set up: the profiles table is not available in Supabase. Open the SQL Editor for the same project as NEXT_PUBLIC_SUPABASE_URL on Vercel and run supabase/migrations/*.sql (see docs/setup.md).";
  const blob = postgresErrorBlob(error);
  if (error.code === "PGRST205") return hint;
  if (/schema cache/i.test(blob) && /profiles/i.test(blob)) return hint;
  if (/could not find the table/i.test(blob) && /public\.profiles/i.test(blob)) return hint;
  return null;
}
