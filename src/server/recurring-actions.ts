"use server";

import { parseForm } from "@/lib/validation/form";
import { recurringSchema } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type RecurringActionState = { error?: string; fieldErrors?: Record<string, string> };

function bucketIdFromForm(formData: FormData) {
  const raw = String(formData.get("bucket_id") ?? "");
  return raw && raw !== "none" ? raw : undefined;
}

export async function createRecurringTemplate(
  _prev: RecurringActionState,
  formData: FormData,
): Promise<RecurringActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseForm(recurringSchema, {
    transaction_type: formData.get("transaction_type") === "income" ? "income" : "expense",
    amount: String(formData.get("amount") ?? ""),
    title: String(formData.get("title") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined,
    category_id: String(formData.get("category_id") ?? ""),
    bucket_id: bucketIdFromForm(formData),
    frequency: formData.get("frequency") === "weekly" ? "weekly" : "monthly",
    next_due_at: String(formData.get("next_due_at") ?? ""),
  });
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const amount = Number.parseFloat(parsed.data.amount.replace(",", "."));

  const { error } = await supabase.from("recurring_entry_templates").insert({
    created_by_user_id: user.id,
    bucket_id: parsed.data.bucket_id ?? null,
    category_id: parsed.data.category_id,
    transaction_type: parsed.data.transaction_type,
    amount,
    title: parsed.data.title,
    notes: parsed.data.notes ?? null,
    frequency: parsed.data.frequency,
    next_due_at: new Date(parsed.data.next_due_at).toISOString(),
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/app/recurring");
  revalidatePath("/app");
  redirect("/app/recurring?saved=1");
}
