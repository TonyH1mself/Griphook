"use server";

import { parseForm } from "@/lib/validation/form";
import { entrySchema } from "@/lib/validation/schemas";
import { getSafeInternalPath } from "@/lib/url";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type EntryActionState = { error?: string; fieldErrors?: Record<string, string> };

function friendlyEntryError(error: { message?: string; code?: string }): string {
  if (error.code === "42501" || /permission denied|rls/i.test(error.message ?? "")) {
    return "Du darfst diesen Eintrag nicht ändern.";
  }
  if (error.code === "23503") {
    return "Diese Kategorie oder dieser Bucket existiert nicht mehr. Bitte andere wählen.";
  }
  return "Etwas ist schiefgelaufen. Bitte erneut versuchen.";
}

function bucketIdFromForm(formData: FormData) {
  const raw = String(formData.get("bucket_id") ?? "");
  return raw && raw !== "none" ? raw : undefined;
}

function transactionTypeFromForm(formData: FormData): "income" | "expense" {
  return formData.get("transaction_type") === "income" ? "income" : "expense";
}

export async function createEntry(
  _prev: EntryActionState,
  formData: FormData,
): Promise<EntryActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du bist nicht angemeldet." };

  const parsed = parseForm(entrySchema, {
    transaction_type: transactionTypeFromForm(formData),
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

  if (error) return { error: friendlyEntryError(error) };

  revalidatePath("/app");
  revalidatePath("/app/entries");
  const bid = parsed.data.bucket_id;
  if (bid) revalidatePath(`/app/buckets/${bid}`);
  const returnTo = String(formData.get("return_to") ?? "").trim();
  if (returnTo) {
    redirect(getSafeInternalPath(returnTo, "/app/entries?saved=1"));
  }
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
  if (!user) return { error: "Du bist nicht angemeldet." };

  const entryId = String(formData.get("entry_id") ?? "");
  if (!entryId) return { error: "Eintrag fehlt." };

  const parsed = parseForm(entrySchema, {
    transaction_type: transactionTypeFromForm(formData),
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

  if (error) return { error: friendlyEntryError(error) };

  revalidatePath("/app");
  revalidatePath("/app/entries");
  revalidatePath(`/app/entries/${entryId}/edit`);
  const bid = parsed.data.bucket_id;
  if (bid) revalidatePath(`/app/buckets/${bid}`);
  redirect("/app/entries?saved=1");
}

export async function deleteEntry(entryId: string): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du bist nicht angemeldet." };

  const { data: row } = await supabase
    .from("entries")
    .select("bucket_id")
    .eq("id", entryId)
    .eq("created_by_user_id", user.id)
    .maybeSingle();

  if (!row) return { error: "Eintrag nicht gefunden oder nicht löschbar." };

  const { error } = await supabase
    .from("entries")
    .delete()
    .eq("id", entryId)
    .eq("created_by_user_id", user.id);

  if (error) return { error: friendlyEntryError(error) };

  revalidatePath("/app");
  revalidatePath("/app/entries");
  if (row.bucket_id) revalidatePath(`/app/buckets/${row.bucket_id}`);
  return { ok: true };
}
