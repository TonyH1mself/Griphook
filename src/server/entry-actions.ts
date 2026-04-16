"use server";

import { parseForm } from "@/lib/validation/form";
import { entrySchema } from "@/lib/validation/schemas";
import { getSafeInternalPath } from "@/lib/url";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type EntryActionState = { error?: string; fieldErrors?: Record<string, string> };

function friendlyEntryError(error: { message?: string; code?: string }): string {
  if (error.code === "42501" || /permission denied|rls|row-level/i.test(error.message ?? "")) {
    return "Du darfst diesen Eintrag hier nicht anlegen oder ändern. Prüfe, ob du Mitglied des gewählten Buckets bist.";
  }
  if (error.code === "23503") {
    return "Diese Kategorie oder dieser Bucket existiert nicht mehr. Bitte andere wählen.";
  }
  if (error.code === "23514") {
    return "Bitte einen gültigen, nicht-negativen Betrag eingeben.";
  }
  if (error.code === "23505") {
    return "Dieser Eintrag existiert bereits. Bitte die Angaben prüfen.";
  }
  if (error.code === "42P17" || /infinite recursion/i.test(error.message ?? "")) {
    return "Datenbank-Policy hat eine Rekursion. Bitte Migration supabase/migrations/20260415200000_bucket_members_rls_fix.sql anwenden.";
  }
  if (error.code === "42703" || /column .* does not exist/i.test(error.message ?? "")) {
    return "Der Datenbank fehlt eine Spalte. Bitte die neuesten Supabase-Migrationen aus supabase/migrations/*.sql anwenden (siehe docs/setup.md).";
  }
  if (error.code === "P0001" && error.message) {
    return error.message;
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

  if (error) {
    console.error("[entry-actions] createEntry insert failed", {
      code: error.code,
      message: error.message,
      details: (error as { details?: string }).details,
      hint: (error as { hint?: string }).hint,
      bucket_id: parsed.data.bucket_id ?? null,
      transaction_type: parsed.data.transaction_type,
    });
    return { error: friendlyEntryError(error) };
  }

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

  if (error) {
    console.error("[entry-actions] updateEntry failed", {
      code: error.code,
      message: error.message,
      details: (error as { details?: string }).details,
      hint: (error as { hint?: string }).hint,
      entry_id: entryId,
      bucket_id: parsed.data.bucket_id ?? null,
      transaction_type: parsed.data.transaction_type,
    });
    return { error: friendlyEntryError(error) };
  }

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

  if (error) {
    console.error("[entry-actions] deleteEntry failed", {
      code: error.code,
      message: error.message,
      entry_id: entryId,
    });
    return { error: friendlyEntryError(error) };
  }

  revalidatePath("/app");
  revalidatePath("/app/entries");
  if (row.bucket_id) revalidatePath(`/app/buckets/${row.bucket_id}`);
  return { ok: true };
}
