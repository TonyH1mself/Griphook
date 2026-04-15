"use server";

import { parseForm } from "@/lib/validation/form";
import { entrySchema } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type EntryActionState = { error?: string; fieldErrors?: Record<string, string> };

function bucketIdFromForm(formData: FormData) {
  const raw = String(formData.get("bucket_id") ?? "");
  return raw && raw !== "none" ? raw : undefined;
}

export async function createEntry(
  _prev: EntryActionState,
  formData: FormData,
): Promise<EntryActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseForm(entrySchema, {
    transaction_type: formData.get("transaction_type") === "income" ? "income" : "expense",
    amount: String(formData.get("amount") ?? ""),
    title: String(formData.get("title") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined,
    category_id: String(formData.get("category_id") ?? ""),
    bucket_id: bucketIdFromForm(formData),
    occurred_at: String(formData.get("occurred_at") ?? ""),
  });
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const amount = Number.parseFloat(parsed.data.amount.replace(",", "."));

  const { error } = await supabase.from("entries").insert({
    transaction_type: parsed.data.transaction_type,
    amount,
    title: parsed.data.title,
    notes: parsed.data.notes ?? null,
    occurred_at: new Date(parsed.data.occurred_at).toISOString(),
    created_by_user_id: user.id,
    category_id: parsed.data.category_id,
    bucket_id: parsed.data.bucket_id ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/entries");
  const bid = parsed.data.bucket_id;
  if (bid) revalidatePath(`/app/buckets/${bid}`);
  redirect("/app/entries?saved=1");
}

export async function updateEntry(
  _prev: EntryActionState,
  formData: FormData,
): Promise<EntryActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const entryId = String(formData.get("entry_id") ?? "");
  if (!entryId) return { error: "Missing entry." };

  const parsed = parseForm(entrySchema, {
    transaction_type: formData.get("transaction_type") === "income" ? "income" : "expense",
    amount: String(formData.get("amount") ?? ""),
    title: String(formData.get("title") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined,
    category_id: String(formData.get("category_id") ?? ""),
    bucket_id: bucketIdFromForm(formData),
    occurred_at: String(formData.get("occurred_at") ?? ""),
  });
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const amount = Number.parseFloat(parsed.data.amount.replace(",", "."));

  const { error } = await supabase
    .from("entries")
    .update({
      transaction_type: parsed.data.transaction_type,
      amount,
      title: parsed.data.title,
      notes: parsed.data.notes ?? null,
      occurred_at: new Date(parsed.data.occurred_at).toISOString(),
      category_id: parsed.data.category_id,
      bucket_id: parsed.data.bucket_id ?? null,
    })
    .eq("id", entryId)
    .eq("created_by_user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/entries");
  revalidatePath(`/app/entries/${entryId}/edit`);
  const bid = parsed.data.bucket_id;
  if (bid) revalidatePath(`/app/buckets/${bid}`);
  redirect("/app/entries?saved=1");
}
