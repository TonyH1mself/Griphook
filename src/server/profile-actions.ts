"use server";

import { missingProfilesTableMessage } from "@/lib/supabase/db-errors";
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

  const row = {
    id: user.id,
    username,
    display_name,
    email: user.email ?? null,
  };

  const { data, error } = await supabase.from("profiles").upsert(row, { onConflict: "id" }).select("id").single();

  if (error) {
    if (error.code === "23505") return { error: "That username is already taken." };
    const setupHint = missingProfilesTableMessage(error);
    if (setupHint) return { error: setupHint };
    return { error: "We could not save your profile. Please try again." };
  }

  if (!data?.id) {
    return {
      error:
        "We could not save your profile. If this keeps happening, confirm migrations are applied in Supabase (see docs/setup.md).",
    };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
