"use server";

import { generateNumericJoinCode } from "@/lib/domain/join-code";
import { parseForm } from "@/lib/validation/form";
import { bucketBudgetSchema, bucketCreateSchema, bucketMetaSchema } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type BucketActionState = { error?: string; fieldErrors?: Record<string, string> };

async function allocateJoinCode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  excludeBucketId?: string,
) {
  for (let i = 0; i < 30; i++) {
    const code = generateNumericJoinCode();
    const { data } = await supabase
      .from("buckets")
      .select("id")
      .eq("join_code", code)
      .maybeSingle();
    if (!data) return code;
    if (excludeBucketId && data.id === excludeBucketId) continue;
    /* another bucket uses this code */ continue;
  }
  throw new Error("Could not allocate join code");
}

export async function createBucket(
  _prev: BucketActionState,
  formData: FormData,
): Promise<BucketActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseForm(bucketCreateSchema, {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? "").trim() || undefined,
    type: formData.get("type") === "shared" ? "shared" : "private",
    has_budget: formData.get("has_budget") === "on",
    budget_amount: String(formData.get("budget_amount") ?? ""),
    budget_period: formData.get("budget_period") === "monthly" ? "monthly" : "none",
  });
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const { name, description, type, has_budget, budget_period } = parsed.data;
  let budget_amount: number | null = null;
  if (has_budget && parsed.data.budget_amount) {
    budget_amount = Number.parseFloat(parsed.data.budget_amount);
  }

  let join_code: string | null = null;
  if (type === "shared") {
    join_code = await allocateJoinCode(supabase);
  }

  const { data: bucket, error } = await supabase
    .from("buckets")
    .insert({
      name,
      description: description ?? null,
      type,
      created_by_user_id: user.id,
      has_budget,
      budget_amount: has_budget ? budget_amount : null,
      budget_period: has_budget ? budget_period : "none",
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

export async function updateBucketMeta(
  bucketId: string,
  _prev: BucketActionState,
  formData: FormData,
): Promise<BucketActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseForm(bucketMetaSchema, {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? "").trim() || undefined,
  });
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const { error } = await supabase
    .from("buckets")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    .eq("id", bucketId);

  if (error) return { error: error.message };

  revalidatePath(`/app/buckets/${bucketId}`);
  revalidatePath("/app/buckets");
  revalidatePath("/app");
  return {};
}

export async function updateBucketBudget(
  bucketId: string,
  _prev: BucketActionState,
  formData: FormData,
): Promise<BucketActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseForm(bucketBudgetSchema, {
    has_budget: formData.get("has_budget") === "on",
    budget_amount: String(formData.get("budget_amount") ?? ""),
    budget_period: formData.get("budget_period") === "monthly" ? "monthly" : "none",
  });
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  let budget_amount: number | null = null;
  if (parsed.data.has_budget && parsed.data.budget_amount) {
    budget_amount = Number.parseFloat(parsed.data.budget_amount);
  }

  const { error } = await supabase
    .from("buckets")
    .update({
      has_budget: parsed.data.has_budget,
      budget_amount: parsed.data.has_budget ? budget_amount : null,
      budget_period: parsed.data.has_budget ? parsed.data.budget_period : "none",
    })
    .eq("id", bucketId);

  if (error) return { error: error.message };

  revalidatePath(`/app/buckets/${bucketId}`);
  revalidatePath("/app/buckets");
  revalidatePath("/app");
  return {};
}

export async function archiveBucket(bucketId: string): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("buckets").update({ is_archived: true }).eq("id", bucketId);
  if (error) return { error: error.message };

  revalidatePath("/app/buckets");
  revalidatePath("/app");
  revalidatePath(`/app/buckets/${bucketId}`);
  return { ok: true };
}

export async function regenerateJoinCode(bucketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: bucket } = await supabase
    .from("buckets")
    .select("id,type")
    .eq("id", bucketId)
    .single();
  if (!bucket || bucket.type !== "shared") return { error: "Not a shared bucket." };

  const { data: admin } = await supabase
    .from("bucket_members")
    .select("role")
    .eq("bucket_id", bucketId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (admin?.role !== "admin") return { error: "Only admins can regenerate the join code." };

  const nextCode = await allocateJoinCode(supabase, bucketId);
  const { error } = await supabase
    .from("buckets")
    .update({ join_code: nextCode })
    .eq("id", bucketId);
  if (error) return { error: error.message };

  revalidatePath(`/app/buckets/${bucketId}`);
  revalidatePath("/app/shared");
  return { ok: true, join_code: nextCode };
}
