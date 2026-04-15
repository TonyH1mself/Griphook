"use server";

import { parseForm } from "@/lib/validation/form";
import { onboardingSchema } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProfileActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

export async function completeOnboarding(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseForm(onboardingSchema, {
    username: String(formData.get("username") ?? ""),
    display_name: String(formData.get("display_name") ?? ""),
  });
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const { username, display_name } = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name,
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
