"use server";

import { generateNumericJoinCode } from "@/lib/domain/join-code";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type BucketActionState = { error?: string };

async function allocateJoinCode(supabase: Awaited<ReturnType<typeof createClient>>) {
  for (let i = 0; i < 30; i++) {
    const code = generateNumericJoinCode();
    const { data } = await supabase.from("buckets").select("id").eq("join_code", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not allocate join code");
}

export async function createBucket(_prev: BucketActionState, formData: FormData): Promise<BucketActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const type = formData.get("type") === "shared" ? "shared" : "private";
  const hasBudget = formData.get("has_budget") === "on";
  const budgetAmountRaw = String(formData.get("budget_amount") || "").trim();
  const budgetPeriod = formData.get("budget_period") === "monthly" ? "monthly" : "none";

  if (!name) return { error: "Name is required." };

  const budget_amount =
    hasBudget && budgetAmountRaw ? Number.parseFloat(budgetAmountRaw) : hasBudget ? null : null;

  if (hasBudget && budget_amount != null && !Number.isFinite(budget_amount)) {
    return { error: "Invalid budget amount." };
  }

  let join_code: string | null = null;
  if (type === "shared") {
    join_code = await allocateJoinCode(supabase);
  }

  const { data: bucket, error } = await supabase
    .from("buckets")
    .insert({
      name,
      description,
      type,
      created_by_user_id: user.id,
      has_budget: hasBudget,
      budget_amount: hasBudget ? budget_amount : null,
      budget_period: hasBudget ? budgetPeriod : "none",
      join_code,
    })
    .select("id")
    .single();

  if (error || !bucket) return { error: error?.message ?? "Could not create bucket." };

  if (type === "shared") {
    const { error: memberError } = await supabase.from("bucket_members").insert({
      bucket_id: bucket.id,
      user_id: user.id,
      role: "admin",
      share_percent: 100,
    });
    if (memberError) return { error: memberError.message };
  }

  revalidatePath("/app/buckets");
  redirect(`/app/buckets/${bucket.id}`);
}

export async function regenerateJoinCode(bucketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: bucket } = await supabase.from("buckets").select("id,type").eq("id", bucketId).single();
  if (!bucket || bucket.type !== "shared") return { error: "Not a shared bucket." };

  const { data: admin } = await supabase
    .from("bucket_members")
    .select("role")
    .eq("bucket_id", bucketId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (admin?.role !== "admin") return { error: "Only admins can regenerate the join code." };

  const nextCode = await allocateJoinCode(supabase);
  const { error } = await supabase.from("buckets").update({ join_code: nextCode }).eq("id", bucketId);
  if (error) return { error: error.message };

  revalidatePath(`/app/buckets/${bucketId}`);
  revalidatePath("/app/shared");
  return { ok: true, join_code: nextCode };
}
