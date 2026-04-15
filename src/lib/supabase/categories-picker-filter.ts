import type { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/**
 * PostgREST `.or()` filter for entry/recurring pickers:
 * system categories plus the signed-in user's non-archived categories.
 */
export function categoriesPickerOrFilter(userId: string): string {
  return `is_system.eq.true,and(created_by_user_id.eq.${userId},is_archived.eq.false)`;
}

/** Categories for dropdowns; keeps the current selection visible even if archived. */
export async function fetchCategoriesForPicker(
  supabase: ServerSupabase,
  userId: string,
  selectedCategoryId: string | null,
): Promise<{ id: string; name: string }[]> {
  const { data: rows } = await supabase
    .from("categories")
    .select("id,name")
    .or(categoriesPickerOrFilter(userId))
    .order("name");

  let list = rows ?? [];
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
