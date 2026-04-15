"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type JoinActionState = { error?: string; successBucketId?: string };

export async function joinBucketByCode(
  _prev: JoinActionState,
  formData: FormData,
): Promise<JoinActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const raw = String(formData.get("code") || "").trim();
  if (!/^[0-9]{6}$/.test(raw)) return { error: "Enter a 6-digit code." };

  const { data, error } = await supabase.rpc("join_bucket_by_code", { p_code: raw });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("already_member")) return { error: "You are already a member of this bucket." };
    if (msg.includes("invalid_code")) return { error: "No shared bucket matches that code." };
    return { error: msg || "Could not join bucket." };
  }

  const bucketId = data as string;
  revalidatePath("/app/shared");
  revalidatePath("/app/buckets");
  return { successBucketId: bucketId };
}
