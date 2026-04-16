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
    "Datenbank nicht eingerichtet: Die Tabelle „profiles“ ist in Supabase nicht verfügbar. Bitte in der SQL-Konsole desselben Projekts (entsprechend NEXT_PUBLIC_SUPABASE_URL) die Migrationen unter supabase/migrations/*.sql ausführen (siehe docs/setup.md).";
  const blob = postgresErrorBlob(error);
  if (error.code === "PGRST205") return hint;
  if (/schema cache/i.test(blob) && /profiles/i.test(blob)) return hint;
  if (/could not find the table/i.test(blob) && /public\.profiles/i.test(blob)) return hint;
  return null;
}
