import type { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/**
 * PostgREST `.or()` filter for entry/recurring pickers:
 * system categories plus the signed-in user's non-archived categories.
 */
export function categoriesPickerOrFilter(userId: string): string {
  return `is_system.eq.true,and(created_by_user_id.eq.${userId},is_archived.eq.false)`;
}

/** Fallback OR filter when `categories.is_archived` does not exist yet (older DB). */
export function categoriesPickerOrFilterLegacy(userId: string): string {
  return `is_system.eq.true,created_by_user_id.eq.${userId}`;
}

/**
 * PostgREST signals "column does not exist" via Postgres code 42703 or PGRST200/204
 * with a message mentioning the column. Used to detect when `categories.is_archived`
 * is missing so we can transparently fall back to the legacy filter.
 */
function isMissingIsArchivedColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42703") return true;
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("is_archived") && /column|does not exist|schema cache/.test(msg);
}

export type CategoriesPickerResult = {
  rows: { id: string; name: string }[];
  /** True if the picker query failed for an unrecoverable reason (not a missing column). */
  loadError: boolean;
  /** True if the DB still lacks `categories.is_archived` and we silently fell back. */
  legacyFallback: boolean;
};

/**
 * Robust loader for entry/recurring pickers. Tolerates the case where the
 * `categories.is_archived` migration has not been applied yet, so the create
 * flow does not silently break when only the system categories exist.
 */
export async function loadCategoriesForPicker(
  supabase: ServerSupabase,
  userId: string,
): Promise<CategoriesPickerResult> {
  const primary = await supabase
    .from("categories")
    .select("id,name")
    .or(categoriesPickerOrFilter(userId))
    .order("name");

  if (!primary.error) {
    return { rows: primary.data ?? [], loadError: false, legacyFallback: false };
  }

  if (isMissingIsArchivedColumn(primary.error)) {
    const fallback = await supabase
      .from("categories")
      .select("id,name")
      .or(categoriesPickerOrFilterLegacy(userId))
      .order("name");
    if (!fallback.error) {
      return { rows: fallback.data ?? [], loadError: false, legacyFallback: true };
    }
  }

  return { rows: [], loadError: true, legacyFallback: false };
}

/** Categories for dropdowns; keeps the current selection visible even if archived. */
export async function fetchCategoriesForPicker(
  supabase: ServerSupabase,
  userId: string,
  selectedCategoryId: string | null,
): Promise<{ id: string; name: string }[]> {
  const { rows } = await loadCategoriesForPicker(supabase, userId);

  let list = rows;
  if (selectedCategoryId && !list.some((c) => c.id === selectedCategoryId)) {
    const { data: extra } = await supabase
      .from("categories")
      .select("id,name")
      .eq("id", selectedCategoryId)
      .maybeSingle();
    if (extra) list = [...list, extra];
  }
  return list;
}
