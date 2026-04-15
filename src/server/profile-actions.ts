"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProfileActionState = { error?: string; ok?: boolean };

export async function completeOnboarding(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("display_name") || "").trim();

  if (username.length < 2) return { error: "Username must be at least 2 characters." };
  if (!displayName) return { error: "Display name is required." };

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName,
      email: user.email ?? undefined,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { error: "That username is already taken." };
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
