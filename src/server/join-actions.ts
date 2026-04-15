"use server";

import { parseForm } from "@/lib/validation/form";
import { joinCodeSchema } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type JoinActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  successBucketId?: string;
  rebalanceHint?: boolean;
};

function mapJoinRpcError(message: string): string {
  if (message.includes("GH_NOT_AUTHENTICATED")) return "Not signed in.";
  if (message.includes("GH_INVALID_CODE")) return "No shared bucket matches that code.";
  if (message.includes("GH_ALREADY_MEMBER")) return "You are already in this bucket.";
  return message || "Could not join bucket.";
}

export async function joinBucketByCode(
  _prev: JoinActionState,
  formData: FormData,
): Promise<JoinActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseForm(joinCodeSchema, {
    code: String(formData.get("code") ?? "").trim(),
  });
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const { data, error } = await supabase.rpc("join_bucket_by_code", { p_code: parsed.data.code });

  if (error) {
    return { error: mapJoinRpcError(error.message ?? "") };
  }

  const bucketId = data as string;

  const { data: members } = await supabase
    .from("bucket_members")
    .select("share_percent")
    .eq("bucket_id", bucketId);

  const sum = members?.reduce((s, m) => s + Number(m.share_percent), 0) ?? 0;
  const rebalanceHint = Math.abs(sum - 100) > 0.01;

  revalidatePath("/app/shared");
  revalidatePath("/app/buckets");
  revalidatePath(`/app/buckets/${bucketId}`);
  return { successBucketId: bucketId, rebalanceHint };
}
