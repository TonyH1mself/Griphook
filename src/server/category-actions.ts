"use server";

import { slugify } from "@/lib/slugify";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CategoryActionState = { error?: string };

export async function createUserCategory(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name is required." };

  const base = slugify(name) || "category";
  const slug = `${base}-${crypto.randomUUID().slice(0, 8)}`;

  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    created_by_user_id: user.id,
    is_system: false,
  });

  if (error) {
    if (error.code === "23505") return { error: "A category with a similar id already exists. Try again." };
    return { error: error.message };
  }

  revalidatePath("/app/entries");
  revalidatePath("/app/recurring");
  return {};
}
