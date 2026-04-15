"use server";

import { slugify } from "@/lib/slugify";
import { parseForm } from "@/lib/validation/form";
import { categoryCreateSchema, categoryUpdateSchema } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CategoryActionState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean };

function friendlyCategoryError(error: { message?: string; code?: string }): string {
  if (error.code === "42501" || /permission denied|rls/i.test(error.message ?? "")) {
    return "You do not have permission to change categories.";
  }
  if (error.code === "23505") {
    return "A category with that name already exists. Try a different name.";
  }
  if (/is_archived|column/i.test(error.message ?? "")) {
    return "Database is missing the latest migration. Run supabase/migrations/20260415210000_categories_is_archived.sql (see docs/setup.md).";
  }
  return "Something went wrong. Please try again.";
}

export async function createUserCategory(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseForm(categoryCreateSchema, {
    name: String(formData.get("name") ?? ""),
  });
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const base = slugify(parsed.data.name) || "category";
  const slug = `${base}-${crypto.randomUUID().slice(0, 8)}`;

  const { error } = await supabase.from("categories").insert({
    name: parsed.data.name,
    slug,
    created_by_user_id: user.id,
    is_system: false,
    is_archived: false,
  });

  if (error) return { error: friendlyCategoryError(error) };

  revalidatePath("/app/categories");
  revalidatePath("/app");
  return { ok: true };
}

export async function updateUserCategory(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const categoryId = String(formData.get("category_id") ?? "").trim();
  if (!categoryId) return { error: "Missing category." };

  const parsed = parseForm(categoryUpdateSchema, {
    name: String(formData.get("name") ?? ""),
  });
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const base = slugify(parsed.data.name) || "category";
  const slug = `${base}-${crypto.randomUUID().slice(0, 8)}`;

  const { data: updated, error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      slug,
    })
    .eq("id", categoryId)
    .eq("created_by_user_id", user.id)
    .eq("is_system", false)
    .select("id")
    .maybeSingle();

  if (error) return { error: friendlyCategoryError(error) };
  if (!updated) return { error: "Category not found or cannot be edited." };

  revalidatePath("/app/categories");
  revalidatePath("/app");
  return { ok: true };
}

export async function setCategoryArchived(
  categoryId: string,
  archived: boolean,
): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: updated, error } = await supabase
    .from("categories")
    .update({ is_archived: archived })
    .eq("id", categoryId)
    .eq("created_by_user_id", user.id)
    .eq("is_system", false)
    .select("id")
    .maybeSingle();

  if (error) return { error: friendlyCategoryError(error) };
  if (!updated) return { error: "Category not found." };

  revalidatePath("/app/categories");
  revalidatePath("/app");
  return { ok: true };
}
