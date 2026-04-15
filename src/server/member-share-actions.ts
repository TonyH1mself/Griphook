"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MemberSharesState = { error?: string; ok?: boolean };

function friendlyError(error: { message?: string; code?: string }): string {
  if (error.code === "42501" || /permission denied|rls/i.test(error.message ?? "")) {
    return "You do not have permission to update member shares.";
  }
  return error.message ?? "Could not save shares.";
}

export async function updateBucketMemberShares(
  _prev: MemberSharesState,
  formData: FormData,
): Promise<MemberSharesState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const bucketId = String(formData.get("bucket_id") ?? "").trim();
  if (!bucketId) return { error: "Missing bucket." };

  const { data: admin } = await supabase
    .from("bucket_members")
    .select("role")
    .eq("bucket_id", bucketId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (admin?.role !== "admin") {
    return { error: "Only admins can update share percentages." };
  }

  const { data: members } = await supabase
    .from("bucket_members")
    .select("user_id")
    .eq("bucket_id", bucketId);

  if (!members?.length) return { error: "No members found." };

  const pairs: { userId: string; pct: number }[] = [];
  for (const m of members) {
    const raw = String(formData.get(`share_${m.user_id}`) ?? "").trim().replace(",", ".");
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n)) return { error: "Enter a valid number for each member." };
    if (n < 0 || n > 100) return { error: "Each share must be between 0 and 100%." };
    pairs.push({ userId: m.user_id, pct: n });
  }

  const sum = pairs.reduce((s, p) => s + p.pct, 0);
  if (Math.abs(sum - 100) > 0.02) {
    return { error: `Shares must total 100% (currently ${sum.toFixed(1)}%).` };
  }

  for (const p of pairs) {
    const { error } = await supabase
      .from("bucket_members")
      .update({ share_percent: p.pct })
      .eq("bucket_id", bucketId)
      .eq("user_id", p.userId);
    if (error) return { error: friendlyError(error) };
  }

  revalidatePath(`/app/buckets/${bucketId}`);
  revalidatePath("/app/shared");
  revalidatePath(`/app/shared/${bucketId}`);
  return { ok: true };
}
